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

async function testTags() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const tables = ["apt_company_tags", "reasoning_company_tags", "verbal_company_tags", "company_tags"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(5);
    console.log(`Table '${t}':`, data ? `SUCCESS (${data.length} rows)` : `ERROR: ${error?.message}`);
  }
}

testTags().catch(console.error);
