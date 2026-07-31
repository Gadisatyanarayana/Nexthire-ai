import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDependencies() {
  console.log("Fixing dependencies in Supabase...");

  // 1. Insert mock tenant
  const { error: tErr } = await supabase.from('platform_tenants').upsert({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mock Tenant 2',
    slug: 'mock-tenant-2'
  });
  if (tErr) console.error("Error inserting tenant:", tErr.message);
  else console.log("Mock tenant verified.");

  // 2. Insert mock user (for session tests)
  const { error: uErr } = await supabase.from('users').upsert({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Mock User',
    email: 'mock@example.com'
  });
  if (uErr) console.error("Error inserting user 1:", uErr.message);
  
  const { error: u2Err } = await supabase.from('users').upsert({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mock User 2',
    email: 'mock2@example.com'
  });
  if (u2Err) console.error("Error inserting user 2:", u2Err.message);

  console.log("Dependencies fixed. Ready for tests.");
}

fixDependencies();
