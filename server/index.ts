import "dotenv/config";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { api, publicData } from "./api";
import { demo, configured, list, localDir } from "./store";
const production = process.env.NODE_ENV === "production";
if (production && !configured)
  throw new Error(
    "Production requires Supabase configuration. See .env.example.",
  );
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(
  "/api",
  (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  api,
);
app.get("/health", async (_req, res) => {
  try {
    await list("profiles");
    res.json({ status: "ok", mode: demo ? "demo" : "connected" });
  } catch {
    res.status(503).json({ status: "unavailable" });
  }
});
app.get("/robots.txt", (_req, res) =>
  res
    .type("text/plain")
    .send(
      `User-agent: *\nDisallow: /admin\nDisallow: /api\nSitemap: ${process.env.SITE_URL || "http://localhost:3000"}/sitemap.xml`,
    ),
);
app.get("/sitemap.xml", async (_req, res) => {
  const data = await publicData("/");
  const base = process.env.SITE_URL || "http://localhost:3000";
  const urls = data.records
    .filter((r) => ["page", "service", "project", "job"].includes(r.kind))
    .map((r) =>
      r.kind === "page"
        ? r.slug
        : `/${r.kind === "service" ? "services" : r.kind === "project" ? "work" : "careers"}/${r.slug}`,
    );
  res
    .type("application/xml")
    .send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${escapeHtml(base + u)}</loc></url>`).join("")}</urlset>`,
    );
});
if (demo)
  app.use(
    "/demo-media",
    express.static(path.join(localDir, "media"), {
      dotfiles: "deny",
      maxAge: "1d",
    }),
  );
let vite: any;
if (!production) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: Number(process.env.PORT || 3000) + 21678,
        host: "127.0.0.1",
      },
    },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else
  app.use(
    express.static(path.resolve("dist/client"), { index: false, maxAge: "1h" }),
  );
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
app.use(async (req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
  try {
    const data = await publicData(req.path);
    const entry = production
      ? await import(path.resolve("dist/server/entry-server.js"))
      : await vite.ssrLoadModule("/src/entry-server.tsx");
    const { html, status, title, description, image } = entry.render(
      req.originalUrl,
      data,
    );
    let template = await readFile(
      path.resolve(production ? "dist/client/index.html" : "index.html"),
      "utf8",
    );
    if (vite)
      template = await vite.transformIndexHtml(req.originalUrl, template);
    const canonical =
      (process.env.SITE_URL || "http://localhost:3000") + req.path;
    const head = `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"/><link rel="canonical" href="${escapeHtml(canonical)}"/><link rel="icon" href="${escapeHtml(data.settings.favicon || "/favicon.svg")}"/><meta property="og:title" content="${escapeHtml(title)}"/><meta property="og:description" content="${escapeHtml(description)}"/><meta property="og:url" content="${escapeHtml(canonical)}"/><meta property="og:type" content="website"/>${image ? `<meta property="og:image" content="${escapeHtml(new URL(image, canonical).href)}"/>` : ""}${req.path.startsWith("/admin") ? '<meta name="robots" content="noindex,nofollow"/>' : ""}`;
    const serialized = JSON.stringify(data).replace(/</g, "\\u003c");
    res
      .status(status)
      .type("html")
      .send(
        template
          .replace("<!--head-->", head)
          .replace("<!--app-->", html)
          .replace(
            "<!--data-->",
            `<script>window.__DF_DATA__=${serialized}</script>`,
          ),
      );
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    next(e);
  }
});
app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err: any, _req: any, res: any, _next: any) => {
  const validation = err.name === "ZodError";
  const status =
    err.status || (validation || err.code === "LIMIT_FILE_SIZE" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({
    error: validation
      ? err.issues
          .map((i: any) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")
      : err.code === "LIMIT_FILE_SIZE"
        ? "File is too large"
        : status === 500
          ? "Something went wrong. Please try again."
          : err.message,
  });
});
export default app;

// Vercel invokes the exported app; local development and Render bind a port.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, production ? "0.0.0.0" : "127.0.0.1", () =>
    console.log(
      `DF Creatives: http://localhost:${port}${demo ? " (local demo)" : ""}`,
    ),
  );
}
