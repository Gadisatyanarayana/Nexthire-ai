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

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const { data: apt } = await supabase.from("apt_companies").select("*");
  console.log("apt_companies:", apt?.map(c => ({ id: c.id, name: c.name })));

  const { data: reas } = await supabase.from("reasoning_companies").select("*");
  console.log("reasoning_companies:", reas?.map(c => ({ id: c.id, name: c.name })));

  const { data: plat } = await supabase.from("platform_companies").select("*");
  console.log("platform_companies:", plat?.map(c => ({ id: c.id, name: c.name })));
}

test().catch(console.error);
