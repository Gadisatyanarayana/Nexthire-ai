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

  console.log("Checking all modules in platform_modules...");
  const { data: allMods } = await supabase.from('platform_modules').select('id, domain_id, title');
  console.log("Modules:", allMods?.map(m => `${m.id} (${m.domain_id})`));

  console.log("\nChecking all lessons in platform_lessons...");
  const { data: allLess } = await supabase.from('platform_lessons').select('id, module_id, title');
  console.log("Total lessons in platform_lessons:", allLess?.length);

  // Check if every lesson's module_id is in allMods
  const modMap = new Map(allMods?.map(m => [m.id, m]));
  const missingMods = new Set();
  allLess?.forEach(l => {
    if (!modMap.has(l.module_id)) {
      missingMods.add(l.module_id);
    }
  });

  if (missingMods.size > 0) {
    console.log("CRITICAL: Some lessons reference non-existent module_ids:", Array.from(missingMods));
  } else {
    console.log("All lessons reference valid module_ids in platform_modules.");
  }

  // Now let's check what lessons exist for logical-reasoning
  const lrMods = allMods?.filter(m => m.domain_id === 'logical-reasoning').map(m => m.id) || [];
  const lrLess = allLess?.filter(l => lrMods.includes(l.module_id)) || [];
  console.log("\nLR lessons:", lrLess.map(l => `${l.id} -> ${l.module_id}`));
}

main().catch(console.error);
