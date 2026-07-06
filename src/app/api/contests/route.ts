import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonRateLimited, jsonUnauthorized, withNoStore } from "../../../lib/apiResponses";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const supabase = getAdminClient();

    if (!session?.user?.email) {
      const { data: publicContests, error: publicError } = await supabase
        .from("contests")
        .select("id, title, description, mode, duration_minutes, starts_at, status, created_at")
        .eq("mode", "public")
        .order("starts_at", { ascending: true })
        .limit(20);

      if (publicError) {
        console.error("Error fetching public contests", publicError);
        return NextResponse.json({ error: "Failed to fetch contests" }, { status: 500 });
      }

      return NextResponse.json(
        { myContests: [], publicContests: publicContests ?? [], myContestResults: [] },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        }
      );
    }

    // Auto-sync user if they don't exist in database
    const userRow = await upsertUserAdmin({
      name: session.user.name ?? null,
      email: normalizeEmail(session.user.email),
    });

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
      .select("id, title, description, mode, duration_minutes, starts_at, status, created_at")
      .eq("mode", "public")
      .neq("owner_user_id", userRow.id)
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

    return NextResponse.json(
      { myContests: myContests ?? [], publicContests: publicContests ?? [], myContestResults },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
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
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `contest-create:${ip}`, limit: 10, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return jsonUnauthorized();
    }

    const body = await req.json().catch(() => ({}));
    const { title, description, mode, durationMinutes, startsAt, questionIds, config } = body as {
      title?: string;
      description?: string;
      mode?: string;
      durationMinutes?: number;
      startsAt?: string | null;
      questionIds?: string[];
      config?: {
        selectedSubsections?: string[];
        selectedDifficulties?: string[];
        selectedCompanies?: string[];
        selectedTopics?: string[];
        questionCount?: number;
        selectionMode?: 'auto' | 'manual';
      };
    };

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return jsonBadRequest("Title is required and should be at least 3 characters.");
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
        config: config || {},
      })
      .select("id, title, description, mode, join_code, duration_minutes, starts_at, status, created_at, config")
      .single();

    if (error || !data) {
      console.error("Error creating contest", error);
      return jsonError("Failed to create contest", 500);
    }

    let finalQuestionIds: string[] = [];

    if (config?.selectionMode === 'auto') {
      // Perform dynamic category/subject/difficulty/company auto-selection
      let dbQuery = supabase.from("questions").select("id, difficulty, topic, company_tags");
      
      const diffs = config.selectedDifficulties || [];
      if (diffs.length > 0) {
        dbQuery = dbQuery.in("difficulty", diffs);
      }

      const { data: matchedQuestions } = await dbQuery.limit(1000);
      
      if (Array.isArray(matchedQuestions) && matchedQuestions.length > 0) {
        let pool = [...matchedQuestions];

        // Filter by subsections if specified
        const subs = (config.selectedSubsections || []).map(s => s.toLowerCase());
        if (subs.length > 0) {
          pool = pool.filter(q => {
            const topics = (q.topic || []).map((t: string) => t.toLowerCase());
            return topics.some((t: string) => subs.includes(t));
          });
        }

        // Filter by company tags if specified
        const comps = (config.selectedCompanies || []).map(c => c.toLowerCase());
        if (comps.length > 0) {
          pool = pool.filter(q => {
            const tags = (q.company_tags || []).map((t: string) => t.toLowerCase());
            return tags.some((t: string) => comps.includes(t));
          });
        }

        // Fallback: if filtering left 0 questions, revert to base difficulty matched pool
        if (pool.length === 0 && matchedQuestions.length > 0) {
          pool = [...matchedQuestions];
        }

        // Shuffle pool
        pool.sort(() => Math.random() - 0.5);

        // Take requested count
        const count = Math.max(1, Math.min(25, Number(config.questionCount || 5)));
        finalQuestionIds = pool.slice(0, count).map(q => q.id);
      }
    } else {
      // Manual selection
      finalQuestionIds = Array.isArray(questionIds)
        ? Array.from(new Set(questionIds.map((id) => String(id || "").trim()).filter(Boolean))).slice(0, 25)
        : [];
    }

    if (finalQuestionIds.length > 0) {
      const rows = finalQuestionIds.map((questionId) => ({
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

    return NextResponse.json({ contest: data }, { status: 201, headers: withNoStore() });
  } catch (error) {
    console.error("Unexpected error in POST /api/contests", error);
    return jsonError("Internal server error", 500);
  }
}
