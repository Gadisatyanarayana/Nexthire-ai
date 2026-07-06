import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("ERROR: Missing Supabase credentials");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

try {
  const { count, error } = await admin
    .from("coding_questions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.log("Database error:", error.message);
    process.exit(1);
  }

  console.log("Total questions in database:", count || 0);

  const { data: sample, error: sampleError } = await admin
    .from("coding_questions")
    .select("id, title, difficulty")
    .limit(3);

  if (sampleError) {
    console.log("Error fetching sample:", sampleError.message);
  } else {
    console.log("Sample questions:", JSON.stringify(sample, null, 2));
  }
} catch (e) {
  console.log("ERROR:", e.message);
}
