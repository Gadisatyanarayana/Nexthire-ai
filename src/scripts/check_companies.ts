import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
  const { data, error } = await supabase.from('apt_companies').select('*').limit(1);
  if (error) {
    console.log("Error querying apt_companies:", error.message);
  } else {
    console.log("apt_companies exists! Rows found:", data?.length);
  }
}

checkCompanies().catch(console.error);
