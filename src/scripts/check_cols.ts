import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: cols1 } = await supabase.rpc('get_columns', { table_name: 'apt_mock_tests' });
  const { data: cols2 } = await supabase.rpc('get_columns', { table_name: 'apt_company_readiness' });
  
  // Since we might not have RPC, we can just do a select with limit 1 and look at the keys, or force an error to see if it lists columns.
  // Actually, easiest way is to select * limit 1
  const { data: d1 } = await supabase.from('apt_mock_tests').select('*').limit(1);
  console.log("Mock tests cols (if any rows exist):", d1 && d1.length > 0 ? Object.keys(d1[0]) : "No rows");

  const { data: d2 } = await supabase.from('apt_company_readiness').select('*').limit(1);
  console.log("Readiness cols:", d2 && d2.length > 0 ? Object.keys(d2[0]) : "No rows");
}
run().catch(console.error);
