export type LeaderboardParticipant = {
  rank: number;
  userId: string;
  name: string | null;
  email: string | null;
  score: number;
  joinedAt: string | null;
  finishedAt: string | null;
  timeTakenSeconds: number | null;
  avgMemoryKb: number;
  avgRuntimeMs: number;
  totalCodeChars: number;
  timedOut: boolean;
};

export function computeLeaderboard(
  participants: any[],
  submissions: any[],
  users: any[],
  contestDurationMinutes: number
): LeaderboardParticipant[] {
  const userMap = new Map<string, { name: string | null; email: string | null }>();
  for (const u of users || []) {
    userMap.set(String(u.id), {
      name: u.name ?? null,
      email: u.email ?? null,
    });
  }

  const submissionsByUser = new Map<string, any[]>();
  for (const sub of submissions || []) {
    const uid = String(sub.user_id || "").trim();
    if (!uid) continue;
    const list = submissionsByUser.get(uid) || [];
    list.push(sub);
    submissionsByUser.set(uid, list);
  }

  const details = participants.map((p) => {
    const userId = String(p.user_id || "").trim();
    const userSubmissions = submissionsByUser.get(userId) || [];
    
    // Group accepted/passed submissions by question_id (take the first accepted submission for each question)
    const solvedMap = new Map<string, any>();
    for (const sub of userSubmissions) {
      const res = String(sub.result || "").toLowerCase();
      if (res === "accepted" || res === "passed" || res === "success") {
        const qid = String(sub.question_id || "");
        if (qid && !solvedMap.has(qid)) {
          solvedMap.set(qid, sub);
        }
      }
    }

    const solvedList = Array.from(solvedMap.values());
    const score = solvedList.length;

    // Averages
    let totalMemory = 0;
    let totalRuntime = 0;
    let totalCodeChars = 0;
    let memoryCount = 0;
    let runtimeCount = 0;

    for (const sub of solvedList) {
      if (typeof sub.memory_kb === "number" && sub.memory_kb > 0) {
        totalMemory += sub.memory_kb;
        memoryCount++;
      }
      if (typeof sub.runtime_ms === "number" && sub.runtime_ms > 0) {
        totalRuntime += sub.runtime_ms;
        runtimeCount++;
      }
      if (sub.code) {
        totalCodeChars += String(sub.code).length;
      }
    }

    const avgMemoryKb = memoryCount > 0 ? Math.round(totalMemory / memoryCount) : 0;
    const avgRuntimeMs = runtimeCount > 0 ? Math.round(totalRuntime / runtimeCount) : 0;

    // Time Taken Calculation
    const joinedAtTime = p.joined_at ? new Date(p.joined_at).getTime() : null;
    const finishedAtTime = p.finished_at ? new Date(p.finished_at).getTime() : null;
    
    let timeTakenSeconds: number | null = null;
    let timedOut = false;

    if (joinedAtTime) {
      if (finishedAtTime) {
        timeTakenSeconds = (finishedAtTime - joinedAtTime) / 1000;
        // Check if they finished after the contest duration limit
        const limitMs = contestDurationMinutes * 60 * 1000;
        if (finishedAtTime - joinedAtTime > limitMs) {
          timedOut = true;
        }
      } else {
        // Did not finish: currently timed out or DNF
        timedOut = true;
      }
    }

    // Last success timestamp
    let lastSuccessTime = 0;
    for (const sub of solvedList) {
      if (sub.created_at) {
        const t = new Date(sub.created_at).getTime();
        if (t > lastSuccessTime) lastSuccessTime = t;
      }
    }

    return {
      userId,
      name: userMap.get(userId)?.name || null,
      email: userMap.get(userId)?.email || null,
      score,
      joinedAt: p.joined_at || null,
      finishedAt: p.finished_at || null,
      timeTakenSeconds,
      avgMemoryKb,
      avgRuntimeMs,
      totalCodeChars,
      timedOut,
      lastSuccessTime: lastSuccessTime || Number.MAX_SAFE_INTEGER,
    };
  });

  // Sort logic:
  // 1. Score desc
  // 2. Finished status (DNF/Timed Out is placed below successful finishes)
  // 3. Time taken asc
  // 4. Memory asc
  // 5. Runtime asc
  // 6. Code size asc
  // 7. Last success timestamp asc
  details.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Finished status (false is better than true for timedOut)
    if (a.timedOut !== b.timedOut) {
      return a.timedOut ? 1 : -1;
    }

    // Time Taken (if not timed out)
    const timeA = a.timeTakenSeconds ?? Number.MAX_SAFE_INTEGER;
    const timeB = b.timeTakenSeconds ?? Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) return timeA - timeB;

    // Memory usage
    const memA = a.avgMemoryKb || Number.MAX_SAFE_INTEGER;
    const memB = b.avgMemoryKb || Number.MAX_SAFE_INTEGER;
    if (memA !== memB) return memA - memB;

    // Execution time
    const runA = a.avgRuntimeMs || Number.MAX_SAFE_INTEGER;
    const runB = b.avgRuntimeMs || Number.MAX_SAFE_INTEGER;
    if (runA !== runB) return runA - runB;

    // Code size
    const sizeA = a.totalCodeChars || Number.MAX_SAFE_INTEGER;
    const sizeB = b.totalCodeChars || Number.MAX_SAFE_INTEGER;
    if (sizeA !== sizeB) return sizeA - sizeB;

    // Last success timestamp
    return a.lastSuccessTime - b.lastSuccessTime;
  });

  return details.map((item, index) => ({
    rank: index + 1,
    userId: item.userId,
    name: item.name,
    email: item.email,
    score: item.score,
    joinedAt: item.joinedAt,
    finishedAt: item.finishedAt,
    timeTakenSeconds: item.timeTakenSeconds,
    avgMemoryKb: item.avgMemoryKb,
    avgRuntimeMs: item.avgRuntimeMs,
    totalCodeChars: item.totalCodeChars,
    timedOut: item.timedOut,
  }));
}
