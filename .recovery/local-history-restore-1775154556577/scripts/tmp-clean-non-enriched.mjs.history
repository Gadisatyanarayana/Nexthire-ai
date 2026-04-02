import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
for (const raw of envText.split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const key = line.slice(0, i).trim();
  const val = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing supabase env");

const supabase = createClient(url, key);

const { data: beforeRows, error: beforeError } = await supabase
  .from("questions")
  .select("id,source")
  .eq("source", "gfg-curated")
  .limit(5000);
if (beforeError) throw beforeError;

const ids = (beforeRows || []).map((r) => r.id).filter(Boolean);
console.log("gfgCuratedBefore", ids.length);

if (ids.length > 0) {
  const { error: delErr } = await supabase.from("questions").delete().in("id", ids);
  if (delErr) throw delErr;
}

const { count: total, error: totalErr } = await supabase
  .from("questions")
  .select("id", { count: "exact", head: true });
if (totalErr) throw totalErr;

const { count: bad, error: badErr } = await supabase
  .from("questions")
  .select("id", { count: "exact", head: true })
  .eq("source", "gfg-curated");
if (badErr) throw badErr;

const { data: allSources, error: sourceErr } = await supabase.from("questions").select("source");
if (sourceErr) throw sourceErr;

const sourceMap = {};
for (const row of allSources || []) {
  const source = row.source || "null";
  sourceMap[source] = (sourceMap[source] || 0) + 1;
}

console.log(JSON.stringify({ totalQuestions: total || 0, gfgCuratedRemaining: bad || 0, sources: sourceMap }, null, 2));
