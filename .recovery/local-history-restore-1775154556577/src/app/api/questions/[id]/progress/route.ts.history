import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ solved: false, latestAcceptedCode: null, latestAcceptedLanguage: null });
    }

    const { id: questionId } = await context.params;
    if (!questionId) {
      return NextResponse.json({ error: "Invalid question id" }, { status: 400 });
    }

    const user = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: String(session.user.email || "").trim().toLowerCase(),
    });

    const supabase = getAdminClient();
    const { data: acceptedRows, error } = await supabase
      .from("submissions")
      .select("code, language, created_at, result")
      .eq("user_id", user.id)
      .eq("question_id", questionId)
      .in("result", ["Accepted", "accepted", "Passed", "passed"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const latest = acceptedRows?.[0];
    return NextResponse.json({
      solved: Boolean(latest),
      latestAcceptedCode: latest?.code || null,
      latestAcceptedLanguage: latest?.language || null,
      lastSolvedAt: latest?.created_at || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load question progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
