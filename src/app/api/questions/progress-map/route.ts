import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

const ACCEPTED_RESULTS = ["Accepted", "accepted", "Passed", "passed"];
const MAX_IDS = 250;

function parseQuestionIds(searchParams: URLSearchParams): string[] {
  const direct = searchParams.getAll("id");
  const csv = String(searchParams.get("ids") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set([...direct, ...csv].map((item) => String(item || "").trim()).filter(Boolean))).slice(0, MAX_IDS);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionIds = parseQuestionIds(searchParams);

    if (questionIds.length === 0) {
      return NextResponse.json({ solvedMap: {}, solvedAtMap: {} });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      const solvedMap = Object.fromEntries(questionIds.map((id) => [id, false]));
      return NextResponse.json({ solvedMap, solvedAtMap: {} });
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email || "").trim().toLowerCase(),
    });

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("submissions")
      .select("question_id, created_at, result")
      .eq("user_id", user.id)
      .is("contest_id", null)
      .in("question_id", questionIds)
      .in("result", ACCEPTED_RESULTS)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to load solved status" }, { status: 500 });
    }

    const solvedMap: Record<string, boolean> = Object.fromEntries(questionIds.map((id) => [id, false]));
    const solvedAtMap: Record<string, string> = {};

    for (const row of data || []) {
      const questionId = String((row as { question_id?: string }).question_id || "").trim();
      if (!questionId) continue;
      solvedMap[questionId] = true;

      if (!solvedAtMap[questionId]) {
        solvedAtMap[questionId] = String((row as { created_at?: string }).created_at || "");
      }
    }

    return NextResponse.json({ solvedMap, solvedAtMap });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load solved status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
