import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type Body = {
  questionIds?: string[];
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(req: NextRequest, context: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId || !isUuid(contestId)) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const questionIds = Array.isArray(body.questionIds)
      ? Array.from(new Set(body.questionIds.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, 30)
      : [];

    if (questionIds.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email).trim().toLowerCase(),
    });

    const admin = getAdminClient();
    const { data: contest, error: contestError } = await admin
      .from("contests")
      .select("id, owner_user_id")
      .eq("id", contestId)
      .maybeSingle();

    if (contestError || !contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (String(contest.owner_user_id || "") !== String(user.id)) {
      return NextResponse.json({ error: "Only contest creator can manage contest questions" }, { status: 403 });
    }

    const { count: participantCount, error: participantCountError } = await admin
      .from("contest_participants")
      .select("id", { count: "exact", head: true })
      .eq("contest_id", contestId);

    if (participantCountError) {
      return NextResponse.json({ error: participantCountError.message }, { status: 500 });
    }

    if ((participantCount || 0) > 0) {
      return NextResponse.json({ error: "Question set is locked because participants have already joined." }, { status: 409 });
    }

    const { error: deleteErr } = await admin
      .from("contest_questions")
      .delete()
      .eq("contest_id", contestId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    const rows = questionIds.map((questionId) => ({
      contest_id: contestId,
      question_id: questionId,
      created_by_user_id: user.id,
    }));

    const { error: insertErr } = await admin.from("contest_questions").insert(rows);
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, questionIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save contest questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
