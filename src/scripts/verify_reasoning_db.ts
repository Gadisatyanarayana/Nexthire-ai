import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'reasoning_modules',
  'reasoning_lessons',
  'reasoning_formulas',
  'reasoning_questions',
  'reasoning_companies',
  'reasoning_company_tags',
  'reasoning_mock_sessions',
  'reasoning_topic_mastery',
  'reasoning_question_attempts',
  'reasoning_revision_queue',
  'reasoning_ai_sessions',
  'reasoning_ai_feedback',
  'reasoning_company_readiness',
  'reasoning_bookmarks',
  'reasoning_notes',
  'reasoning_certificates',
  'reasoning_badges'
];

async function verify() {
  console.log("Starting Reasoning Database Table Verification...\n");
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table ${table} does NOT exist or error: ${error.message}`);
    } else {
      console.log(`✅ Table ${table} exists! Row count: ${count || 0}`);
    }
  }
}

verify();
