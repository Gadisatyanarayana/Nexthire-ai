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
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

const root = process.cwd();
const env = {
  ...readDotEnvFile(path.join(root, ".env.local")),
  ...process.env,
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(JSON.stringify({ ok: false, error: "Missing SUPABASE env vars" }, null, 2));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const totalQ = await supabase.from("questions").select("id", { count: "exact", head: true });
const cfQ = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("source", "codeforces");
const lcQ = await supabase.from("questions").select("id", { count: "exact", head: true }).or("source.ilike.%leetcode%,topic.cs.{leetcode}");

console.log(
  JSON.stringify(
    {
      ok: true,
      totalQuestions: totalQ.count ?? null,
      codeforcesQuestions: cfQ.count ?? null,
      leetcodeTaggedOrSourceQuestions: lcQ.count ?? null,
      errors: {
        total: totalQ.error?.message || null,
        codeforces: cfQ.error?.message || null,
        leetcode: lcQ.error?.message || null,
      },
    },
    null,
    2
  )
);
