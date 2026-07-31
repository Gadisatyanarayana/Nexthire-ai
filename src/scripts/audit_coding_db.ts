import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

async function inspectDB() {
  const { count, error } = await admin.from("questions").select("*", { count: "exact", head: true });
  console.log("Total rows in questions table:", count);

  // Fetch sample of questions
  const { data: sample } = await admin.from("questions").select("id, title, difficulty, topic, pattern_tags, starter_code").limit(20);
  console.log("\nSample questions in DB:");
  sample?.forEach((q) => {
    const fnName = q.starter_code?.javascript ? q.starter_code.javascript.split("{")[0].trim() : "no-js";
    console.log(`- [${q.id}] "${q.title}" (${q.difficulty}) | fn: ${fnName} | tags: ${JSON.stringify(q.pattern_tags)}`);
  });

  process.exit(0);
}

inspectDB();
