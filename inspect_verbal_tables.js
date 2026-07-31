const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

async function checkVerbal() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log("=== 1. CHECK PLATFORM_MODULES FOR VERBAL ===");
  const { data: pMods, error: pErr } = await supabase.from("platform_modules").select("*").in("domain_id", ["verbal", "verbal-ability", "va"]);
  console.log("platform_modules count:", pMods ? pMods.length : 0, pErr || "");

  console.log("=== 2. CHECK LEGACY VERBAL TABLES ===");
  const { data: vMods, error: vErr } = await supabase.from("verbal_modules").select("*");
  console.log("verbal_modules count:", vMods ? vMods.length : 0, vErr || "");

  const { data: vLessons, error: lErr } = await supabase.from("verbal_lessons").select("*");
  console.log("verbal_lessons count:", vLessons ? vLessons.length : 0, lErr || "");

  const { data: vQuestions, error: qErr } = await supabase.from("verbal_questions").select("*");
  console.log("verbal_questions count:", vQuestions ? vQuestions.length : 0, qErr || "");

  console.log("=== 3. CHECK COMPANY DATA ===");
  const tables = ["aptitude_companies", "reasoning_companies", "verbal_companies", "platform_companies", "company_questions"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("id, name").limit(5);
    console.log(`Table ${t}:`, data ? `SUCCESS (${data.length} rows)` : `ERROR: ${error?.message}`);
  }
}

checkVerbal().catch(console.error);
