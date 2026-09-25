import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let client: SupabaseClient | null = null;
let config: any;
export async function getConfig() {
  if (!config) config = await fetch("/api/config").then((r) => r.json());
  return config;
}
export async function getAuthClient() {
  const c = await getConfig();
  if (!client && c.configured) client = createClient(c.url, c.anonKey);
  return client;
}
export async function token() {
  const c = await getAuthClient();
  if (c) return (await c.auth.getSession()).data.session?.access_token || "";
  return sessionStorage.getItem("df-demo-token") || "";
}
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const t = await token();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "Request failed"), {
      status: response.status,
    });
  return data;
}
export const send = (method: string, body?: any): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});
