import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
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

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function extractSessionId(payload: Record<string, unknown>): string {
  return String(payload.sessionId || payload.session_id || "").trim();
}

type AdminUserRow = {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string | null;
};

type AdminActivityRow = {
  user_id: string | null;
  activity_type: string | null;
  source: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type AdminUserSummary = {
  userId: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  totalSubmissions: number;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  lastLogoutAt: string | null;
  loginCount: number;
  logoutCount: number;
  totalPageTimeMinutes: number;
  chatbotPromptCount: number;
  aiCoachPromptCount: number;
  questionRunCount: number;
  questionSubmitCount: number;
  contestActionCount: number;
  recentActivities: Array<{ type: string; source: string | null; at: string; payload: Record<string, unknown> }>;
  recentPrompts: Array<{ type: string; query: string; at: string; payload: Record<string, unknown> }>;
};

function createUserSummary(user: AdminUserRow): AdminUserSummary {
  const email = String(user.email || "");
  return {
    userId: user.id,
    name: String(user.name || ""),
    email,
    role: isAdminEmail(email) ? "admin" : "user",
    createdAt: String(user.created_at || ""),
    totalSubmissions: 0,
    lastActivityAt: null,
    lastLoginAt: null,
    lastLogoutAt: null,
    loginCount: 0,
    logoutCount: 0,
    totalPageTimeMinutes: 0,
    chatbotPromptCount: 0,
    aiCoachPromptCount: 0,
    questionRunCount: 0,
    questionSubmitCount: 0,
    contestActionCount: 0,
    recentActivities: [],
    recentPrompts: [],
  };
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
      admin.from("users").select("id, name, email, created_at"),
      admin.from("submissions").select("user_id, language, result, difficulty, created_at, feedback"),
      admin.from("user_activity").select("user_id, activity_type, source, payload, created_at"),
    ]);

    const users = Array.isArray(usersRes.data) ? (usersRes.data as AdminUserRow[]) : [];
    const submissions = Array.isArray(submissionsRes.data) ? submissionsRes.data : [];
    const activities = Array.isArray(activityRes.data) ? (activityRes.data as AdminActivityRow[]) : [];

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
    const voiceTrend: Array<{ day: string; overall: number; intro: number; coding: number }> = [];
    let voiceCount = 0;
    let voiceOverallSum = 0;
    let voiceIntroSum = 0;
    let voiceCodingSum = 0;
    const userSummaries = new Map<string, AdminUserSummary>();
    const loginTrend = new Map<string, number>();
    const logoutTrend = new Map<string, number>();

    for (const user of users) {
      userSummaries.set(user.id, createUserSummary(user));
    }

    for (const row of submissions) {
      const result = String(row.result || "").toLowerCase();
      const language = String(row.language || "unknown").toLowerCase();
      const difficulty = String((row as { difficulty?: string }).difficulty || "unknown").toLowerCase();
      const createdAt = String(row.created_at || "");
      const userId = String(row.user_id || "").trim();

      if (result === "accepted" || result === "passed") acceptedCount += 1;
      byLanguage.set(language, (byLanguage.get(language) || 0) + 1);

      if (userId) {
        const profile = users.find((u) => String(u.id || "") === userId);
        if (profile) {
          const summary = userSummaries.get(userId) || createUserSummary(profile);
          summary.totalSubmissions += 1;
          userSummaries.set(userId, summary);
        }
      }

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

      if (feedback.type === "voice_interview_summary") {
        const overall = Number(feedback.overallScore || 0);
        const intro = Number(feedback.introScore || 0);
        const coding = Number(feedback.codeScore || 0);
        const day = createdAt ? new Date(createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

        voiceCount += 1;
        voiceOverallSum += overall;
        voiceIntroSum += intro;
        voiceCodingSum += coding;
        voiceTrend.push({ day, overall, intro, coding });
      }
    }

    for (const row of activities) {
      const userId = String(row.user_id || "").trim();
      if (!userId) continue;

      const profile = users.find((item) => String(item.id || "") === userId);
      if (!profile) continue;

      const summary = userSummaries.get(userId) || createUserSummary(profile);
      userSummaries.set(userId, summary);

      const type = String(row.activity_type || "");
      const at = String(row.created_at || "");
      const payload = (row.payload || {}) as Record<string, unknown>;
      const sessionId = extractSessionId(payload);

      summary.lastActivityAt = summary.lastActivityAt && summary.lastActivityAt > at ? summary.lastActivityAt : at;
      summary.recentActivities.unshift({ type, source: row.source, at, payload });
      summary.recentActivities = summary.recentActivities.slice(0, 20);

      if (type === "login") {
        summary.loginCount += 1;
        summary.lastLoginAt = summary.lastLoginAt && summary.lastLoginAt > at ? summary.lastLoginAt : at;
        loginTrend.set(dayKey(at), (loginTrend.get(dayKey(at)) || 0) + 1);
      }

      if (type === "logout") {
        summary.logoutCount += 1;
        summary.lastLogoutAt = summary.lastLogoutAt && summary.lastLogoutAt > at ? summary.lastLogoutAt : at;
        logoutTrend.set(dayKey(at), (logoutTrend.get(dayKey(at)) || 0) + 1);
      }

      if (type === "page_time") {
        summary.totalPageTimeMinutes += Math.max(0, Math.round(Number(payload.durationSec || 0) / 60));
      }

      if (type === "chatbot_search" || type === "chatbot_message") {
        summary.chatbotPromptCount += 1;
        const query = String(payload.query || "").trim();
        if (query) {
          summary.recentPrompts.unshift({ type: "chatbot", query: query.slice(0, 300), at, payload });
          summary.recentPrompts = summary.recentPrompts.slice(0, 20);
        }
      }

      if (type === "ai_coach_query") {
        summary.aiCoachPromptCount += 1;
        const query = String(payload.query || "").trim();
        if (query) {
          summary.recentPrompts.unshift({ type: "ai_coach", query: query.slice(0, 300), at, payload });
          summary.recentPrompts = summary.recentPrompts.slice(0, 20);
        }
      }

      if (type === "question_run") summary.questionRunCount += 1;
      if (type === "question_submit") summary.questionSubmitCount += 1;
      if (type === "contest_action") summary.contestActionCount += 1;

      if (sessionId && type === "page_view") {
        // Keep the payload shape stable for drilldowns.
        summary.recentActivities[0] = summary.recentActivities[0] || { type, source: row.source, at, payload };
      }
    }

    const loginLogoutTrend = Array.from(new Set([...loginTrend.keys(), ...logoutTrend.keys()]))
      .sort((a, b) => a.localeCompare(b))
      .slice(-14)
      .map((day) => ({
        day,
        logins: loginTrend.get(day) || 0,
        logouts: logoutTrend.get(day) || 0,
      }));

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
          loginLogoutTrend,
        },
        voiceInterviews: {
          total: voiceCount,
          averageOverallScore: voiceCount > 0 ? Math.round(voiceOverallSum / voiceCount) : 0,
          averageIntroScore: voiceCount > 0 ? Math.round(voiceIntroSum / voiceCount) : 0,
          averageCodingScore: voiceCount > 0 ? Math.round(voiceCodingSum / voiceCount) : 0,
          trend: voiceTrend.slice(-20),
        },
      },
      users: Array.from(userSummaries.values()).sort((a, b) => (b.lastActivityAt || "").localeCompare(a.lastActivityAt || "") || a.email.localeCompare(b.email)),
      contestUserStats: Array.from(contestByUser.values()).sort((a, b) => b.contestsEnded - a.contestsEnded),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
