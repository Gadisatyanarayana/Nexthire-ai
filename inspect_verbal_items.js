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

async function checkVerbalItems() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data: mods, error: mErr } = await supabase
    .from("platform_modules")
    .select("id, title, domain_id")
    .eq("domain_id", "verbal-ability");
  console.log("Verbal Modules:", mods || [], mErr || "");

  if (mods && mods.length > 0) {
    for (const m of mods) {
      const { data: l, error: lErr } = await supabase
        .from("platform_lessons")
        .select("id, title, module_id")
        .eq("module_id", m.id);
      console.log(`Lessons for module ${m.id} (${m.title}):`, l ? l.length : 0, lErr || "");
    }
  }
}

checkVerbalItems().catch(console.error);
