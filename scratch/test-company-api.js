const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mniuklnrgfcpusuijuyz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: tags, error } = await supabase.from("apt_company_tags").select("company_name");
    
    let dbCompanies = [];
    if (tags && tags.length > 0) {
      dbCompanies = Array.from(new Set(tags.map(t => t.company_name)));
    }
    console.log(dbCompanies);
}
main().catch(console.error);
