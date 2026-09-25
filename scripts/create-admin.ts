import "dotenv/config";
import { supabase } from "../server/store";
if (!supabase) throw new Error("Configure Supabase first.");
const email = process.env.ADMIN_EMAIL,
  password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "Provide ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) as environment variables.",
  );
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) throw error;
const { error: profileError } = await supabase
  .from("profiles")
  .insert({ id: data.user.id, email, role: "admin", disabled: false });
if (profileError) {
  await supabase.auth.admin.deleteUser(data.user.id);
  throw profileError;
}
console.log("Administrator created. Sign in at /admin.");
