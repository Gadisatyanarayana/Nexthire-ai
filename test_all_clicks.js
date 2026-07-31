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

  console.log("=== CHECKING APTITUDE MODULES IN platform_modules ===");
  const { data: qMods } = await supabase.from('platform_modules').select('*').eq('domain_id', 'quantitative-aptitude');
  console.log("Quantitative Aptitude modules:", qMods ? qMods.map(m => `${m.id} (${m.title})`) : "NONE");

  console.log("\n=== CHECKING APTITUDE LESSONS IN platform_lessons ===");
  const { data: qLess } = await supabase.from('platform_lessons').select('id, title, module_id').in('module_id', qMods ? qMods.map(m => m.id) : []);
  console.log("Quantitative Aptitude lessons count:", qLess ? qLess.length : 0);
  if (qLess) {
    qMods.forEach(m => {
      const ml = qLess.filter(l => l.module_id === m.id);
      console.log(`  Module ${m.id} has ${ml.length} lessons:`, ml.slice(0, 3).map(l => l.id));
    });
  }

  console.log("\n=== CHECKING REASONING MODULES IN platform_modules ===");
  const { data: rMods } = await supabase.from('platform_modules').select('*').eq('domain_id', 'logical-reasoning');
  console.log("Logical Reasoning modules:", rMods ? rMods.map(m => `${m.id} (${m.title})`) : "NONE");

  console.log("\n=== CHECKING REASONING LESSONS IN platform_lessons ===");
  const { data: rLess } = await supabase.from('platform_lessons').select('id, title, module_id').in('module_id', rMods ? rMods.map(m => m.id) : []);
  console.log("Logical Reasoning lessons count:", rLess ? rLess.length : 0);
  if (rLess) {
    rMods.forEach(m => {
      const ml = rLess.filter(l => l.module_id === m.id);
      console.log(`  Module ${m.id} has ${ml.length} lessons:`, ml.slice(0, 3).map(l => l.id));
    });
  }

  // Check if there are any lessons in platform_lessons whose module_id is NOT one of qMods or rMods or verbal
  const { data: allPMod } = await supabase.from('platform_modules').select('id');
  const validModIds = new Set(allPMod ? allPMod.map(m => m.id) : []);
  const { data: allPLess } = await supabase.from('platform_lessons').select('id, module_id, title');
  const orphanLess = allPLess ? allPLess.filter(l => !validModIds.has(l.module_id)) : [];
  console.log("\nOrphan lessons in platform_lessons:", orphanLess.length);
  if (orphanLess.length > 0) {
    console.log("Sample orphan lessons:", orphanLess.slice(0, 5));
  }
}

main().catch(console.error);
