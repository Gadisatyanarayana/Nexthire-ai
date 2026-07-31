import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
  const connectionString = process.env.DATABASE_URL; // Should be standard Postgres string
  if (!connectionString) {
      console.log("No DATABASE_URL found. Check your .env.local");
      return;
  }
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");
    
    const sqlPath = path.join(process.cwd(), "src/scripts/migrations/015_v5_content_intelligence_pipeline.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    console.log("Applying Migration 015...");
    await client.query(sql);
    console.log("Migration 015 applied successfully!");
    
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
