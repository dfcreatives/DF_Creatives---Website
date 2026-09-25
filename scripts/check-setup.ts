import "dotenv/config";
import { configured, supabase } from "../server/store";
const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = required.filter((key) => !process.env[key]);
if (!configured) {
  console.log("Supabase: not connected. Missing " + missing.join(", "));
  console.log(
    "The website can run in local preview mode; production requires Supabase.",
  );
} else {
  try {
    const { count, error } = await supabase!
      .from("content")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    console.log(`Database: connected (${count ?? 0} content records).`);
    if (!count) console.log("Next: npm run db:seed");
    const { data: profiles, error: profileError } = await supabase!
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("disabled", false);
    if (profileError) throw profileError;
    console.log(
      profiles.length
        ? "Admin account: ready."
        : "Admin account: missing. Run npm run admin:create with ADMIN_EMAIL and ADMIN_PASSWORD set.",
    );
    const { data: buckets, error: bucketError } =
      await supabase!.storage.listBuckets();
    if (bucketError) throw bucketError;
    for (const name of ["media", "resumes"]) {
      const bucket = buckets.find((b) => b.id === name);
      console.log(
        `${name} storage: ${bucket ? (bucket.public ? "public" : "private") : "missing; apply migration"}.`,
      );
      if (name === "resumes" && bucket?.public)
        throw new Error("The resumes bucket must be private.");
    }
  } catch (e) {
    console.error("Setup check failed:", (e as Error).message);
    process.exitCode = 1;
  }
}
const emailKeys = ["RESEND_API_KEY", "EMAIL_FROM", "NOTIFICATION_EMAIL"];
const missingEmail = emailKeys.filter((key) => !process.env[key]);
console.log(
  missingEmail.length
    ? "Submission email: not configured. Missing " + missingEmail.join(", ")
    : "Submission email: configured. Verify your sender domain in Resend; no email was sent by this check.",
);
console.log(
  process.env.SITE_URL?.startsWith("https://")
    ? "Site URL: HTTPS configured."
    : "Site URL: local/non-HTTPS; set the final HTTPS origin before production.",
);
