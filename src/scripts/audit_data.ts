import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateDataInventory() {
  console.log("=== NEXTHIRE AI DATA INVENTORY AUDIT ===");

  const domains = [
    'Aptitude', 'Reasoning', 'Verbal', 'SQL', 'MongoDB', 
    'Postgres', 'System Design', 'AI/ML', 'Java', 'Python', 'C++', 'JavaScript', 'Coding'
  ];
  
  const tables = [
    'platform_domains', 'platform_modules', 'platform_lessons', 'platform_questions',
    'problems', 'questions', 'test_cases', 'submissions', 'sd_questions'
  ];

  console.log("\\n--- Table Counts ---");
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`[!] Table '${table}': ERROR or MISSING (${error.message})`);
    } else {
      console.log(`[✓] Table '${table}': ${count} rows`);
    }
  }
  
  console.log("\\n--- Domain Breakdown (platform_questions) ---");
  const { data: qData, error: qErr } = await supabase.from('platform_questions').select('domain_id');
  if (qData) {
    const counts = qData.reduce((acc, row) => {
      acc[row.domain_id] = (acc[row.domain_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    for (const [domain, count] of Object.entries(counts)) {
      console.log(`Domain [${domain}]: ${count} questions`);
    }
  }
  
  console.log("\\n--- System Design Breakdown ---");
  const { count: sdCount } = await supabase.from('sd_questions').select('*', { count: 'exact', head: true });
  console.log(`Legacy sd_questions: ${sdCount || 0} questions`);
  
  console.log("\\n=== END AUDIT ===");
}

generateDataInventory();
