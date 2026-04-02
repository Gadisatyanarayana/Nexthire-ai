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
  const value = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, "");
  if (!process.env[key]) process.env[key] = value;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const total = await supabase.from("questions").select("id", { count: "exact", head: true });
const ai = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "ai-enriched");
const gfg = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "gfg-curated");

if (total.error) throw total.error;
if (ai.error) throw ai.error;
if (gfg.error) throw gfg.error;

console.log(JSON.stringify({
  totalQuestions: total.count || 0,
  aiEnriched: ai.count || 0,
  gfgCurated: gfg.count || 0,
}, null, 2));
