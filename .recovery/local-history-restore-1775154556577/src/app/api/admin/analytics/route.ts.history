import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient, isAdminEmail } from "@/lib/supabaseAdmin";

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(sessionEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getAdminClient();

    const [usersRes, submissionsRes, activityRes] = await Promise.all([
      admin.from("users").select("id, email, created_at"),
      admin.from("submissions").select("user_id, language, result, difficulty, created_at, feedback"),
      admin.from("user_activity").select("activity_type"),
    ]);

    const users = Array.isArray(usersRes.data) ? usersRes.data : [];
    const submissions = Array.isArray(submissionsRes.data) ? submissionsRes.data : [];
    const activities = Array.isArray(activityRes.data) ? activityRes.data : [];

    const totalUsers = users.length;
    const totalSubmissions = submissions.length;

    let acceptedCount = 0;
    const byLanguage = new Map<string, number>();
    const difficultyMap = { easy: 0, medium: 0, hard: 0, unknown: 0 };
    const byDay = new Map<string, number>();

    const contestByUser = new Map<
      string,
      {
        userId: string;
        email: string;
        contestsEnded: number;
        selectedTotal: number;
        attemptedTotal: number;
        acceptedTotal: number;
        averageLeaderboardScore: number;
      }
    >();

    for (const row of submissions) {
      const result = String(row.result || "").toLowerCase();
      const language = String(row.language || "unknown").toLowerCase();
      const difficulty = String((row as { difficulty?: string }).difficulty || "unknown").toLowerCase();
      const createdAt = String(row.created_at || "");

      if (result === "accepted" || result === "passed") acceptedCount += 1;
      byLanguage.set(language, (byLanguage.get(language) || 0) + 1);

      if (difficulty === "easy" || difficulty === "medium" || difficulty === "hard") {
        difficultyMap[difficulty] += 1;
      } else {
        difficultyMap.unknown += 1;
      }

      if (createdAt) {
        const day = new Date(createdAt).toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);
      }

      const feedback = toObject(row.feedback);
      if (feedback.type === "contest_summary") {
        const userId = String(row.user_id || "").trim();
        if (!userId) continue;

        const profile = users.find((u) => String(u.id || "") === userId);
        const email = String(profile?.email || "");
        const selectedCount = Number(feedback.selectedCount || 0);
        const attempted = Number(feedback.attemptedCount || 0);
        const accepted = Number(feedback.acceptedCount || 0);
        const score = Number(feedback.rating || 0);

        const prev = contestByUser.get(userId) || {
          userId,
          email,
          contestsEnded: 0,
          selectedTotal: 0,
          attemptedTotal: 0,
          acceptedTotal: 0,
          averageLeaderboardScore: 0,
        };

        const nextContests = prev.contestsEnded + 1;
        const nextAverage = ((prev.averageLeaderboardScore * prev.contestsEnded) + score) / nextContests;

        contestByUser.set(userId, {
          ...prev,
          email: prev.email || email,
          contestsEnded: nextContests,
          selectedTotal: prev.selectedTotal + selectedCount,
          attemptedTotal: prev.attemptedTotal + attempted,
          acceptedTotal: prev.acceptedTotal + accepted,
          averageLeaderboardScore: Number.isFinite(nextAverage) ? Math.round(nextAverage * 100) / 100 : 0,
        });
      }
    }

    const submissionsTrend = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([day, count]) => ({ day, count }));

    const topLanguages = Array.from(byLanguage.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    let resumeAnalyzerUses = 0;
    let resumeBuilderUses = 0;
    for (const event of activities) {
      const t = String(event.activity_type || "");
      if (t === "resume_analysis" || t === "resume_analyzer") resumeAnalyzerUses += 1;
      if (t === "resume_builder" || t === "resume_build") resumeBuilderUses += 1;
    }

    const acceptanceRate = totalSubmissions > 0
      ? Math.round((acceptedCount / totalSubmissions) * 100)
      : 0;

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalSubmissions,
        acceptanceRate,
        topLanguages,
        difficultyMap,
        submissionsTrend,
        activity: {
          resumeAnalyzerUses,
          resumeBuilderUses,
        },
      },
      users,
      contestUserStats: Array.from(contestByUser.values()).sort((a, b) => b.contestsEnded - a.contestsEnded),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
