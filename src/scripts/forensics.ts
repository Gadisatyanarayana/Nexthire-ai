import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemas() {
  console.log("Checking for external connections in .env.local:");
  console.log("DATABASE_URL present?", !!process.env.DATABASE_URL);
  console.log("DIRECT_URL present?", !!process.env.DIRECT_URL);
  console.log("NEXT_PUBLIC_LEETCODE_API present?", !!process.env.NEXT_PUBLIC_LEETCODE_API);
  console.log("JUDGE0_API_URL present?", !!process.env.JUDGE0_API_URL);

  // We can't query information_schema directly from JS without RPC, 
  // but if we are on node we could use pg if it's installed.
  // Is pg installed?
  try {
    const { Client } = require('pg');
    if (process.env.DIRECT_URL || process.env.DATABASE_URL) {
      const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
      await client.connect();
      const res = await client.query(`SELECT schema_name FROM information_schema.schemata;`);
      console.log("Schemas:", res.rows.map((r: any) => r.schema_name));
      await client.end();
    } else {
      console.log("No DB connection string for pg client");
    }
  } catch (e: any) {
    console.log("Could not run pg query:", e.message);
  }
}

checkSchemas();
