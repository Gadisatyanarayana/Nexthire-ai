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

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Testing direct Supabase query for 'seating-arrangements'...");
  const { data: les, error } = await supabase
    .from("platform_lessons")
    .select("*")
    .eq("id", "seating-arrangements")
    .single();

  if (error) {
    console.error("Error fetching lesson:", error);
  } else {
    console.log("SUCCESS:", les.id, les.title, les.module_id);
  }

  // Also check if any lesson has module_id that doesn't match a module
  console.log("\nChecking all platform_lessons module_ids vs platform_modules:");
  const { data: modules } = await supabase.from("platform_modules").select("id, domain_id, title");
  const { data: lessons } = await supabase.from("platform_lessons").select("id, module_id, title");
  
  const modIds = new Set(modules.map(m => m.id));
  lessons.forEach(l => {
    if (!modIds.has(l.module_id)) {
      console.log("  ORPHAN LESSON! Lesson id:", l.id, "has module_id:", l.module_id, "which is not in platform_modules!");
    }
  });

  // Now check domain_id mapping for modules
  console.log("\nModules by domain:");
  const byDomain = {};
  modules.forEach(m => {
    byDomain[m.domain_id] = (byDomain[m.domain_id] || 0) + 1;
  });
  console.log(byDomain);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
