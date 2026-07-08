 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { computeLeaderboard } from "@/lib/contestLeaderboard";

type LeaderboardUpdate = {
  type: "initial" | "update";
  leaderboard: Array<{
    rank: number;
    userId: string;
    name: string | null;
    email: string | null;
    score: number;
    joinedAt: string | null;
    finishedAt: string | null;
    timeTakenSeconds?: number | null;
    avgMemoryKb?: number;
    avgRuntimeMs?: number;
    totalCodeChars?: number;
    timedOut?: boolean;
  }>;
  timestamp: string;
};

const activeStreams = new Map<
  string,
  Set<{ write: (chunk: Uint8Array) => void; encoder: TextEncoder }>
>();

async function fetchLeaderboard(contestId: string) {
  const supabase = getAdminClient();

  try {
    const { data: contest } = await supabase
      .from("contests")
      .select("duration_minutes")
      .eq("id", contestId)
      .maybeSingle();
    const contestDuration = Number(contest?.duration_minutes || 90);

    const { data: contestParticipants, error: participantsError } = await supabase
      .from("contest_participants")
      .select("user_id, joined_at, finished_at, score")
      .eq("contest_id", contestId);

    if (participantsError || !contestParticipants) {
      console.error("Leaderboard fetch error:", participantsError);
      return [];
    }

    const { data: submissions } = await supabase
      .from("submissions")
      .select("user_id, question_id, result, code, runtime_ms, memory_kb, created_at")
      .eq("contest_id", contestId);

    const uniqueParticipantsMap = new Map<string, any>();
    for (const row of contestParticipants) {
      const userId = String(row.user_id || "").trim();
      if (!userId) continue;

      const existing = uniqueParticipantsMap.get(userId);
      if (!existing) {
        uniqueParticipantsMap.set(userId, row);
        continue;
      }

      const existingJoinedAt = existing.joined_at ? new Date(existing.joined_at).getTime() : Number.MAX_SAFE_INTEGER;
      const rowJoinedAt = row.joined_at ? new Date(row.joined_at).getTime() : Number.MAX_SAFE_INTEGER;
      if (rowJoinedAt < existingJoinedAt) {
        uniqueParticipantsMap.set(userId, row);
      }
    }
    const uniqueParticipants = Array.from(uniqueParticipantsMap.values());

    const participantUserIds = uniqueParticipants.map((item) => item.user_id);
    const { data: users } = participantUserIds.length
      ? await supabase
          .from("users")
          .select("id, name, email")
          .in("id", participantUserIds)
      : { data: [] };

    return computeLeaderboard(
      uniqueParticipants,
      submissions || [],
      users || [],
      contestDuration
    );
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

async function streamLeaderboard(
  contestId: string,
  writer: { write: (chunk: Uint8Array) => void; encoder: TextEncoder }
) {
  const encoder = writer.encoder;
  let lastLeaderboard: string = "";

  const sendUpdate = async () => {
    try {
      const leaderboard = await fetchLeaderboard(contestId);
      const newLeaderboardStr = JSON.stringify(leaderboard);

      if (newLeaderboardStr !== lastLeaderboard) {
        lastLeaderboard = newLeaderboardStr;

        const update: LeaderboardUpdate = {
          type: lastLeaderboard === newLeaderboardStr && lastLeaderboard !== "" ? "update" : "initial",
          leaderboard,
          timestamp: new Date().toISOString(),
        };

        writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
      }
    } catch (error) {
      console.error("Error streaming leaderboard:", error);
    }
  };

  // Send initial update
  await sendUpdate();

  // Poll every 2 seconds for updates
  const interval = setInterval(sendUpdate, 2000);

  return () => clearInterval(interval);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const contestId = String(resolvedParams?.id || "").trim();
    if (!contestId) {
      return NextResponse.json({ error: "Invalid contest id" }, { status: 400 });
    }

    // Verify user has access to this contest
    const supabase = getAdminClient();
    const { data: contest, error: contestError } = await supabase
      .from("contests")
      .select("*")
      .eq("id", contestId)
      .single();

    if (contestError || !contest) {
      return NextResponse.json({ error: "Contest not found" }, { status: 404 });
    }

    const headers = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    };

    // Create a transform stream for SSE
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        const writer = {
          write: (chunk: Uint8Array) => controller.enqueue(chunk),
          encoder,
        };

        // Register this stream
        if (!activeStreams.has(contestId)) {
          activeStreams.set(contestId, new Set());
        }
        activeStreams.get(contestId)!.add(writer);

        // Start streaming
        const cleanup = await streamLeaderboard(contestId, writer);

        // Handle cleanup
        req.signal.addEventListener("abort", () => {
          cleanup();
          activeStreams.get(contestId)?.delete(writer);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new NextResponse(customReadable, { headers });
  } catch (error) {
    console.error("Error in leaderboard stream:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
