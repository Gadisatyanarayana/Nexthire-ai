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

  console.log("Checking platform_domains:");
  const { data: domains, error: domErr } = await supabase.from('platform_domains').select('*');
  console.log("domains count:", domains?.length, domErr ? domErr.message : '');
  if (domains) {
    domains.forEach(d => console.log("  Domain:", d.id, "->", d.title));
  }

  console.log("\nChecking platform_modules:");
  const { data: modules, error: modErr } = await supabase.from('platform_modules').select('*');
  console.log("modules total count:", modules?.length, modErr ? modErr.message : '');
  if (modules) {
    modules.forEach(m => console.log("  Module:", m.id, "| domain:", m.domain_id, "| title:", m.title));
  }

  console.log("\nChecking platform_lessons:");
  const { data: lessons, error: lesErr } = await supabase.from('platform_lessons').select('*');
  console.log("lessons total count:", lessons?.length, lesErr ? lesErr.message : '');
  if (lessons) {
    console.log("First 20 lessons:");
    lessons.slice(0, 20).forEach(l => console.log("  Lesson:", l.id, "| module:", l.module_id, "| title:", l.title));
    const seating = lessons.find(l => l.id.includes('seating') || l.title.toLowerCase().includes('seating'));
    console.log("  Found seating lesson?:", seating || "NOT FOUND IN DB");
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
