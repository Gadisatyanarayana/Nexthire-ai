import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://mniuklnrgfcpusuijuyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY');

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/v1/aptitude/questions?company_id=tech-mahindra&limit=15');
    const json = await res.json();
    console.log('API Response:', json);
  } catch (e) {
    console.error(e);
  }
}
run();
