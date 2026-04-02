import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { joinCode } = body as { joinCode?: string };

    if (!joinCode || typeof joinCode !== "string") {
      return NextResponse.json({ error: "joinCode is required" }, { status: 400 });
    }

    const normalizedCode = joinCode.trim().toUpperCase();

    const supabase = getAdminClient();

    const { data: contest, error } = await supabase
      .from("contests")
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at")
      .eq("join_code", normalizedCode)
      .single();

    if (error || !contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    if (contest.status === "cancelled") {
      return NextResponse.json({ error: "Contest is cancelled" }, { status: 400 });
    }

    // Ensure user row exists
    const { data: userRow } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", session.user.email)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert participation (user joins this contest)
    const { error: participantError } = await supabase.from("contest_participants").upsert(
      {
        contest_id: contest.id,
        user_id: userRow.id,
      },
      { onConflict: "contest_id,user_id" }
    );

    if (participantError) {
      console.error("Error upserting contest_participants", participantError);
    }

    return NextResponse.json({ contest });
  } catch (error) {
    console.error("Unexpected error in POST /api/contests/join", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
