import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCount() {
  const res = await fetch(`${url}/rest/v1/questions?select=id&limit=1`, {
    headers: {
      "apikey": key || "",
      "Authorization": `Bearer ${key}`,
      "Prefer": "count=exact"
    }
  });
  console.log("Content-Range header:", res.headers.get("content-range"));
}

checkCount();
