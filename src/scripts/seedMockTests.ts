import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMockTests() {
  console.log("Seeding mock tests is not required natively as Mock Sessions are generated dynamically by the AI/Company Engine per user.");
  console.log("However, you must run the following SQL files in the Supabase SQL Editor:");
  console.log("1. src/scripts/mock_tests_schema.sql");
  console.log("2. src/scripts/mock_sessions_schema.sql");
  console.log("Once tables exist, the Mock Test feature will be fully functional.");
}

seedMockTests().catch(console.error);
