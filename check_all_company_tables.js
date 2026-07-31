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

async function checkCompanies() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const tables = ["apt_companies", "reasoning_companies", "verbal_companies", "platform_companies", "companies", "sd_company_profiles"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(5);
    console.log(`Table '${t}':`, data ? `SUCCESS (${data.length} rows)` : `ERROR: ${error?.message}`);
  }
}

checkCompanies().catch(console.error);
