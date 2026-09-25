import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/no-external.css";
import {
  LayoutDashboard,
  Files,
  Layers,
  Image as ImageIcon,
  Inbox,
  Settings,
  Users,
  ExternalLink,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Save,
  Upload,
  Eye,
  RotateCcw,
  Menu,
  Check,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { api, send, getConfig, getAuthClient, token } from "./api-client";
import { ImagePicker, makeConfig } from "./editor-config";
import { SiteContext, useSite } from "./context";
import { Wordmark, PagePreview } from "./App";
import type {
  Content,
  Kind,
  Media,
  PublicData,
  Role,
  Submission,
} from "./types";
const labels: Record<string, string> = {
  service: "Services",
  project: "Projects",
  testimonial: "Testimonials",
  logo: "Client logos",
  team: "Team",
  job: "Jobs",
};
type Toast = (message: string, error?: boolean) => void;
function Badge({ value }: { value: string }) {
  return (
    <span className={`status-pill ${value}`}>{value.replaceAll("_", " ")}</span>
  );
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [config, setConfig] = useState<any>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reset, setReset] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (config.demo) {
        const data = await fetch("/api/auth/demo", {
          ...send("POST", { password: values.password }),
          headers: { "Content-Type": "application/json" },
        }).then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          return d;
        });
        sessionStorage.setItem("df-demo-token", data.token);
      } else {
        const auth = await getAuthClient();
        if (reset) {
          const { error } = await auth!.auth.resetPasswordForEmail(
            String(values.email),
            { redirectTo: `${location.origin}/admin` },
          );
          if (error) throw error;
          setMessage(
            "If this account exists, a password reset link is on its way.",
          );
          setBusy(false);
          return;
        }
        const { error } = await auth!.auth.signInWithPassword({
          email: String(values.email),
          password: String(values.password),
        });
        if (error) throw error;
      }
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-card">
        <Wordmark />
        <h1>Your creative headquarters.</h1>
        <p>Manage the stories, people, and ideas behind your website.</p>
        {config?.demo && (
          <p className="login-note">
            Local preview mode. Set <code>DEMO_ADMIN_PASSWORD</code> in your
            .env file to unlock this dashboard. Connect Supabase for real team
            accounts.
          </p>
        )}
        <form className="admin-form" onSubmit={submit}>
          {!config?.demo && (
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@yourstudio.com"
              />
            </label>
          )}
          {!reset && (
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="notice" role="status">
              {message}
            </p>
          )}
          <button className="admin-button" disabled={busy || !config}>
            {busy
              ? "One moment…"
              : reset
                ? "Send reset link"
                : "Enter the studio"}
            <ArrowRight size={16} />
          </button>
          {!config?.demo && (
            <button
              type="button"
              className="text-link"
              onClick={() => setReset(!reset)}
            >
              {reset ? "Back to sign in" : "Forgot your password?"}
            </button>
          )}
        </form>
        <Link to="/" className="login-back">
          Back to the website <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
}
function PasswordSetup({ done }: { done: () => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login-page">
      <div className="login-card">
        <Wordmark />
        <h1>Make yourself at home.</h1>
        <p>Set a password for your studio account.</p>
        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const password = String(
                new FormData(e.currentTarget).get("password"),
              );
              const auth = await getAuthClient();
              const { error } = await auth!.auth.updateUser({ password });
              if (error) throw error;
              done();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            New password
            <input
              name="password"
              type="password"
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          <button disabled={busy} className="admin-button">
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}
export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; role: Role } | null>(null),
    [loading, setLoading] = useState(true),
    [records, setRecords] = useState<Content[]>([]),
    [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(
      null,
    ),
    [menu, setMenu] = useState(false),
    [passwordSetup, setPasswordSetup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const site = useSite();
  const toast: Toast = (text, error = false) => {
    setNotice({ text, error });
  };
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 7000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  async function refresh() {
    setRecords(await api("/admin/content"));
  }
  async function load() {
    setLoading(true);
    try {
      const me = await api<{ id: string; role: Role }>("/me");
      setUser(me);
      await refresh();
    } catch (e) {
      setUser(null);
      if ((e as any).status !== 401) toast((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const hash = window.location.hash;
    setPasswordSetup(/type=(invite|recovery)/.test(hash));
    getAuthClient()
      .then((auth) => {
        auth?.auth.onAuthStateChange((event) => {
          if (event === "PASSWORD_RECOVERY") setPasswordSetup(true);
        });
        return load();
      })
      .catch(() => setLoading(false));
  }, []);
  useEffect(() => setMenu(false), [location.pathname]);
  async function logout() {
    try {
      await api("/auth/logout", send("POST"));
      const auth = await getAuthClient();
      await auth?.auth.signOut();
      sessionStorage.removeItem("df-demo-token");
      setUser(null);
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  if (loading)
    return <div className="loading-screen">Opening your studio…</div>;
  if (passwordSetup)
    return (
      <PasswordSetup
        done={() => {
          setPasswordSetup(false);
          load();
        }}
      />
    );
  if (!user) return <Login onLogin={load} />;
  const section = location.pathname.split("/")[2] || "overview";
  const id = location.pathname.split("/")[3];
  const record = records.find((r) => r.id === id);
  const links: [string, string, typeof Files][] = [
    ["", "Overview", LayoutDashboard],
    ["pages", "Pages", Files],
    ["collections", "Collections", Layers],
    ["media", "Media library", ImageIcon],
    ["inbox", "Inbox", Inbox],
    ["settings", "Site settings", Settings],
    ...(user.role === "admin"
      ? [["users", "Team access", Users] as [string, string, typeof Files]]
      : []),
  ];
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${menu ? "mobile-open" : ""}`}>
        <Wordmark />
        <span className="admin-nav-label">YOUR STUDIO</span>
        <nav>
          {links.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              end={path === ""}
              to={`/admin${path ? "/" + path : ""}`}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={15} />
            View website
          </a>
          <button onClick={logout}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <button
              className="admin-mobile-menu"
              aria-label="Toggle dashboard navigation"
              onClick={() => setMenu(!menu)}
            >
              <Menu size={20} />
            </button>
            <span>
              DF Creatives{" "}
              <span style={{ color: "#a5b0b7" }}> / Your creative space</span>
            </span>
          </div>
          <div>
            {site.demo && <Badge value="local preview" />}
            <span className="avatar">DF</span>
            <span>{user.role === "admin" ? "Administrator" : "Editor"}</span>
          </div>
        </div>
        <div className="admin-content">
          {section === "overview" && <Overview records={records} />}
          {section === "pages" &&
            (record ? (
              <ContentEditor
                key={record.id}
                record={record}
                records={records}
                role={user.role}
                refresh={refresh}
                toast={toast}
              />
            ) : (
              <ContentList
                records={records.filter((r) => r.kind === "page")}
                kind="page"
                refresh={refresh}
                toast={toast}
              />
            ))}
          {section === "collections" &&
            (record ? (
              <ContentEditor
                key={record.id}
                record={record}
                records={records}
                role={user.role}
                refresh={refresh}
                toast={toast}
              />
            ) : (
              <Collections records={records} refresh={refresh} toast={toast} />
            ))}
          {section === "settings" &&
            records.find((r) => r.id === "settings") && (
              <ContentEditor
                key="settings"
                record={records.find((r) => r.id === "settings")!}
                records={records}
                role={user.role}
                refresh={refresh}
                toast={toast}
              />
            )}{" "}
          {section === "media" && (
            <MediaLibrary toast={toast} role={user.role} />
          )}{" "}
          {section === "inbox" && <InboxPage toast={toast} />}{" "}
          {section === "users" && user.role === "admin" && (
            <UsersPage toast={toast} userId={user.id} />
          )}{" "}
          {![
            "overview",
            "pages",
            "collections",
            "settings",
            "media",
            "inbox",
            "users",
          ].includes(section) && (
            <div className="admin-empty">
              Page not found. <Link to="/admin">Back to overview</Link>
            </div>
          )}
        </div>
      </div>
      {notice && (
        <div
          role={notice.error ? "alert" : "status"}
          className={`toast ${notice.error ? "error" : ""}`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
function Overview({ records }: { records: Content[] }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  useEffect(() => {
    api<Submission[]>("/admin/submissions")
      .then(setSubmissions)
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>A fresh canvas. Every day.</h1>
          <p>Everything you need to keep your brand moving.</p>
        </div>
        <Link className="admin-button secondary" to="/" target="_blank">
          View website
          <ExternalLink size={14} />
        </Link>
      </div>
      <div className="stat-grid">
        {[
          [
            "Published pages",
            records.filter((r) => r.kind === "page" && r.published).length,
            Files,
            "Your story, out in the world",
          ],
          [
            "Draft content",
            records.filter(
              (r) =>
                !r.published ||
                JSON.stringify(r.draft) !== JSON.stringify(r.published),
            ).length,
            Layers,
            "Ideas waiting in the wings",
          ],
          [
            "New enquiries",
            submissions.filter(
              (s) => s.kind === "enquiry" && s.status === "new",
            ).length,
            Inbox,
            "Conversations to start",
          ],
          [
            "Applications",
            submissions.filter((s) => s.kind === "application").length,
            Users,
            "Your next creative collaborator",
          ],
        ].map(([label, value, Icon, description]) => {
          const I = Icon as typeof Files;
          return (
            <div className="stat-card" key={String(label)}>
              <div>
                {String(label)}
                <I size={18} />
              </div>
              <strong>{String(value)}</strong>
              <p>{String(description)}</p>
            </div>
          );
        })}
      </div>
      <div className="dashboard-welcome">
        <div>
          <h2>
            Great stories start
            <br />
            with a little editing.
          </h2>
          <p>
            Shape your homepage, add your latest work, or share a new
            opportunity. Your next update is a few clicks away.
          </p>
          <Link className="admin-button" to="/admin/pages/home">
            Make it yours
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="admin-card">
        <h2>Your website, at a glance</h2>
        <p>
          Edit content in Pages, keep reusable content in Collections, and
          publish when it’s ready. Draft changes stay private until an
          administrator publishes them.
        </p>
      </div>
      <ContentTable
        records={records.filter((r) => r.kind === "page").slice(0, 5)}
      />
    </>
  );
}
function ContentTable({ records }: { records: Content[] }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Status</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>
                <span className="row-title">
                  {r.draft.title || "Site settings"}
                </span>
                <small>{r.kind === "page" ? r.slug : labels[r.kind]}</small>
              </td>
              <td>
                <Badge
                  value={
                    r.draft.sample
                      ? "sample"
                      : r.published
                        ? "published"
                        : "draft"
                  }
                />
                {r.published &&
                  JSON.stringify(r.draft) !== JSON.stringify(r.published) && (
                    <small>Unpublished changes</small>
                  )}
              </td>
              <td>{new Date(r.updated_at).toLocaleDateString()}</td>
              <td>
                <Link
                  className="text-link"
                  to={`/admin/${r.kind === "page" ? "pages" : "collections"}/${r.id}`}
                >
                  Edit <ArrowUpRight size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!records.length && (
        <div className="admin-empty">
          Nothing here yet. Add your first item.
        </div>
      )}
    </div>
  );
}
function ContentList({
  records,
  kind,
  refresh,
  toast,
}: {
  records: Content[];
  kind: Kind;
  refresh: () => Promise<void>;
  toast: Toast;
}) {
  const [search, setSearch] = useState(""),
    [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>{kind === "page" ? "Pages" : labels[kind]}</h1>
          <p>
            {kind === "page"
              ? "Build your story, one page at a time."
              : "Create once. Bring it to life across your website."}
          </p>
        </div>
        <button className="admin-button" onClick={() => setAdding(!adding)}>
          <Plus size={15} />
          Add {kind === "page" ? "page" : "item"}
        </button>
      </div>
      {adding && (
        <form
          className="admin-card admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            try {
              const row = await api<Content>(
                "/admin/content",
                send("POST", { ...values, kind }),
              );
              await refresh();
              navigate(
                `/admin/${kind === "page" ? "pages" : "collections"}/${row.id}`,
              );
            } catch (e) {
              toast((e as Error).message, true);
            }
          }}
        >
          <div className="form-row">
            <label>
              Title
              <input name="title" required maxLength={180} />
            </label>
            <label>
              {kind === "page"
                ? "Page URL (e.g. /our-story)"
                : "Slug (e.g. brand-story)"}
              <input
                name="slug"
                required
                pattern={kind === "page" ? "/[a-z0-9/-]*" : "[a-z0-9-]+"}
              />
            </label>
          </div>
          <button className="admin-button" style={{ alignSelf: "start" }}>
            Create draft
          </button>
        </form>
      )}
      <div className="admin-toolbar">
        <span style={{ fontSize: 11, color: "#71848f" }}>
          {records.length} items
        </span>
        <input
          className="admin-search"
          aria-label="Search content"
          placeholder="Search content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ContentTable
        records={records.filter((r) =>
          String(r.draft.title).toLowerCase().includes(search.toLowerCase()),
        )}
      />
    </>
  );
}
function Collections({
  records,
  refresh,
  toast,
}: {
  records: Content[];
  refresh: () => Promise<void>;
  toast: Toast;
}) {
  const [kind, setKind] = useState<Kind>("service");
  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-actions">
          {Object.entries(labels).map(([k, label]) => (
            <button
              key={k}
              className={`admin-button ${kind === k ? "" : "secondary"}`}
              onClick={() => setKind(k as Kind)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ContentList
        key={kind}
        kind={kind}
        records={records.filter((r) => r.kind === kind)}
        refresh={refresh}
        toast={toast}
      />
    </>
  );
}
const collectionFields: Record<string, [string, string, string?][]> = {
  service: [
    ["title", "Service name"],
    ["subtitle", "Headline"],
    ["description", "Description", "textarea"],
    ["features", "Features (comma-separated)"],
    ["image", "Image", "image"],
    ["imageAlt", "Image description"],
  ],
  project: [
    ["title", "Project name"],
    ["subtitle", "Headline"],
    ["description", "Story", "textarea"],
    ["services", "Services delivered"],
    ["outcomes", "Approved outcomes", "textarea"],
    ["image", "Project image", "image"],
    ["imageAlt", "Image description"],
  ],
  testimonial: [
    ["title", "Client name"],
    ["role", "Role and company"],
    ["quote", "Approved testimonial", "textarea"],
    ["image", "Portrait", "image"],
  ],
  logo: [
    ["title", "Client name"],
    ["image", "Logo image", "image"],
  ],
  team: [
    ["title", "Name"],
    ["role", "Role"],
    ["description", "Bio", "textarea"],
    ["image", "Portrait", "image"],
  ],
  job: [
    ["title", "Job title"],
    ["location", "Location"],
    ["employment", "Employment type"],
    ["description", "About the role", "textarea"],
    ["requirements", "Requirements and responsibilities", "textarea"],
    ["open", "Accept applications", "checkbox"],
  ],
};
function ContentEditor({
  record,
  records,
  role,
  refresh,
  toast,
}: {
  record: Content;
  records: Content[];
  role: Role;
  refresh: () => Promise<void>;
  toast: Toast;
}) {
  const [draft, setDraft] = useState(record.draft),
    [slug, setSlug] = useState(record.slug),
    [version, setVersion] = useState(record.version),
    [busy, setBusy] = useState(false),
    [revisions, setRevisions] = useState<any[] | null>(null),
    [preview, setPreview] = useState<PublicData | null>(null),
    [dirty, setDirty] = useState(false);
  const site = useSite();
  const navigate = useNavigate();
  const config = useMemo(() => makeConfig(records), [records]);
  useEffect(() => {
    const f = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [dirty]);
  function change(key: string, value: any) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }
  async function save() {
    const row = await api<Content>(
      `/admin/content/${record.id}`,
      send("PUT", { draft, slug, version }),
    );
    setVersion(row.version);
    setDraft(row.draft);
    setDirty(false);
    await refresh();
    return row;
  }
  async function action(fn: () => Promise<any>, success?: string) {
    setBusy(true);
    try {
      await fn();
      if (success) toast(success);
    } catch (e) {
      toast((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    const row = await save();
    const result = await api<Content>(
      `/admin/content/${record.id}/publish`,
      send("POST", { version: row.version }),
    );
    setVersion(result.version);
    await refresh();
  }
  const previewData = {
    ...site,
    settings: (records.find((r) => r.id === "settings")?.draft ||
      site.settings) as any,
    records: records.map((r) => ({ ...r, published: r.draft })),
    preview: true,
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>
            {record.kind === "settings"
              ? "Make it unmistakably yours."
              : draft.title}
          </h1>
          <p>
            {dirty
              ? "Unsaved changes"
              : record.published
                ? "Published content · changes stay private until published"
                : "Draft · only your team can see this"}{" "}
            · Version {version}
          </p>
        </div>
        <div className="admin-actions">
          <button
            className="admin-button secondary"
            disabled={busy}
            onClick={() =>
              action(async () => {
                setRevisions(
                  await api(`/admin/content/${record.id}/revisions`),
                );
              })
            }
          >
            <RotateCcw size={13} />
            History
          </button>
          {(record.kind === "page" || record.kind === "settings") && (
            <button
              className="admin-button secondary"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  await save();
                  setPreview(
                    await api(
                      `/admin/preview?path=${encodeURIComponent(record.kind === "settings" ? "/" : slug)}`,
                    ),
                  );
                })
              }
            >
              <Eye size={13} />
              Preview
            </button>
          )}
          <button
            className="admin-button secondary"
            disabled={busy}
            onClick={() => action(save, "Draft saved")}
          >
            <Save size={13} />
            Save draft
          </button>
          {role === "admin" && (
            <button
              className="admin-button"
              disabled={busy}
              onClick={() =>
                action(publish, "Published. Your website is up to date.")
              }
            >
              <Upload size={13} />
              Publish
            </button>
          )}
        </div>
      </div>
      {preview && (
        <div className="admin-card">
          <div className="admin-heading">
            <h2>Private draft preview</h2>
            <button
              className="admin-button secondary"
              onClick={() => setPreview(null)}
            >
              Close preview
            </button>
          </div>
          <div className="notice">
            Draft content only. Forms are disabled. Use the editor’s viewport
            controls to check tablet and mobile layouts.
          </div>
          <SiteContext.Provider value={preview}>
            <div
              style={
                { "--brand": preview.settings.color } as React.CSSProperties
              }
            >
              <PagePreview />
            </div>
          </SiteContext.Provider>
        </div>
      )}
      {revisions && (
        <div className="admin-card">
          <h2>Previously published versions</h2>
          <p>Restore a revision as a draft, review it, then publish.</p>
          {!revisions.length && <p>No older published versions yet.</p>}
          {revisions.map((rev) => (
            <div key={rev.id} className="revision-row">
              <span>{new Date(rev.created_at).toLocaleString()}</span>
              {role === "admin" && (
                <button
                  disabled={busy}
                  className="admin-button secondary"
                  onClick={() =>
                    action(async () => {
                      const row = await api<Content>(
                        `/admin/content/${record.id}/restore`,
                        send("POST", { revisionId: rev.id, version }),
                      );
                      setDraft(row.draft);
                      setVersion(row.version);
                      setDirty(false);
                      setRevisions(null);
                      await refresh();
                    }, "Revision restored as a draft")
                  }
                >
                  Restore draft
                </button>
              )}
            </div>
          ))}
          <button
            className="text-link"
            style={{ marginTop: 16 }}
            onClick={() => setRevisions(null)}
          >
            Close history
          </button>
        </div>
      )}
      {record.draft.sample && (
        <div className="notice">
          This is sample content. Replace it with approved content and clear the
          sample flag before publishing.
        </div>
      )}
      {record.kind === "page" ? (
        <>
          <div className="admin-card editor-fields">
            <div className="form-row">
              <label>
                Page title / SEO title
                <input
                  value={draft.title || ""}
                  onChange={(e) => change("title", e.target.value)}
                  maxLength={180}
                />
              </label>
              <label>
                URL path
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setDirty(true);
                  }}
                  disabled={!!record.published}
                />
              </label>
            </div>
            <label>
              Search description
              <input
                value={draft.description || ""}
                maxLength={500}
                onChange={(e) => change("description", e.target.value)}
              />
            </label>
          </div>
          <SiteContext.Provider value={previewData}>
            <div className="editor-shell">
              <Puck
                key={`${record.id}-${revisions ? "history" : "edit"}`}
                config={config}
                data={draft.blocks}
                onChange={(data) => {
                  setDraft((d) => ({ ...d, blocks: data }));
                  setDirty(true);
                }}
                headerTitle="DF Creative Studio"
                headerPath={slug}
                onPublish={() => action(publish, "Published successfully")}
                permissions={{ publish: role === "admin" && !busy }}
                viewports={[
                  { width: 1280, height: "auto", label: "Desktop" },
                  { width: 768, height: "auto", label: "Tablet" },
                  { width: 390, height: "auto", label: "Mobile" },
                ]}
                iframe={{ enabled: true }}
                height="740px"
                renderHeaderActions={() => (
                  <span style={{ fontSize: 11, color: "#71838d" }}>
                    Use Save draft or Publish above
                  </span>
                )}
              />
            </div>
          </SiteContext.Provider>
        </>
      ) : record.kind === "settings" ? (
        <SettingsFields draft={draft} change={change} />
      ) : (
        <div className="admin-two-col">
          <div className="admin-card editor-fields">
            {collectionFields[record.kind]?.map(([key, label, type]) => (
              <label
                key={key}
                className={type === "checkbox" ? "check-label" : ""}
              >
                {type === "checkbox" ? (
                  <>
                    <input
                      type="checkbox"
                      checked={!!draft[key]}
                      onChange={(e) => change(key, e.target.checked)}
                    />
                    {label}
                  </>
                ) : (
                  <>
                    {label}
                    {type === "textarea" ? (
                      <textarea
                        value={draft[key] || ""}
                        onChange={(e) => change(key, e.target.value)}
                      />
                    ) : type === "image" ? (
                      <ImagePicker
                        value={draft[key] || ""}
                        onChange={(value) => change(key, value)}
                      />
                    ) : (
                      <input
                        value={draft[key] || ""}
                        onChange={(e) => change(key, e.target.value)}
                      />
                    )}
                  </>
                )}
              </label>
            ))}
            <label className="check-label">
              <input
                type="checkbox"
                checked={!!draft.sample}
                onChange={(e) => change("sample", e.target.checked)}
              />
              This is placeholder / sample content
            </label>
          </div>
          <div className="admin-card editor-fields">
            <h2>Publishing details</h2>
            <label>
              URL slug
              <input
                value={slug}
                disabled={!!record.published}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <p>
              Shared content appears wherever a page block includes this
              collection. Draft changes will not affect your live website.
            </p>
            <Badge value={record.published ? "published" : "draft"} />
          </div>
        </div>
      )}
      {role === "admin" &&
        record.kind !== "settings" &&
        record.slug !== "/" && (
          <div className="admin-actions" style={{ marginTop: 25 }}>
            {record.published ? (
              <button
                disabled={busy}
                className="admin-button secondary"
                onClick={() => {
                  if (
                    window.confirm(
                      "Unpublish this item? It will be removed from the public website.",
                    )
                  )
                    action(async () => {
                      const row = await api<Content>(
                        `/admin/content/${record.id}/unpublish`,
                        send("POST", { version }),
                      );
                      setVersion(row.version);
                      await refresh();
                    }, "Content unpublished");
                }}
              >
                Unpublish
              </button>
            ) : (
              <button
                disabled={busy}
                className="admin-button danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this unpublished item? This cannot be undone.",
                    )
                  )
                    action(async () => {
                      await api(`/admin/content/${record.id}`, send("DELETE"));
                      await refresh();
                      navigate(
                        `/admin/${record.kind === "page" ? "pages" : "collections"}`,
                      );
                    }, "Item deleted");
                }}
              >
                <Trash2 size={13} />
                Delete draft
              </button>
            )}
          </div>
        )}
    </>
  );
}
function SettingsFields({
  draft,
  change,
}: {
  draft: Record<string, any>;
  change: (k: string, v: any) => void;
}) {
  const fields = [
    ["name", "Studio name"],
    ["tagline", "Tagline"],
    ["color", "Brand color (hex)"],
    ["announcement", "Announcement text"],
    ["announcementLink", "Announcement link"],
    ["ctaLabel", "Navigation button label"],
    ["ctaHref", "Navigation button link"],
    ["email", "Public email"],
    ["phone", "Phone"],
    ["location", "Location / footer note"],
    ["footerExplore", "Footer navigation heading"],
    ["footerServices", "Footer services heading"],
    ["footerContact", "Footer contact heading"],
    ["footerHeading", "Footer heading"],
    ["footerCopy", "Footer description"],
  ];
  function editArray(key: string, index: number, field: string, value: any) {
    const arr = structuredClone(draft[key] || []);
    arr[index][field] = value;
    change(key, arr);
  }
  function move(key: string, i: number, direction: number) {
    const arr = [...(draft[key] || [])];
    if (i + direction < 0 || i + direction >= arr.length) return;
    [arr[i], arr[i + direction]] = [arr[i + direction], arr[i]];
    change(key, arr);
  }
  return (
    <div className="admin-two-col">
      <div>
        <div className="admin-card editor-fields">
          <h2>Brand & website</h2>
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              {["footerHeading", "footerCopy"].includes(key) ? (
                <textarea
                  value={draft[key] || ""}
                  onChange={(e) => change(key, e.target.value)}
                />
              ) : (
                <input
                  value={draft[key] || ""}
                  onChange={(e) => change(key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="admin-card editor-fields">
          <h2>Navigation</h2>
          {(draft.nav || []).map((item: any, i: number) => (
            <div className="array-row" key={i}>
              <div className="form-row">
                <label>
                  Label
                  <input
                    value={item.label}
                    onChange={(e) =>
                      editArray("nav", i, "label", e.target.value)
                    }
                  />
                </label>
                <label>
                  Link
                  <input
                    value={item.href}
                    onChange={(e) =>
                      editArray("nav", i, "href", e.target.value)
                    }
                  />
                </label>
              </div>
              {item.children?.map((child: any, j: number) => (
                <div className="form-row" key={j}>
                  <label>
                    Dropdown label
                    <input
                      value={child.label}
                      onChange={(e) => {
                        const a = structuredClone(item.children);
                        a[j].label = e.target.value;
                        editArray("nav", i, "children", a);
                      }}
                    />
                  </label>
                  <label>
                    Dropdown link
                    <input
                      value={child.href}
                      onChange={(e) => {
                        const a = structuredClone(item.children);
                        a[j].href = e.target.value;
                        editArray("nav", i, "children", a);
                      }}
                    />
                  </label>
                  <button
                    className="text-link"
                    onClick={() =>
                      editArray(
                        "nav",
                        i,
                        "children",
                        item.children.filter((_: any, k: number) => j !== k),
                      )
                    }
                  >
                    Remove dropdown link
                  </button>
                </div>
              ))}
              <div className="admin-actions">
                <button
                  className="admin-button secondary"
                  onClick={() =>
                    editArray("nav", i, "children", [
                      ...(item.children || []),
                      { label: "New link", href: "/" },
                    ])
                  }
                >
                  Add dropdown link
                </button>
                <button
                  className="admin-button secondary"
                  aria-label="Move navigation up"
                  onClick={() => move("nav", i, -1)}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  className="admin-button secondary"
                  aria-label="Move navigation down"
                  onClick={() => move("nav", i, 1)}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  className="admin-button danger"
                  aria-label="Remove navigation link"
                  onClick={() =>
                    change(
                      "nav",
                      draft.nav.filter((_: any, k: number) => k !== i),
                    )
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          <button
            className="admin-button secondary"
            onClick={() =>
              change("nav", [
                ...(draft.nav || []),
                { label: "New page", href: "/" },
              ])
            }
          >
            Add navigation item
          </button>
        </div>
        <div className="admin-card editor-fields">
          <h2>Social links</h2>
          {(draft.social || []).map((s: any, i: number) => (
            <div className="array-row" key={i}>
              <label>
                Name
                <input
                  value={s.label}
                  onChange={(e) =>
                    editArray("social", i, "label", e.target.value)
                  }
                />
              </label>
              <label>
                URL
                <input
                  value={s.href}
                  onChange={(e) =>
                    editArray("social", i, "href", e.target.value)
                  }
                />
              </label>
              <button
                className="text-link"
                onClick={() =>
                  change(
                    "social",
                    draft.social.filter((_: any, k: number) => k !== i),
                  )
                }
              >
                Remove link
              </button>
            </div>
          ))}
          <button
            className="admin-button secondary"
            onClick={() =>
              change("social", [
                ...(draft.social || []),
                { label: "Instagram", href: "https://instagram.com/" },
              ])
            }
          >
            Add social link
          </button>
        </div>
      </div>
      <div>
        <div className="admin-card editor-fields">
          <h2>Brand assets</h2>
          <label>
            Logo
            <ImagePicker
              value={draft.logo || ""}
              onChange={(v) => change("logo", v)}
            />
          </label>
          <p>Leave empty to use the DF Creatives wordmark.</p>
          <label>
            Favicon
            <ImagePicker
              value={draft.favicon || ""}
              onChange={(v) => change("favicon", v)}
            />
          </label>
        </div>
        <div className="notice">
          These settings are shared across the website. Save drafts freely;
          publish when your brand update is ready.
        </div>
      </div>
    </div>
  );
}
function MediaLibrary({ toast, role }: { toast: Toast; role: Role }) {
  const [media, setMedia] = useState<Media[]>([]),
    [busy, setBusy] = useState(false);
  async function load() {
    setMedia(await api("/admin/media"));
  }
  useEffect(() => {
    load().catch((e) => toast(e.message, true));
  }, []);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>A home for your visuals.</h1>
          <p>
            Upload images once. Reuse them anywhere. JPG, PNG, WebP, or AVIF, up
            to 8 MB.
          </p>
        </div>
        <label className="admin-button" style={{ cursor: "pointer" }}>
          <Upload size={14} />
          {busy ? "Uploading…" : "Upload image"}
          <input
            style={{ display: "none" }}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const body = new FormData();
                body.append("file", file);
                await api("/admin/media", { method: "POST", body });
                await load();
                toast("Image uploaded");
              } catch (e) {
                toast((e as Error).message, true);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      <div className="notice">
        Images are optimized to WebP. Add descriptive alt text and adjust the
        focal point for responsive crops. Images referenced in pages or
        revisions cannot be deleted.
      </div>
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard
            key={m.id}
            item={m}
            toast={toast}
            load={load}
            role={role}
          />
        ))}
      </div>
      {!media.length && (
        <div className="admin-card admin-empty">
          Your next great visual belongs here. Upload your first image.
        </div>
      )}
    </>
  );
}
function MediaCard({
  item,
  toast,
  load,
  role,
}: {
  item: Media;
  toast: Toast;
  load: () => Promise<void>;
  role: Role;
}) {
  const [value, setValue] = useState(item);
  return (
    <article className="media-card">
      <img
        src={item.url}
        alt={value.alt}
        style={{ objectPosition: `${value.focal_x}% ${value.focal_y}%` }}
      />
      <div>
        <h3>{item.name}</h3>
        <label>
          Alt text
          <input
            value={value.alt}
            onChange={(e) => setValue((v) => ({ ...v, alt: e.target.value }))}
          />
        </label>
        <div className="focal-row">
          <label>
            Focal X (%)
            <input
              type="number"
              min={0}
              max={100}
              value={value.focal_x}
              onChange={(e) =>
                setValue((v) => ({ ...v, focal_x: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            Focal Y (%)
            <input
              type="number"
              min={0}
              max={100}
              value={value.focal_y}
              onChange={(e) =>
                setValue((v) => ({ ...v, focal_y: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <div className="admin-actions">
          <button
            className="admin-button secondary"
            onClick={async () => {
              try {
                await api(
                  `/admin/media/${item.id}`,
                  send("PATCH", {
                    alt: value.alt,
                    focal_x: value.focal_x,
                    focal_y: value.focal_y,
                  }),
                );
                await load();
                toast("Image details saved");
              } catch (e) {
                toast((e as Error).message, true);
              }
            }}
          >
            Save details
          </button>
          <button
            className="admin-button secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.url);
                toast("Image URL copied");
              } catch {
                toast("Copy is unavailable in this browser", true);
              }
            }}
          >
            Copy URL
          </button>
          {role === "admin" && (
            <button
              className="admin-button danger"
              aria-label="Delete image"
              onClick={async () => {
                if (!window.confirm("Delete this image?")) return;
                try {
                  await api(`/admin/media/${item.id}`, send("DELETE"));
                  await load();
                  toast("Image deleted");
                } catch (e) {
                  toast((e as Error).message, true);
                }
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
function csvCell(value: unknown) {
  const s = String(value ?? "");
  return `"${(/^[=+@\-\t\r]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
}
function InboxPage({ toast }: { toast: Toast }) {
  const [rows, setRows] = useState<Submission[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [filter, setFilter] = useState("all");
  async function load() {
    setRows(await api("/admin/submissions"));
  }
  useEffect(() => {
    load().catch((e) => toast(e.message, true));
  }, []);
  const filtered = rows.filter((r) => filter === "all" || r.kind === filter);
  const current = rows.find((r) => r.id === selected);
  function csv() {
    const keys = [
      "id",
      "kind",
      "name",
      "email",
      "service",
      "budget",
      "message",
      "portfolio",
      "status",
      "notes",
      "notification_status",
      "created_at",
    ];
    const data = [
      keys.map(csvCell).join(","),
      ...filtered.map((r) => keys.map((k) => csvCell((r as any)[k])).join(",")),
    ].join("\r\n");
    const href = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = href;
    a.download = "df-creatives-inbox.csv";
    a.click();
    URL.revokeObjectURL(href);
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Good conversations start here.</h1>
          <p>
            Project enquiries and career applications, together in one place.
          </p>
        </div>
        <button className="admin-button secondary" onClick={csv}>
          Export CSV
        </button>
      </div>
      <div className="admin-toolbar">
        <div className="admin-actions">
          {[
            ["all", "All messages"],
            ["enquiry", "Enquiries"],
            ["application", "Applications"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`admin-button ${filter === value ? "" : "secondary"}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="text-link"
          onClick={() => load().catch((e) => toast(e.message, true))}
        >
          Refresh
        </button>
      </div>
      <div className="inbox-layout">
        <div className="inbox-list">
          {filtered.map((r) => (
            <button
              className={selected === r.id ? "selected" : ""}
              key={r.id}
              onClick={() => setSelected(r.id)}
            >
              <strong>{r.name}</strong>
              <p>
                {r.kind === "application"
                  ? "Career application"
                  : r.service || "Project enquiry"}
              </p>
              <Badge value={r.status} />
              <small style={{ float: "right", fontSize: 9, color: "#85939b" }}>
                {new Date(r.created_at).toLocaleDateString()}
              </small>
            </button>
          ))}
          {!filtered.length && (
            <div className="admin-card admin-empty">Your inbox is clear.</div>
          )}
        </div>
        {current ? (
          <InboxDetail
            key={current.id}
            row={current}
            load={load}
            toast={toast}
          />
        ) : (
          <div className="admin-card admin-empty">
            <Inbox style={{ margin: "0 auto 20px", color: "#00a6d9" }} />
            Select a conversation to see the details.
          </div>
        )}
      </div>
    </>
  );
}
function InboxDetail({
  row,
  load,
  toast,
}: {
  row: Submission;
  load: () => Promise<void>;
  toast: Toast;
}) {
  const [status, setStatus] = useState(row.status),
    [notes, setNotes] = useState(row.notes),
    [busy, setBusy] = useState(false);
  return (
    <div className="admin-card inbox-detail">
      <h2>{row.name}</h2>
      <div className="meta">
        <a href={`mailto:${row.email}`}>{row.email}</a>
        <span>{new Date(row.created_at).toLocaleString()}</span>
        <span>{row.budget}</span>
      </div>
      <p className="message-body">{row.message}</p>
      {row.portfolio && (
        <a
          className="text-link"
          href={row.portfolio}
          target="_blank"
          rel="noreferrer"
        >
          Open portfolio
          <ExternalLink size={13} />
        </a>
      )}
      {row.resume_path && (
        <button
          className="admin-button secondary"
          onClick={async () => {
            try {
              const t = await token();
              const response = await fetch(
                `/api/admin/submissions/${row.id}/resume`,
                { headers: { Authorization: `Bearer ${t}` } },
              );
              if (!response.ok) throw new Error("Unable to download résumé");
              if (response.headers.get("content-type")?.includes("json")) {
                const { url } = await response.json();
                const a = document.createElement("a");
                a.href = url;
                a.target = "_blank";
                a.rel = "noreferrer";
                a.click();
              } else {
                const href = URL.createObjectURL(await response.blob());
                const a = document.createElement("a");
                a.href = href;
                a.download = "resume.pdf";
                a.click();
                setTimeout(() => URL.revokeObjectURL(href), 10000);
              }
            } catch (e) {
              toast((e as Error).message, true);
            }
          }}
        >
          Download résumé
        </button>
      )}
      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["new", "in_progress", "completed", "archived"].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Internal notes
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes for your team…"
        />
      </label>
      <button
        className="admin-button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api(
              `/admin/submissions/${row.id}`,
              send("PATCH", { status, notes }),
            );
            await load();
            toast("Conversation updated");
          } catch (e) {
            toast((e as Error).message, true);
          } finally {
            setBusy(false);
          }
        }}
      >
        Save changes
      </button>
      <div
        style={{
          borderTop: "1px solid #e1e7eb",
          paddingTop: 20,
          marginTop: 25,
        }}
      >
        <p style={{ marginBottom: 12 }}>
          Email notification: <Badge value={row.notification_status} />
        </p>
        {row.notification_status !== "sent" && (
          <button
            disabled={busy}
            className="text-link"
            onClick={async () => {
              setBusy(true);
              try {
                const updated = await api<Submission>(
                  `/admin/submissions/${row.id}/retry`,
                  send("POST"),
                );
                await load();
                toast(
                  updated.notification_status === "sent"
                    ? "Notification sent"
                    : `Notification status: ${updated.notification_status}`,
                  updated.notification_status !== "sent",
                );
              } catch (e) {
                toast((e as Error).message, true);
              } finally {
                setBusy(false);
              }
            }}
          >
            Retry notification
          </button>
        )}
      </div>
    </div>
  );
}
function UsersPage({ toast, userId }: { toast: Toast; userId: string }) {
  const [users, setUsers] = useState<any[]>([]),
    [busy, setBusy] = useState(false);
  async function load() {
    setUsers(await api("/admin/users"));
  }
  useEffect(() => {
    load().catch((e) => toast(e.message, true));
  }, []);
  async function updateUser(user: any, patch: any) {
    try {
      await api(
        `/admin/users/${user.id}`,
        send("PATCH", { role: user.role, disabled: user.disabled, ...patch }),
      );
      await load();
      toast("Access updated");
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Better, together.</h1>
          <p>Invite the people who bring your brand to life.</p>
        </div>
      </div>
      <div className="admin-card">
        <h2>Invite a teammate</h2>
        <form
          className="admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            setBusy(true);
            try {
              await api(
                "/admin/users",
                send("POST", Object.fromEntries(new FormData(form))),
              );
              await load();
              form.reset();
              toast("Invitation sent");
            } catch (e) {
              toast((e as Error).message, true);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-row">
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Role
              <select name="role">
                <option value="editor">Editor — drafts and inbox</option>
                <option value="admin">Admin — publish and manage access</option>
              </select>
            </label>
          </div>
          <button
            className="admin-button"
            style={{ alignSelf: "start" }}
            disabled={busy}
          >
            Send invitation
          </button>
        </form>
      </div>
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Teammate</th>
              <th>Role</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {u.id === userId && <small>You</small>}
                </td>
                <td>
                  <select
                    disabled={u.id === userId}
                    value={u.role}
                    onChange={(e) => updateUser(u, { role: e.target.value })}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <button
                    disabled={u.id === userId}
                    className="admin-button secondary"
                    onClick={() => updateUser(u, { disabled: !u.disabled })}
                  >
                    {u.disabled ? "Enable access" : "Disable access"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
