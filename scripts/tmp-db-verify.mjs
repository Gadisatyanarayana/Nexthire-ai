import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

const env = { ...readDotEnvFile(path.join(process.cwd(), ".env.local")), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "", {
  auth: { persistSession: false },
});

const total = await supabase.from("questions").select("id", { count: "exact", head: true });
const codeforces = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "codeforces");
const aiEnriched = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "ai-enriched");
const missingTc = await supabase.from("questions").select("id", { count: "exact", head: true }).or("testcases.is.null,testcases.eq.[]");

console.log(JSON.stringify({
  totalQuestions: total.count ?? null,
  codeforcesQuestions: codeforces.count ?? null,
  aiEnrichedQuestions: aiEnriched.count ?? null,
  questionsMissingTestcases: missingTc.count ?? null,
  errors: {
    total: total.error?.message || null,
    codeforces: codeforces.error?.message || null,
    aiEnriched: aiEnriched.error?.message || null,
    missingTc: missingTc.error?.message || null,
  }
}, null, 2));
