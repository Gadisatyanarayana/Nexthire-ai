// diagnostic script for issue 4
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function runDiagnostic() {
  console.log("Fetching questions for diagnostic...");
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, title, testcases")
    .limit(30);

  if (error) {
    console.error("Failed to fetch questions:", error);
    return;
  }

  const { data: testCasesRows } = await supabase
    .from("test_cases")
    .select("problem_id, is_hidden");

  const tcMap = new Map();
  if (testCasesRows) {
    for (const row of testCasesRows) {
      if (!tcMap.has(row.problem_id)) {
        tcMap.set(row.problem_id, { visible: 0, hidden: 0 });
      }
      if (row.is_hidden) {
        tcMap.get(row.problem_id).hidden++;
      } else {
        tcMap.get(row.problem_id).visible++;
      }
    }
  }

  console.log("\nDiagnostics Report:\n");
  console.log("questionId | title | sampleCaseCount | hiddenCaseCount | totalEvaluationCases | source | status");
  console.log("-".repeat(100));

  for (const q of questions) {
    let sample = 0;
    let hidden = 0;
    let source = "";
    let status = "";

    const dbCases = tcMap.get(q.id);
    if (dbCases && (dbCases.visible > 0 || dbCases.hidden > 0)) {
      sample = dbCases.visible;
      hidden = dbCases.hidden;
      source = "normalized_test_cases";
    } else {
      const legacyCases = Array.isArray(q.testcases) ? q.testcases : [];
      if (legacyCases.length > 0) {
        sample = Math.min(2, legacyCases.length);
        hidden = Math.max(0, legacyCases.length - 2);
        source = "questions_fallback";
      } else {
        sample = 0;
        hidden = 0;
        source = "MISSING";
      }
    }

    if (hidden > 0) {
      status = "READY";
    } else if (sample > 0) {
      status = "MISSING_HIDDEN_CASES";
    } else {
      status = "MISSING_TEST_CASES";
    }

    console.log(`${q.id.slice(0, 8)}... | ${q.title.padEnd(20).slice(0, 20)} | ${sample.toString().padEnd(15)} | ${hidden.toString().padEnd(15)} | ${(sample + hidden).toString().padEnd(20)} | ${source.padEnd(20)} | ${status}`);
  }
}

runDiagnostic();
