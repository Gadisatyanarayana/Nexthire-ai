import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function reportCounts() {
  const tables = ["apt_modules", "apt_lessons", "apt_formulas", "apt_questions", "apt_company_tags", "apt_mock_tests", "apt_mock_sessions", "apt_topic_mastery", "apt_revision_queue", "apt_ai_sessions", "apt_ai_feedback", "apt_badges", "apt_certificates", "apt_company_readiness"];
  console.log("Database Row Counts:");
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: 'exact', head: true });
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
    } else {
      console.log(`- ${table}: ${count}`);
    }
  }
}

reportCounts().catch(console.error);
