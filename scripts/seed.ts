import "dotenv/config";
import { seed } from "../src/seed";
import { supabase } from "../server/store";
if (!supabase)
  throw new Error(
    "Set SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY first.",
  );
const { error } = await supabase
  .from("content")
  .upsert(seed, { onConflict: "id", ignoreDuplicates: true });
if (error) throw error;
console.log(
  "Initial content created. Existing records were preserved; sample content is unpublished.",
);
