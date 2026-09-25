import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  list,
  get,
  insert,
  update,
  remove,
  supabase,
  demo,
  configured,
  publishContent,
  localDir,
} from "./store";
import {
  requireAuth,
  adminOnly,
  demoLogin,
  demoLogout,
  type AuthRequest,
} from "./auth";
import {
  enquirySchema,
  applicationSchema,
  kinds,
  slugSchema,
  validateDocument,
  isPdf,
} from "./validation";
import { notifySubmission } from "./notifications";
import { settings } from "../src/seed";
import type { PublicData, Content } from "../src/types";
export const api = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 15 },
});
const formLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please try again later." },
});
export async function publicData(
  url: string,
  preview = false,
): Promise<PublicData> {
  const all = (await list("content")) as Content[];
  const records = all
    .filter((r) => (preview ? r.draft : r.published) && r.kind !== "settings")
    .map((r) => ({
      ...r,
      draft: {},
      published: preview ? r.draft : r.published,
    }));
  const globals = all.find((r) => r.id === "settings");
  return {
    settings:
      ((preview ? globals?.draft : globals?.published) as any) || settings,
    records,
    media: await list("media"),
    page: records.find((r) => r.kind === "page" && r.slug === url) || null,
    demo,
    preview,
  };
}
api.get("/config", (_req, res) =>
  res.json({
    demo,
    configured,
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    demoLoginEnabled: demo && !!process.env.DEMO_ADMIN_PASSWORD,
  }),
);
api.get("/content", async (req, res) =>
  res.json(await publicData(String(req.query.path || "/"))),
);
api.post("/auth/demo", authLimit, (req, res) => {
  const token = demoLogin(String(req.body.password || ""));
  if (!token)
    return res.status(401).json({
      error:
        "Unable to sign in. Check the password and local demo configuration.",
    });
  res.json({ token });
});
api.post("/auth/logout", requireAuth, (req, res) => {
  demoLogout(req.headers.authorization?.replace("Bearer ", "") || "");
  res.json({ ok: true });
});
api.get("/me", requireAuth, (req: AuthRequest, res) => res.json(req.user));
api.get("/admin/content", requireAuth, async (_req, res) =>
  res.json(await list("content")),
);
api.get("/admin/preview", requireAuth, async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await publicData(String(req.query.path || "/"), true));
});
function routeKey(kind: string, slug: string) {
  if (kind === "page") return slug;
  const prefix: Record<string, string> = {
    service: "/services/",
    project: "/work/",
    job: "/careers/",
  };
  return prefix[kind] ? prefix[kind] + slug : `${kind}:${slug}`;
}
api.post("/admin/content", requireAuth, async (req, res) => {
  const { kind, slug, title } = z
    .object({
      kind: z.enum(kinds).refine((v) => v !== "settings"),
      slug: z.string().min(1).max(150),
      title: z.string().min(1).max(180),
    })
    .parse(req.body);
  if (kind === "page") slugSchema.parse(slug);
  else
    z.string()
      .regex(/^[a-z0-9-]+$/)
      .parse(slug);
  if (
    (await list("content")).some(
      (r) => routeKey(r.kind, r.slug) === routeKey(kind, slug),
    )
  )
    return res.status(409).json({ error: "This URL is already in use" });
  const draft =
    kind === "page"
      ? { title, description: "", blocks: { content: [], root: { props: {} } } }
      : { title, sample: false, ...(kind === "job" ? { open: false } : {}) };
  res.status(201).json(
    await insert("content", {
      id: randomUUID(),
      kind,
      slug,
      draft,
      published: null,
      version: 1,
      updated_at: new Date().toISOString(),
    }),
  );
});
api.put("/admin/content/:id", requireAuth, async (req, res) => {
  const row = await get("content", String(req.params.id));
  if (!row) return res.status(404).json({ error: "Content not found" });
  const { draft, version } = z
    .object({
      draft: z.record(z.string(), z.any()),
      version: z.number().int().positive(),
    })
    .parse(req.body);
  validateDocument(row.kind, draft);
  const slug = String(req.body.slug || row.slug);
  if (row.kind === "page") slugSchema.parse(slug);
  else if (row.kind !== "settings")
    z.string()
      .regex(/^[a-z0-9-]+$/)
      .parse(slug);
  if (row.published && slug !== row.slug)
    return res
      .status(400)
      .json({ error: "Unpublish this item before changing its URL" });
  if (
    (await list("content")).some(
      (r) =>
        r.id !== row.id &&
        routeKey(r.kind, r.slug) === routeKey(row.kind, slug),
    )
  )
    return res.status(409).json({ error: "This URL is already in use" });
  res.json(
    await update(
      "content",
      row.id,
      {
        draft,
        slug,
        version: version + 1,
        updated_at: new Date().toISOString(),
      },
      version,
    ),
  );
});
api.post(
  "/admin/content/:id/publish",
  requireAuth,
  adminOnly,
  async (req: AuthRequest, res) => {
    const row = await get("content", String(req.params.id));
    if (!row) return res.status(404).json({ error: "Content not found" });
    if (row.draft.sample)
      return res.status(400).json({
        error:
          "Replace the sample content and clear its sample flag before publishing",
      });
    validateDocument(row.kind, row.draft);
    const version = z.number().int().parse(req.body.version);
    res.json(await publishContent(row.id, version, row.draft, req.user!.id));
  },
);
api.post(
  "/admin/content/:id/unpublish",
  requireAuth,
  adminOnly,
  async (req: AuthRequest, res) => {
    const row = await get("content", String(req.params.id));
    if (!row) return res.status(404).json({ error: "Content not found" });
    if (row.id === "settings" || row.slug === "/")
      return res.status(400).json({
        error: "The homepage and site settings must remain published",
      });
    res.json(
      await publishContent(
        row.id,
        z.number().parse(req.body.version),
        null,
        req.user!.id,
      ),
    );
  },
);
api.get("/admin/content/:id/revisions", requireAuth, async (req, res) =>
  res.json(
    (await list("revisions"))
      .filter((r) => r.content_id === req.params.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  ),
);
api.post(
  "/admin/content/:id/restore",
  requireAuth,
  adminOnly,
  async (req, res) => {
    const row = await get("content", String(req.params.id));
    const rev = await get("revisions", String(req.body.revisionId));
    if (!row || !rev || rev.content_id !== row.id)
      return res.status(404).json({ error: "Revision not found" });
    res.json(
      await update(
        "content",
        row.id,
        {
          draft: rev.data,
          version: row.version + 1,
          updated_at: new Date().toISOString(),
        },
        z.number().parse(req.body.version),
      ),
    );
  },
);
api.delete("/admin/content/:id", requireAuth, adminOnly, async (req, res) => {
  const row = await get("content", String(req.params.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  if (row.published || row.id === "settings")
    return res
      .status(400)
      .json({ error: "Unpublish the item before deleting it" });
  await remove("content", row.id);
  res.json({ ok: true });
});
async function saveFile(
  bucket: string,
  name: string,
  buffer: Buffer,
  mime: string,
) {
  if (supabase) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(name, buffer, { contentType: mime, upsert: false });
    if (error) throw error;
    return bucket === "media"
      ? supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl
      : name;
  }
  const folder = path.join(localDir, bucket);
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, name), buffer);
  return bucket === "media" ? `/demo-media/${name}` : name;
}
api.get("/admin/media", requireAuth, async (_req, res) =>
  res.json(await list("media")),
);
api.post(
  "/admin/media",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Choose an image" });
    let buffer: Buffer;
    try {
      const input = sharp(req.file.buffer, { limitInputPixels: 40000000 });
      const metadata = await input.metadata();
      if (
        !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format || "")
      )
        throw new Error("Unsupported image");
      buffer = await input
        .rotate()
        .resize({
          width: 2200,
          height: 2200,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      return res
        .status(400)
        .json({ error: "Upload a valid JPG, PNG, WebP, or AVIF image" });
    }
    const id = randomUUID(),
      name = `${id}.webp`;
    const url = await saveFile("media", name, buffer, "image/webp");
    res.status(201).json(
      await insert("media", {
        id,
        url,
        path: name,
        name: req.file.originalname.slice(0, 180),
        alt: String(req.body.alt || "").slice(0, 500),
        focal_x: 50,
        focal_y: 50,
        created_at: new Date().toISOString(),
      }),
    );
  },
);
api.patch("/admin/media/:id", requireAuth, async (req, res) => {
  const patch = z
    .object({
      alt: z.string().max(500),
      focal_x: z.number().min(0).max(100),
      focal_y: z.number().min(0).max(100),
    })
    .parse(req.body);
  res.json(await update("media", String(req.params.id), patch));
});
api.delete("/admin/media/:id", requireAuth, adminOnly, async (req, res) => {
  const row = await get("media", String(req.params.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  const records = [...(await list("content")), ...(await list("revisions"))];
  if (records.some((r) => JSON.stringify(r).includes(row.url)))
    return res.status(409).json({
      error:
        "This image is used in content or a revision and cannot be deleted",
    });
  if (supabase) {
    const { error } = await supabase.storage.from("media").remove([row.path]);
    if (error) throw error;
  } else unlinkSync(path.join(localDir, "media", row.path));
  await remove("media", row.id);
  res.json({ ok: true });
});
api.post("/enquiries", formLimit, async (req, res) => {
  const data = enquirySchema.parse(req.body);
  if (data.website) return res.status(201).json({ ok: true });
  const { website, ...fields } = data;
  const id = randomUUID();
  await insert("submissions", {
    id,
    kind: "enquiry",
    ...fields,
    status: "new",
    notes: "",
    notification_status: "pending",
    created_at: new Date().toISOString(),
  });
  void notifySubmission(id);
  res.status(201).json({ ok: true });
});
api.post(
  "/applications",
  formLimit,
  upload.single("resume"),
  async (req, res) => {
    const data = applicationSchema.parse(req.body);
    if (data.website) return res.status(201).json({ ok: true });
    const job = await get("content", data.job_id);
    if (!job || job.kind !== "job" || !job.published?.open)
      return res
        .status(409)
        .json({ error: "This position is no longer accepting applications" });
    if (!req.file || req.file.size > 5 * 1024 * 1024 || !isPdf(req.file.buffer))
      return res
        .status(400)
        .json({ error: "Please upload a valid PDF résumé under 5 MB" });
    const id = randomUUID();
    const resume_path = await saveFile(
      "resumes",
      `${id}.pdf`,
      req.file.buffer,
      "application/pdf",
    );
    const { website, ...fields } = data;
    try {
      await insert("submissions", {
        id,
        kind: "application",
        ...fields,
        resume_path,
        status: "new",
        notes: "",
        notification_status: "pending",
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      if (supabase)
        await supabase.storage.from("resumes").remove([resume_path]);
      else unlinkSync(path.join(localDir, "resumes", resume_path));
      throw e;
    }
    void notifySubmission(id);
    res.status(201).json({ ok: true });
  },
);
api.get("/admin/submissions", requireAuth, async (_req, res) =>
  res.json(
    (await list("submissions")).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    ),
  ),
);
api.patch("/admin/submissions/:id", requireAuth, async (req, res) => {
  const patch = z
    .object({
      status: z.enum(["new", "in_progress", "completed", "archived"]),
      notes: z.string().max(10000),
    })
    .parse(req.body);
  res.json(await update("submissions", String(req.params.id), patch));
});
api.post("/admin/submissions/:id/retry", requireAuth, async (req, res) => {
  if (!(await get("submissions", String(req.params.id))))
    return res.status(404).json({ error: "Not found" });
  await notifySubmission(String(req.params.id));
  res.json(await get("submissions", String(req.params.id)));
});
api.get("/admin/submissions/:id/resume", requireAuth, async (req, res) => {
  const row = await get("submissions", String(req.params.id));
  if (!row?.resume_path)
    return res.status(404).json({ error: "Résumé not found" });
  res.set("Cache-Control", "no-store");
  if (supabase) {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(row.resume_path, 60, { download: "resume.pdf" });
    if (error) throw error;
    res.json({ url: data.signedUrl });
  } else
    res
      .type("pdf")
      .attachment("resume.pdf")
      .send(
        readFileSync(
          path.join(localDir, "resumes", path.basename(row.resume_path)),
        ),
      );
});
api.get("/admin/users", requireAuth, adminOnly, async (_req, res) =>
  res.json(await list("profiles")),
);
api.post("/admin/users", requireAuth, adminOnly, async (req, res) => {
  if (!supabase)
    return res
      .status(400)
      .json({ error: "Connect Supabase to invite real team members" });
  const data = z
    .object({ email: z.email(), role: z.enum(["admin", "editor"]) })
    .parse(req.body);
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(
    data.email,
    { redirectTo: `${process.env.SITE_URL}/admin` },
  );
  if (error) throw error;
  res.status(201).json(
    await insert("profiles", {
      id: invited.user.id,
      email: data.email,
      role: data.role,
      disabled: false,
    }),
  );
});
api.patch(
  "/admin/users/:id",
  requireAuth,
  adminOnly,
  async (req: AuthRequest, res) => {
    if (req.params.id === req.user!.id)
      return res
        .status(400)
        .json({ error: "You cannot change your own access" });
    const patch = z
      .object({ role: z.enum(["admin", "editor"]), disabled: z.boolean() })
      .parse(req.body);
    res.json(await update("profiles", String(req.params.id), patch));
  },
);
