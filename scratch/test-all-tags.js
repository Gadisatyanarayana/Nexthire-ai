const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mniuklnrgfcpusuijuyz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let allTags = new Set();
  let from = 0;
  let limit = 1000;
  
  while (true) {
    const { data } = await supabase.from("apt_company_tags").select("company_name").range(from, from + limit - 1);
    if (!data || data.length === 0) break;
    data.forEach(d => allTags.add(d.company_name));
    if (data.length < limit) break;
    from += limit;
  }
  
  console.log("Distinct companies:", Array.from(allTags));
}
main();
