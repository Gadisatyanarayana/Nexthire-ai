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

  const { data: m1 } = await supabase.from('apt_modules').select('*').limit(1);
  const { data: l1 } = await supabase.from('apt_lessons').select('*').limit(1);
  const { data: rm1 } = await supabase.from('reasoning_modules').select('*').limit(1);
  const { data: rl1 } = await supabase.from('reasoning_lessons').select('*').limit(1);

  console.log("apt_modules sample:", m1?.[0]);
  console.log("apt_lessons sample:", l1?.[0]);
  console.log("reasoning_modules sample:", rm1?.[0]);
  console.log("reasoning_lessons sample:", rl1?.[0]);
}

main().catch(console.error);
