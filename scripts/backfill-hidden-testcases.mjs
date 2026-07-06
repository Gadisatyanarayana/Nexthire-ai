import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

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

function loadEnv() {
  const root = process.cwd();
  const local = readDotEnvFile(path.join(root, ".env.local"));
  const example = readDotEnvFile(path.join(root, ".env.example"));
  const runtimeEnv = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string" && value.trim().length > 0) {
      runtimeEnv[key] = value;
    }
  }

  return { ...example, ...local, ...runtimeEnv };
}

function normalizeDifficulty(value) {
  const x = String(value || "Easy").trim().toLowerCase();
  if (x === "medium") return "Medium";
  if (x === "hard") return "Hard";
  return "Easy";
}

function defaultTimeLimitMinutes(difficulty) {
  const d = normalizeDifficulty(difficulty);
  if (d === "Medium") return 30;
  if (d === "Hard") return 45;
  return 20;
}

function parseCaseRows(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = entry || {};
      const input = String(row.input || "").trim();
      const expectedOutput = String(row.expectedOutput ?? row.expected_output ?? row.output ?? "").trim();
      if (!input || !expectedOutput) return null;
      return { input, expectedOutput };
    })
    .filter(Boolean);
}

function uniqueCases(cases) {
  const seen = new Set();
  const output = [];
  for (const item of cases) {
    const key = `${item.input}@@${item.expectedOutput}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function fillCases(cases, count) {
  const base = uniqueCases(cases);
  if (base.length === 0 || count <= 0) return [];

  const output = [...base];
  let index = 0;
  while (output.length < count) {
    const source = base[index % base.length];
    output.push({ input: source.input, expectedOutput: source.expectedOutput });
    index += 1;
  }

  return output.slice(0, count);
}

async function ensureProblemId(supabase, question) {
  const legacyId = String(question.id || "").trim();
  const title = String(question.title || legacyId || "Untitled").trim() || "Untitled";
  const description = String(question.description || "").trim() || `Solve ${title}.`;
  const difficulty = normalizeDifficulty(question.difficulty);
  const topics = Array.isArray(question.topic)
    ? question.topic.map((v) => String(v || "").trim()).filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("problems")
    .upsert(
      {
        legacy_question_id: legacyId,
        title,
        description,
        difficulty,
        topics,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "legacy_question_id" }
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`problem upsert failed: ${error.message}`);
  }

  return String(data.id);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const offsetArg = process.argv.find((arg) => arg.startsWith("--offset="));
  const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1] || "0")) : 1000;
  const offset = offsetArg ? Math.max(0, Number(offsetArg.split("=")[1] || "0")) : 0;

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id,title,difficulty,description,topic,time_limit_minutes,sample_test_cases,hidden_test_cases,testcases")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message || "Failed to load questions");

  const rows = Array.isArray(questions) ? questions : [];
  console.log(`Found ${rows.length} questions. Processing in ${dryRun ? "dry-run" : "write"} mode.`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const question = rows[i];

    try {
      const sampleCases = parseCaseRows(question.sample_test_cases);
      const hiddenCases = parseCaseRows(question.hidden_test_cases);
      const legacyCases = parseCaseRows(question.testcases);

      const visibleSeed = sampleCases.length > 0 ? sampleCases : legacyCases.slice(0, 2);
      const visible = fillCases(visibleSeed.length > 0 ? visibleSeed : hiddenCases, 2);

      const hiddenSeed = hiddenCases.length > 0
        ? hiddenCases
        : legacyCases.slice(2).length > 0
          ? legacyCases.slice(2)
          : legacyCases.length > 0
            ? legacyCases
            : visible;
      const hidden = fillCases(hiddenSeed.length > 0 ? hiddenSeed : visible, 20);

      const nextTimeLimit = defaultTimeLimitMinutes(question.difficulty);
      const nextTestcases = [...visible, ...hidden];

      const alreadyCompliant =
        sampleCases.length === 2 &&
        hiddenCases.length === 20 &&
        Number(question.time_limit_minutes || 0) === nextTimeLimit;

      if (alreadyCompliant) {
        skipped += 1;
        continue;
      }

      if (!dryRun) {
        const problemId = await ensureProblemId(supabase, question);

        const { error: updateError } = await supabase
          .from("questions")
          .update({
            problem_id: problemId,
            sample_test_cases: visible,
            hidden_test_cases: hidden,
            testcases: nextTestcases,
            time_limit_minutes: nextTimeLimit,
          })
          .eq("id", question.id);

        if (updateError) {
          throw new Error(`question update failed: ${updateError.message}`);
        }

        const { error: deleteError } = await supabase
          .from("test_cases")
          .delete()
          .eq("problem_id", problemId);

        if (deleteError) {
          throw new Error(`test_cases delete failed: ${deleteError.message}`);
        }

        const normalizedRows = [
          ...visible.map((tc) => ({
            id: randomUUID(),
            problem_id: problemId,
            question_id: question.id,
            input: tc.input,
            expected_output: tc.expectedOutput,
            output: tc.expectedOutput,
            is_hidden: false,
            explanation: "Visible validation case",
            updated_at: new Date().toISOString(),
          })),
          ...hidden.map((tc) => ({
            id: randomUUID(),
            problem_id: problemId,
            question_id: question.id,
            input: tc.input,
            expected_output: tc.expectedOutput,
            output: tc.expectedOutput,
            is_hidden: true,
            explanation: "Hidden robustness case",
            updated_at: new Date().toISOString(),
          })),
        ];

        const { error: insertError } = await supabase.from("test_cases").insert(normalizedRows);
        if (insertError) {
          throw new Error(`test_cases insert failed: ${insertError.message}`);
        }
      }

      updated += 1;

      if ((i + 1) % 50 === 0) {
        console.log(`Progress: ${i + 1}/${rows.length} (updated=${updated}, skipped=${skipped}, failed=${failed})`);
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Failed ${question.id}: ${message}`);
    }
  }

  console.log(JSON.stringify({ total: rows.length, updated, skipped, failed, dryRun }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
