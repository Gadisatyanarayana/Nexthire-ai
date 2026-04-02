import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auto-sync user if they don't exist in database
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

    const supabase = getAdminClient();

    const { data: myContests, error: myContestsError } = await supabase
      .from("contests")
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at")
      .eq("owner_user_id", userRow.id)
      .order("created_at", { ascending: false });

    if (myContestsError) {
      console.error("Error fetching contests", myContestsError);
      return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }

    const { data: publicContests, error: publicError } = await supabase
      .from("contests")
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at")
      .eq("mode", "public")
      .order("starts_at", { ascending: true })
      .limit(20);

    if (publicError) {
      console.error("Error fetching public contests", publicError);
      return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }

    const { data: myContestSummaries, error: summaryError } = await supabase
      .from("submissions")
      .select("contest_id, result, feedback, created_at")
      .eq("user_id", userRow.id)
      .not("contest_id", "is", null)
      .in("result", ["completed", "time_exceeded"])
      .order("created_at", { ascending: false })
      .limit(300);

    if (summaryError) {
      console.error("Error fetching contest summaries", summaryError);
      return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
    }

    const seen = new Set<string>();
    const myContestResults = (myContestSummaries || [])
      .map((row) => {
        const contestId = String(row.contest_id || "").trim();
        if (!contestId || seen.has(contestId)) return null;
        seen.add(contestId);

        const feedbackRaw = row.feedback;
        let feedback: Record<string, unknown> = {};
        if (typeof feedbackRaw === "string") {
          try {
            feedback = JSON.parse(feedbackRaw) as Record<string, unknown>;
          } catch {
            feedback = {};
          }
        } else if (feedbackRaw && typeof feedbackRaw === "object") {
          feedback = feedbackRaw as Record<string, unknown>;
        }

        return {
          contestId,
          result: String(row.result || ""),
          endedAt: row.created_at,
          attemptedCount: Number(feedback.attemptedCount || 0),
          acceptedCount: Number(feedback.acceptedCount || 0),
          selectedCount: Number(feedback.selectedCount || 0),
          rating: Number(feedback.rating || 0),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ myContests: myContests ?? [], publicContests: publicContests ?? [], myContestResults });
  } catch (error) {
    console.error("Unexpected error in GET /api/contests", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `NHAI-${code}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, mode, durationMinutes, startsAt, questionIds } = body as {
      title?: string;
      description?: string;
      mode?: string;
      durationMinutes?: number;
      startsAt?: string | null;
      questionIds?: string[];
    };

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ error: "Title is required and should be at least 3 characters." }, { status: 400 });
    }

    const normalizedMode = mode === "private" ? "private" : "public";

    // Auto-sync user if they don't exist in database
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

    const supabase = getAdminClient();

    const joinCode = generateJoinCode();

    const { data, error } = await supabase
      .from("contests")
      .insert({
        owner_user_id: userRow.id,
        title: title.trim(),
        description: description?.trim() || null,
        mode: normalizedMode,
        join_code: joinCode,
        duration_minutes: typeof durationMinutes === "number" && durationMinutes > 0 ? durationMinutes : 90,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        status: "scheduled",
      })
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at")
      .single();

    if (error || !data) {
      console.error("Error creating contest", error);
      return NextResponse.json({ error: "Failed to create contest" }, { status: 500 });
    }

    const selectedQuestionIds = Array.isArray(questionIds)
      ? Array.from(new Set(questionIds.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, 25)
      : [];

    if (selectedQuestionIds.length > 0) {
      const rows = selectedQuestionIds.map((questionId) => ({
        contest_id: data.id,
        question_id: questionId,
        created_by_user_id: userRow.id,
      }));

      const { error: contestQuestionError } = await supabase
        .from("contest_questions")
        .insert(rows);

      if (contestQuestionError) {
        console.error("Error saving contest questions", contestQuestionError);
      }
    }

    return NextResponse.json({ contest: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error in POST /api/contests", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
