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

  const { data: aptMod } = await supabase.from('apt_modules').select('*');
  const { data: reasMod } = await supabase.from('reasoning_modules').select('*');
  const { data: aptLes } = await supabase.from('apt_lessons').select('*');
  const { data: reasLes } = await supabase.from('reasoning_lessons').select('*');

  console.log("apt_modules count:", aptMod?.length || 0);
  console.log("reasoning_modules count:", reasMod?.length || 0);
  console.log("apt_lessons count:", aptLes?.length || 0);
  console.log("reasoning_lessons count:", reasLes?.length || 0);

  if (aptMod) {
    console.log("apt_modules titles:", aptMod.map(m => m.title));
  }
  if (reasMod) {
    console.log("reasoning_modules titles:", reasMod.map(m => m.title));
  }
}

main().catch(console.error);
