import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { seed } from "../src/seed";
export const configured = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export const demo = !configured && process.env.NODE_ENV !== "production";
export const supabase = configured
  ? createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  : null;
export const localDir = path.resolve(process.env.DATA_DIR || ".local");
let local: Record<string, any[]> = {
  content: structuredClone(seed),
  revisions: [],
  submissions: [],
  media: [],
  profiles: [],
};
if (demo) {
  mkdirSync(localDir, { recursive: true });
  if (existsSync(path.join(localDir, "data.json")))
    local = JSON.parse(readFileSync(path.join(localDir, "data.json"), "utf8"));
}
function persist() {
  writeFileSync(
    path.join(localDir, "data.tmp"),
    JSON.stringify(local, null, 2),
  );
  renameSync(path.join(localDir, "data.tmp"), path.join(localDir, "data.json"));
}
export async function list(table: string) {
  if (supabase) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data;
  }
  if (!demo) throw new Error("Supabase is not configured");
  return structuredClone(local[table] || []);
}
export async function get(table: string, id: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  return (await list(table)).find((x) => x.id === id) || null;
}
export async function insert(table: string, row: any) {
  if (supabase) {
    const { data, error } = await supabase
      .from(table)
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  local[table].push(structuredClone(row));
  persist();
  return structuredClone(row);
}
export async function update(
  table: string,
  id: string,
  patch: any,
  version?: number,
) {
  if (supabase) {
    let q = supabase.from(table).update(patch).eq("id", id);
    if (version !== undefined) q = q.eq("version", version);
    const { data, error } = await q.select().maybeSingle();
    if (error) throw error;
    if (!data)
      throw Object.assign(
        new Error("Content changed in another session. Reload before saving."),
        { status: 409 },
      );
    return data;
  }
  const row = local[table].find((x) => x.id === id);
  if (!row) throw Object.assign(new Error("Not found"), { status: 404 });
  if (version !== undefined && row.version !== version)
    throw Object.assign(
      new Error("Content changed in another session. Reload before saving."),
      { status: 409 },
    );
  Object.assign(row, structuredClone(patch));
  persist();
  return structuredClone(row);
}
export async function remove(table: string, id: string) {
  if (supabase) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  local[table] = local[table].filter((x) => x.id !== id);
  persist();
}
export async function publishContent(
  id: string,
  version: number,
  published: any,
  userId: string,
) {
  if (supabase) {
    const { data, error } = await supabase.rpc("publish_content", {
      content_id: id,
      expected_version: version,
      new_published: published,
      actor_id: userId,
    });
    if (error)
      throw Object.assign(error, {
        status: error.message.includes("changed") ? 409 : 400,
      });
    return data;
  }
  const row = await get("content", id);
  if (row.version !== version)
    throw Object.assign(
      new Error("Content changed. Reload before publishing."),
      { status: 409 },
    );
  if (row.published)
    local.revisions.push({
      id: crypto.randomUUID(),
      content_id: id,
      data: structuredClone(row.published),
      created_at: new Date().toISOString(),
      created_by: userId,
    });
  return update(
    "content",
    id,
    { published, version: version + 1, updated_at: new Date().toISOString() },
    version,
  );
}
