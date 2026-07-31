import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testFetch() {
  console.log("Testing fetch to Supabase REST API...");
  const res = await fetch(`${url}/rest/v1/questions?select=id,title,difficulty,starter_code&limit=5`, {
    headers: {
      "apikey": key || "",
      "Authorization": `Bearer ${key}`
    }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data length:", Array.isArray(data) ? data.length : data);
  console.log("First 3 questions:", JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2));
}

testFetch();
