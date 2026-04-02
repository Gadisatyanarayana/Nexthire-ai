import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const key = line.slice(0, i).trim();
  const val = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase.from("questions").select("*").limit(1);
if (error) throw error;
console.log(Object.keys(data?.[0] || {}));

const { data: counts, error: e2 } = await supabase.from("questions").select("source");
if (e2) throw e2;
const map = new Map();
for (const row of counts || []) {
  const s = row.source ?? "null";
  map.set(s, (map.get(s) || 0) + 1);
}
console.log(JSON.stringify(Object.fromEntries(map), null, 2));
