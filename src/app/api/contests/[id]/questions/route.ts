import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminClient, isAdminEmail, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonForbidden, jsonNotFound, jsonOk, jsonRateLimited, jsonUnauthorized } from "../../../../../lib/apiResponses";

type Body = {
  questionIds?: string[];
};

type ContestQuestionRecord = {
  id: string;
  title?: string | null;
  description?: string | null;
  difficulty?: string | null;
  function_name?: string | null;
  input_type?: string | null;
  output_type?: string | null;
  sample_test_cases?: unknown;
  hidden_test_cases?: unknown;
  testcases?: unknown;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeTestCaseArray(raw: unknown): Array<{ input: string; expectedOutput: string }> {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      input: String((item as { input?: string })?.input || "").trim(),
      expectedOutput: String((item as { expectedOutput?: string })?.expectedOutput || "").trim(),
    }))
    .filter((item) => item.input.length > 0 && item.expectedOutput.length > 0);
}

function isQuestionReady(record: ContestQuestionRecord): boolean {
  const title = String(record.title || "").trim();
  const description = String(record.description || "").trim();
  if (!title || !description) return false;

  const samples = normalizeTestCaseArray(record.sample_test_cases);
  const legacy = normalizeTestCaseArray(record.testcases);
  const hidden = normalizeTestCaseArray(record.hidden_test_cases);

  return samples.length > 0 || legacy.length > 0 || hidden.length > 0;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-questions:${ip}`, limit: 16, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId || !isUuid(contestId)) {
      return jsonBadRequest("Invalid contest id");
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const questionIds = Array.isArray(body.questionIds)
      ? Array.from(new Set(body.questionIds.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, 30)
      : [];

    if (questionIds.length === 0) {
      return jsonBadRequest("At least one question is required");
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email).trim().toLowerCase(),
    });

    const admin = getAdminClient();
    let questions: any = null;
    let questionsError: any = null;

    const qRes = await admin
      .from("questions")
      .select("id, title, description, difficulty, function_name, input_type, output_type, sample_test_cases, hidden_test_cases, testcases")
      .in("id", questionIds);

    if (qRes.error) {
      if (qRes.error.code === "42703") {
        // Fallback retry without newer columns
        const fallbackQ = await admin
          .from("questions")
          .select("id, title, description, difficulty, function_name, input_type, output_type, testcases")
          .in("id", questionIds);
        if (!fallbackQ.error) {
          questions = (fallbackQ.data || []).map((row: any) => ({
            ...row,
            sample_test_cases: [],
            hidden_test_cases: [],
          }));
        } else {
          questionsError = fallbackQ.error;
        }
      } else {
        questionsError = qRes.error;
      }
    } else {
      questions = qRes.data;
    }

    if (questionsError) {
      console.error("Contest question validation read failed", questionsError);
      return jsonError("Failed to validate contest questions", 500);
    }

    const questionMap = new Map<string, ContestQuestionRecord>(
      Array.isArray(questions)
        ? (questions as ContestQuestionRecord[]).map((row) => [String(row.id || ""), row])
        : []
    );

    const missingQuestions = questionIds.filter((id) => !questionMap.has(id));
    if (missingQuestions.length > 0) {
      return jsonBadRequest(`Invalid question id(s): ${missingQuestions.join(", ")}`);
    }

    const invalidQuestions = questionIds
      .map((id) => questionMap.get(id))
      .filter((record): record is ContestQuestionRecord => Boolean(record && !isQuestionReady(record)));

    if (invalidQuestions.length > 0) {
      return jsonError(
        `One or more selected questions are not valid yet. Please fix the question draft before saving the contest: ${invalidQuestions
          .map((q) => q.id)
          .join(", ")}`,
        400
      );
    }

    const { data: contest, error: contestError } = await admin
      .from("contests")
      .select("id, owner_user_id")
      .eq("id", contestId)
      .maybeSingle();

    if (contestError || !contest) {
      return jsonNotFound("Contest not found");
    }

    if (String(contest.owner_user_id || "") !== String(user.id) && !isAdminEmail(session.user.email)) {
      return jsonForbidden("Only contest creator can manage contest questions");
    }

    const { count: participantCount, error: participantCountError } = await admin
      .from("contest_participants")
      .select("id", { count: "exact", head: true })
      .eq("contest_id", contestId);

    if (participantCountError) {
      console.error("Contest participant count read failed", participantCountError);
      return jsonError("Failed to update contest questions", 500);
    }

    if ((participantCount || 0) > 0) {
      return jsonError("Question set is locked because participants have already joined.", 409);
    }

    const { error: deleteErr } = await admin
      .from("contest_questions")
      .delete()
      .eq("contest_id", contestId);

    if (deleteErr) {
      console.error("Contest question delete failed", deleteErr);
      return jsonError("Failed to update contest questions", 500);
    }

    const rows = questionIds.map((questionId) => ({
      contest_id: contestId,
      question_id: questionId,
      created_by_user_id: user.id,
    }));

    const { error: insertErr } = await admin.from("contest_questions").insert(rows);
    if (insertErr) {
      console.error("Contest question insert failed", insertErr);
      return jsonError("Failed to update contest questions", 500);
    }

    return jsonOk({ success: true, questionIds });
  } catch (error) {
    console.error("Error in POST /api/contests/[id]/questions", error);
    return jsonError("Failed to save contest questions", 500);
  }
}
