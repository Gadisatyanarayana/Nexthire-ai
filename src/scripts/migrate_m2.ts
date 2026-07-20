import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("=== APPLYING M2 IMPORT SCHEMA ===");
  const sqlPath = path.join(process.cwd(), 'schema_m2_import.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // We can't run raw SQL from JS supabase client. 
  // We need to use postgres client or prompt the user to paste this in Supabase SQL editor.
  console.log("NOTE: Raw SQL execution requires pg client or manual execution in Supabase Dashboard.");
  console.log("Since Supabase blocks raw SQL via REST, you must run this script using `pg` if you have the URI, or paste it in the dashboard.");
  
  // Let's try pg just in case we have a connection string
  if (process.env.DIRECT_URL || process.env.DATABASE_URL) {
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
      await client.connect();
      await client.query(sql);
      console.log("Migration executed successfully via pg client!");
      await client.end();
      return;
    } catch (e: any) {
      console.log("Failed via pg client:", e.message);
    }
  }
  console.log("Migration file created: schema_m2_import.sql");
}

runMigration();
