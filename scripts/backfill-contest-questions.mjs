import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFromLocalFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function pickRandom(items, count) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.max(0, count));
}

function isCompleteQuestion(q) {
  const diff = ["easy", "medium", "hard"].includes(String(q.difficulty || "").toLowerCase());
  const topics = Array.isArray(q.topic) && q.topic.length > 0;
  const desc = String(q.description || "").trim().length >= 80;
  const tcs = Array.isArray(q.testcases) ? q.testcases : [];
  const validTc = tcs.length > 0 && tcs.some((tc) => String((tc || {}).input || "").trim() && String((tc || {}).expectedOutput || "").trim());
  return diff && topics && desc && validTc;
}

function buildQuestionSet(questions, size = 5) {
  const complete = questions.filter(isCompleteQuestion);
  const easy = complete.filter((q) => String(q.difficulty || "").toLowerCase() === "easy");
  const medium = complete.filter((q) => String(q.difficulty || "").toLowerCase() === "medium");
  const hard = complete.filter((q) => String(q.difficulty || "").toLowerCase() === "hard");

  const picked = [...pickRandom(easy, 2), ...pickRandom(medium, 2), ...pickRandom(hard, 1)]
    .map((q) => String(q.id || ""))
    .filter(Boolean);

  const unique = Array.from(new Set(picked));
  if (unique.length >= size) return unique.slice(0, size);

  const fallback = pickRandom(complete, size)
    .map((q) => String(q.id || ""))
    .filter(Boolean);
  return Array.from(new Set([...unique, ...fallback])).slice(0, size);
}

async function main() {
  loadEnvFromLocalFile();
  const force = process.argv.includes("--force");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [{ data: contests, error: contestsErr }, { data: questions, error: questionsErr }] = await Promise.all([
    supabase.from("contests").select("id, title").order("created_at", { ascending: false }),
    supabase.from("questions").select("id, difficulty, topic, description, testcases").limit(2000),
  ]);

  if (contestsErr) throw new Error(contestsErr.message);
  if (questionsErr) throw new Error(questionsErr.message);

  const availableQuestions = Array.isArray(questions) ? questions : [];
  if (availableQuestions.length === 0) {
    console.log(JSON.stringify({ updated: 0, skipped: 0, reason: "No questions available" }, null, 2));
    return;
  }

  let updated = 0;
  let skipped = 0;
  const details = [];

  for (const contest of contests || []) {
    const contestId = String(contest.id || "");
    if (!contestId) continue;

    const [{ count: existingCount, error: existingErr }, { count: participantCount, error: participantErr }] = await Promise.all([
      supabase.from("contest_questions").select("id", { count: "exact", head: true }).eq("contest_id", contestId),
      supabase.from("contest_participants").select("id", { count: "exact", head: true }).eq("contest_id", contestId),
    ]);

    if (existingErr || participantErr) {
      skipped += 1;
      details.push({ contestId, title: contest.title, action: "skip", reason: existingErr?.message || participantErr?.message || "count error" });
      continue;
    }

    if ((existingCount || 0) > 0) {
      skipped += 1;
      details.push({ contestId, title: contest.title, action: "skip", reason: "already linked" });
      continue;
    }

    if (!force && (participantCount || 0) > 0) {
      skipped += 1;
      details.push({ contestId, title: contest.title, action: "skip", reason: "locked by participants" });
      continue;
    }

    const questionIds = buildQuestionSet(availableQuestions, 5);
    if (questionIds.length === 0) {
      skipped += 1;
      details.push({ contestId, title: contest.title, action: "skip", reason: "no complete questions" });
      continue;
    }

    const rows = questionIds.map((questionId) => ({
      contest_id: contestId,
      question_id: questionId,
      created_by_user_id: null,
    }));

    const { error: insertErr } = await supabase.from("contest_questions").insert(rows);
    if (insertErr) {
      skipped += 1;
      details.push({ contestId, title: contest.title, action: "skip", reason: insertErr.message });
      continue;
    }

    updated += 1;
    details.push({ contestId, title: contest.title, action: "backfilled", questionCount: rows.length });
  }

  console.log(
    JSON.stringify(
      {
        updated,
        skipped,
        force,
        totalContests: (contests || []).length,
        details,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("backfill-contest-questions failed:", error.message || String(error));
  process.exit(1);
});
