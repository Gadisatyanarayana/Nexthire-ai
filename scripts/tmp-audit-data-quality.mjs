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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith("REPLACE_WITH_NEW_")) {
  throw new Error("Missing valid Supabase credentials in .env.local");
}

const sb = createClient(url, key);

const { data: questions, error: qErr } = await sb
  .from("questions")
  .select("id,title,difficulty,description,topic,testcases,examples");
if (qErr) throw qErr;

const incomplete = [];
for (const q of questions || []) {
  const difficulty = String(q.difficulty || "").toLowerCase();
  const hasValidDifficulty = ["easy", "medium", "hard"].includes(difficulty);
  const hasTopics = Array.isArray(q.topic) && q.topic.length > 0;
  const hasDescription = String(q.description || "").trim().length >= 80;
  const hasValidTestCases =
    Array.isArray(q.testcases) &&
    q.testcases.length > 0 &&
    q.testcases.some((tc) => String(tc?.input || "").trim() && String(tc?.expectedOutput || "").trim());
  const hasExamples = Array.isArray(q.examples) && q.examples.length > 0;

  if (!hasValidDifficulty || !hasTopics || !hasDescription || !hasValidTestCases || !hasExamples) {
    incomplete.push({
      id: q.id,
      title: q.title,
      hasValidDifficulty,
      hasTopics,
      hasDescription,
      hasValidTestCases,
      hasExamples,
    });
  }
}

const { data: contests, error: cErr } = await sb.from("contests").select("id,title");
if (cErr) throw cErr;

const { data: contestQuestions, error: cqErr } = await sb.from("contest_questions").select("contest_id,question_id");
if (cqErr) throw cqErr;

const contestIdSet = new Set((contests || []).map((c) => String(c.id)));
const questionIdSet = new Set((questions || []).map((q) => String(q.id)));

const orphanContestRefs = (contestQuestions || []).filter((row) => !contestIdSet.has(String(row.contest_id || "")));
const orphanQuestionRefs = (contestQuestions || []).filter((row) => !questionIdSet.has(String(row.question_id || "")));

const contestQuestionCountMap = new Map();
for (const row of contestQuestions || []) {
  const cid = String(row.contest_id || "");
  contestQuestionCountMap.set(cid, (contestQuestionCountMap.get(cid) || 0) + 1);
}

const contestsWithoutQuestions = (contests || [])
  .filter((c) => (contestQuestionCountMap.get(String(c.id)) || 0) === 0)
  .map((c) => ({ id: c.id, title: c.title }));

console.log(
  JSON.stringify(
    {
      questionsTotal: (questions || []).length,
      questionsIncompleteCount: incomplete.length,
      questionsIncompleteSample: incomplete.slice(0, 10),
      contestsTotal: (contests || []).length,
      contestQuestionsTotal: (contestQuestions || []).length,
      orphanContestRefs: orphanContestRefs.length,
      orphanQuestionRefs: orphanQuestionRefs.length,
      contestsWithoutQuestionsCount: contestsWithoutQuestions.length,
      contestsWithoutQuestionsSample: contestsWithoutQuestions.slice(0, 10),
    },
    null,
    2
  )
);
