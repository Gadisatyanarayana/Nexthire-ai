import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://mniuklnrgfcpusuijuyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY');

async function run() {
  const companyId = 'tech-mahindra';
  const { data: comp } = await supabase.from("apt_companies").select("name").ilike("id", companyId).single();
  console.log('Comp:', comp);
  if (comp) {
    const { data, error } = await supabase
      .from("apt_questions")
      .select(`
        *,
        apt_company_tags!inner (company_name)
      `)
      .ilike("apt_company_tags.company_name", comp.name)
      .limit(5);
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Questions fetched:', data.length);
    }
  }
}
run();
