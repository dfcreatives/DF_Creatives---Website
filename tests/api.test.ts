import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { adminOnly } from "../server/auth";
const base = "http://127.0.0.1:3101";
let server: ChildProcess,
  dir: string,
  auth = "";
async function request(
  route: string,
  method = "GET",
  data?: any,
  authenticated = true,
) {
  return fetch(base + route, {
    method,
    headers: {
      ...(data instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(authenticated && auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body:
      data === undefined
        ? undefined
        : data instanceof FormData
          ? data
          : JSON.stringify(data),
  });
}
async function json(route: string, method = "GET", data?: any) {
  const r = await request(route, method, data);
  const body = await r.json();
  assert.ok(r.ok, JSON.stringify(body));
  return body;
}
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "df-api-test-"));
  server = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: "3101",
      DATA_DIR: dir,
      SITE_URL: base,
      DEMO_ADMIN_PASSWORD: "test-password-for-api",
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      RESEND_API_KEY: "",
    },
    stdio: "pipe",
  });
  let output = "";
  server.stderr?.on("data", (d) => (output += d.toString()));
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/health")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
    if (i === 99) throw new Error(output || "Test server did not start");
  }
  const response = await request(
    "/api/auth/demo",
    "POST",
    { password: "test-password-for-api" },
    false,
  );
  auth = (await response.json()).token;
  assert.ok(auth);
});
after(async () => {
  server?.kill("SIGTERM");
  await new Promise((r) => setTimeout(r, 400));
  if (dir) await rm(dir, { recursive: true, force: true });
});
test("public pages render on server with SEO, no unpublished claims", async () => {
  const r = await fetch(base);
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(html, /Big ideas/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /rel="canonical"/);
  assert.doesNotMatch(html, /sample-testimonial|Sample client/);
  assert.equal((await fetch(base + "/missing-route")).status, 404);
  assert.match(
    await (await fetch(base + "/sitemap.xml")).text(),
    /services\/content-creation/,
  );
});
test("all private surfaces reject unauthenticated access", async () => {
  for (const route of [
    "/api/admin/content",
    "/api/admin/media",
    "/api/admin/submissions",
    "/api/admin/users",
    "/api/admin/preview",
  ])
    assert.equal((await request(route, "GET", undefined, false)).status, 401);
});
test("server publishing middleware rejects editor role", () => {
  let status = 0,
    called = false;
  adminOnly(
    { user: { id: "editor", role: "editor" } } as any,
    {
      status(s: number) {
        status = s;
        return this;
      },
      json() {
        return this;
      },
    } as any,
    () => {
      called = true;
    },
  );
  assert.equal(status, 403);
  assert.equal(called, false);
});
test("drafts stay private; publish, conflict detection and restoration work", async () => {
  let row = await json("/api/admin/content", "POST", {
    kind: "page",
    title: "Testing",
    slug: "/testing-page",
  });
  const initial = {
    title: "Testing",
    description: "A test page",
    blocks: {
      content: [
        {
          type: "CTA",
          props: {
            id: "test-cta",
            title: "Original headline",
            buttonHref: "/contact",
            buttonLabel: "Contact",
          },
        },
      ],
    },
  };
  row = await json(`/api/admin/content/${row.id}`, "PUT", {
    draft: initial,
    version: row.version,
  });
  assert.equal((await json("/api/content?path=/testing-page")).page, null);
  row = await json(`/api/admin/content/${row.id}/publish`, "POST", {
    version: row.version,
  });
  assert.equal(
    (await json("/api/content?path=/testing-page")).page.published.title,
    "Testing",
  );
  let next = structuredClone(initial);
  next.title = "Private changes";
  row = await json(`/api/admin/content/${row.id}`, "PUT", {
    draft: next,
    version: row.version,
  });
  assert.equal(
    (await json("/api/content?path=/testing-page")).page.published.title,
    "Testing",
  );
  assert.equal(
    (
      await request(`/api/admin/content/${row.id}`, "PUT", {
        draft: next,
        version: 1,
      })
    ).status,
    409,
  );
  row = await json(`/api/admin/content/${row.id}/publish`, "POST", {
    version: row.version,
  });
  const history = await json(`/api/admin/content/${row.id}/revisions`);
  assert.equal(history.length, 1);
  row = await json(`/api/admin/content/${row.id}/restore`, "POST", {
    revisionId: history[0].id,
    version: row.version,
  });
  assert.equal(row.draft.title, "Testing");
  assert.equal(row.published.title, "Private changes");
  row = await json(`/api/admin/content/${row.id}/unpublish`, "POST", {
    version: row.version,
  });
  assert.equal((await json("/api/content?path=/testing-page")).page, null);
});
test("sample content cannot be published", async () => {
  const row = (await json("/api/admin/content")).find(
    (r: any) => r.id === "testimonial-sample",
  );
  assert.equal(
    (
      await request(`/api/admin/content/${row.id}/publish`, "POST", {
        version: row.version,
      })
    ).status,
    400,
  );
});
test("settings drafts are isolated from public rendering", async () => {
  const row = (await json("/api/admin/content")).find(
    (r: any) => r.id === "settings",
  );
  await json("/api/admin/content/settings", "PUT", {
    draft: { ...row.draft, name: "Private studio name" },
    version: row.version,
  });
  assert.equal((await json("/api/content")).settings.name, "DF Creatives");
});
test("enquiries persist once even when email is unavailable; notes update", async () => {
  assert.equal(
    (
      await request(
        "/api/enquiries",
        "POST",
        { name: "x", email: "bad", message: "x" },
        false,
      )
    ).status,
    400,
  );
  await json("/api/enquiries", "POST", {
    name: "API Visitor",
    email: "visitor@example.com",
    message: "We would like a brand campaign.",
    website: "",
  });
  let rows = await json("/api/admin/submissions");
  const row = rows.find((r: any) => r.name === "API Visitor");
  assert.ok(row);
  await json(`/api/admin/submissions/${row.id}/retry`, "POST");
  rows = await json("/api/admin/submissions");
  assert.equal(rows.filter((r: any) => r.name === "API Visitor").length, 1);
  assert.equal(
    rows.find((r: any) => r.id === row.id).notification_status,
    "not_configured",
  );
  const updated = await json(`/api/admin/submissions/${row.id}`, "PATCH", {
    status: "in_progress",
    notes: "Follow up next week.",
  });
  assert.equal(updated.notes, "Follow up next week.");
});
test("honeypot submissions are silently discarded", async () => {
  const before = (await json("/api/admin/submissions")).length;
  await json("/api/enquiries", "POST", {
    name: "Bot Visitor",
    email: "bot@example.com",
    message: "Automated submission for spam.",
    website: "https://spam.example",
  });
  assert.equal((await json("/api/admin/submissions")).length, before);
});
test("images are optimized, metadata persists, references prevent deletion", async () => {
  let form = new FormData();
  form.append(
    "file",
    new Blob(["not an image"], { type: "image/png" }),
    "bad.png",
  );
  assert.equal((await request("/api/admin/media", "POST", form)).status, 400);
  form = new FormData();
  form.append(
    "file",
    new Blob([await readFile("public/images/studio.jpg")], {
      type: "image/jpeg",
    }),
    "photo.jpg",
  );
  const media = await json("/api/admin/media", "POST", form);
  assert.match(media.url, /\.webp$/);
  const details = await json(`/api/admin/media/${media.id}`, "PATCH", {
    alt: "A creative photograph",
    focal_x: 25,
    focal_y: 65,
  });
  assert.equal(details.focal_x, 25);
  let row = await json("/api/admin/content", "POST", {
    kind: "project",
    title: "Image test",
    slug: "image-test",
  });
  await json(`/api/admin/content/${row.id}`, "PUT", {
    draft: { title: "Image test", image: media.url },
    version: row.version,
  });
  assert.equal(
    (await request(`/api/admin/media/${media.id}`, "DELETE")).status,
    409,
  );
});
test("closed jobs reject applications and résumés remain private", async () => {
  let job = await json("/api/admin/content", "POST", {
    kind: "job",
    title: "Test role",
    slug: "test-role",
  });
  job = await json(`/api/admin/content/${job.id}`, "PUT", {
    draft: { title: "Test role", open: true, sample: false },
    version: job.version,
  });
  job = await json(`/api/admin/content/${job.id}/publish`, "POST", {
    version: job.version,
  });
  const makeForm = (valid = true) => {
    const form = new FormData();
    for (const [k, v] of Object.entries({
      name: "Test Applicant",
      email: "applicant@example.com",
      message: "I would like to apply for this role.",
      job_id: job.id,
    }))
      form.set(k, v);
    form.set(
      "resume",
      new Blob([valid ? "%PDF-1.7\nTest resume\n%%EOF" : "invalid"], {
        type: "application/pdf",
      }),
      "resume.pdf",
    );
    return form;
  };
  assert.equal(
    (await request("/api/applications", "POST", makeForm(false), false)).status,
    400,
  );
  await json("/api/applications", "POST", makeForm());
  const application = (await json("/api/admin/submissions")).find(
    (r: any) => r.kind === "application",
  );
  assert.ok(application.resume_path);
  assert.equal(
    (
      await request(
        `/api/admin/submissions/${application.id}/resume`,
        "GET",
        undefined,
        false,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await request(`/api/admin/submissions/${application.id}/resume`)
    ).headers.get("content-type"),
    "application/pdf",
  );
  assert.equal(
    (await fetch(base + "/demo-media/" + application.resume_path)).status,
    404,
  );
  job = await json(`/api/admin/content/${job.id}`, "PUT", {
    draft: { ...job.draft, open: false },
    version: job.version,
  });
  await json(`/api/admin/content/${job.id}/publish`, "POST", {
    version: job.version,
  });
  assert.equal(
    (await request("/api/applications", "POST", makeForm(), false)).status,
    409,
  );
});
test("writes survive disk reload", async () => {
  const data = JSON.parse(await readFile(path.join(dir, "data.json"), "utf8"));
  assert.ok(data.content.some((r: any) => r.slug === "test-role"));
  assert.ok(
    data.submissions.some((s: any) => s.email === "applicant@example.com"),
  );
  assert.ok(data.revisions.length > 0);
});

test("block ordering and visibility are preserved by publishing and SSR", async () => {
  let row = await json("/api/admin/content", "POST", {
    kind: "page",
    title: "Block behavior",
    slug: "/block-behavior",
  });
  const blocks = [
    {
      type: "CTA",
      props: { id: "block-a", title: "First visible block", hidden: false },
    },
    {
      type: "CTA",
      props: { id: "block-b", title: "Second visible block", hidden: false },
    },
  ];
  row = await json(`/api/admin/content/${row.id}`, "PUT", {
    draft: {
      title: "Block behavior",
      description: "Block order testing",
      blocks: { content: blocks },
    },
    version: row.version,
  });
  row = await json(`/api/admin/content/${row.id}/publish`, "POST", {
    version: row.version,
  });
  let html = (await (await fetch(base + "/block-behavior")).text()).split(
    "<script>window.__DF_DATA__",
  )[0];
  assert.ok(
    html.indexOf("First visible block") < html.indexOf("Second visible block"),
  );
  const reordered = structuredClone(row.draft);
  reordered.blocks.content.reverse();
  reordered.blocks.content[1].props.hidden = true;
  row = await json(`/api/admin/content/${row.id}`, "PUT", {
    draft: reordered,
    version: row.version,
  });
  await json(`/api/admin/content/${row.id}/publish`, "POST", {
    version: row.version,
  });
  html = (await (await fetch(base + "/block-behavior")).text()).split(
    "<script>window.__DF_DATA__",
  )[0];
  assert.match(html, /Second visible block/);
  assert.doesNotMatch(html, /First visible block/);
  const live = await json("/api/content?path=/block-behavior");
  assert.equal(live.page.published.blocks.content[0].props.id, "block-b");
});

test("custom pages cannot shadow service routes", async () => {
  assert.equal(
    (
      await request("/api/admin/content", "POST", {
        kind: "page",
        title: "Shadow route",
        slug: "/services/content-creation",
      })
    ).status,
    409,
  );
});
