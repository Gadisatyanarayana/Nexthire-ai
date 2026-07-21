require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const mockId = "00000000-0000-0000-0000-000000000000";
  
  // Create mock user
  console.log("Seeding mock user...");
  await supabase.from('users').upsert({ id: mockId, email: 'mock@nexthire.ai', name: 'Mock User' });
  
  // Create mock tenant
  console.log("Seeding mock tenant...");
  await supabase.from('platform_tenants').upsert({ id: mockId, name: 'Mock Tenant', slug: 'mock-tenant' });
  
  console.log("Mock data seeded successfully.");
}

main().catch(console.error);
