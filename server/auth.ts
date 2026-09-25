import type { Request, Response, NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { supabase, demo, get } from "./store";
export type AuthRequest = Request & {
  user?: { id: string; role: "admin" | "editor" };
};
const sessions = new Map<string, { expires: number }>();
export function demoLogin(password: string) {
  const expected = process.env.DEMO_ADMIN_PASSWORD;
  if (!demo || !expected || expected.length < 12) return null;
  const a = Buffer.from(password),
    b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { expires: Date.now() + 8 * 3600000 });
  return token;
}
export function demoLogout(token: string) {
  sessions.delete(token);
}
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) return res.status(401).json({ error: "Please sign in" });
    if (demo) {
      const s = sessions.get(token);
      if (!s || s.expires < Date.now())
        return res
          .status(401)
          .json({ error: "Session expired. Please sign in again." });
      req.user = { id: "demo-admin", role: "admin" };
      return next();
    }
    const { data, error } = await supabase!.auth.getUser(token);
    if (error || !data.user)
      return res
        .status(401)
        .json({ error: "Session expired. Please sign in again." });
    const profile = await get("profiles", data.user.id);
    if (
      !profile ||
      !["admin", "editor"].includes(profile.role) ||
      profile.disabled
    )
      return res
        .status(403)
        .json({ error: "Dashboard access is not enabled for this account" });
    req.user = { id: data.user.id, role: profile.role };
    next();
  } catch (e) {
    next(e);
  }
}
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin")
    return res
      .status(403)
      .json({ error: "Only admins can perform this action" });
  next();
}
