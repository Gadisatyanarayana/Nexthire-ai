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

  const { data: vMod, error: vModErr } = await supabase.from('verbal_modules').select('*');
  const { data: vLes, error: vLesErr } = await supabase.from('verbal_lessons').select('*');
  const { data: pMod } = await supabase.from('platform_modules').select('*').eq('domain_id', 'verbal-ability');
  const { data: pLes } = await supabase.from('platform_lessons').select('*').in('module_id', pMod ? pMod.map(m => m.id) : []);

  console.log("verbal_modules count:", vMod?.length || 0, "err:", vModErr?.message);
  console.log("verbal_lessons count:", vLes?.length || 0, "err:", vLesErr?.message);
  console.log("platform_modules (verbal) count:", pMod?.length || 0);
  console.log("platform_lessons (verbal) count:", pLes?.length || 0);

  if (vMod) console.log("verbal_modules titles:", vMod.map(m => m.title));
  if (pMod) console.log("platform_modules (verbal) titles:", pMod.map(m => m.title));
}

main().catch(console.error);
