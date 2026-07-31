import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing envs");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
  const { data, count } = await admin.from("questions").select("topic, pattern_tags", { count: "exact" });
  console.log(`Total questions in DB: ${count}`);

  const counts: Record<string, number> = {};
  if (data) {
    data.forEach((row: any) => {
      const keys = new Set<string>();
      if (Array.isArray(row.topic)) row.topic.forEach((t: string) => keys.add(t));
      if (Array.isArray(row.pattern_tags)) row.pattern_tags.forEach((p: string) => keys.add(p));
      keys.forEach((k) => {
        counts[k] = (counts[k] || 0) + 1;
      });
    });
  }

  console.log("Tag Counts in DB:");
  console.log(JSON.stringify(counts, null, 2));
}

checkTags();
