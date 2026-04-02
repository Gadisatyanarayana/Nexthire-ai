import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { inferDsaSection, sectionLabel } from "@/lib/dsaSections";

type SubmissionRow = {
  id: string;
  question_id: string | null;
  contest_id: string | null;
  language: string | null;
  difficulty: string | null;
  created_at: string;
  result: string | null;
  output: string | null;
  feedback: string | null;
};

type ContestReport = {
  contestId: string | null;
  createdAt: string;
  rating: number;
  acceptanceRate: number;
  acceptedCount: number;
  attemptedCount: number;
  timedOut: boolean;
  suggestions: string[];
};

type VoiceInterviewSummary = {
  createdAt: string;
  overallScore: number;
  introScore: number;
  codeScore: number;
};

type ActivityRow = {
  activity_type: string | null;
  source: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type SectionProgress = {
  sectionId: string;
  sectionLabel: string;
  solved: number;
  total: number;
  completionRate: number;
  recentSolved14: number;
};

const QUESTION_SECTION_CACHE_TTL_MS = 5 * 60 * 1000;

let cachedQuestionSectionMaps:
  | {
      expiresAt: number;
      questionSectionMap: Map<string, string>;
      sectionTotalMap: Map<string, number>;
    }
  | null = null;

function dayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function buildLastNDaysSeries(rows: SubmissionRow[], days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }

  const countMap = new Map<string, number>();
  for (const row of rows) {
    const key = dayKey(row.created_at);
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  return dateKeys.map((key) => ({
    day: key,
    count: countMap.get(key) || 0,
  }));
}

function computeCurrentStreak(rows: SubmissionRow[]): number {
  const activeDays = new Set(rows.map((row) => dayKey(row.created_at)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!activeDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

async function getQuestionSectionMaps() {
  if (cachedQuestionSectionMaps && cachedQuestionSectionMaps.expiresAt > Date.now()) {
    return cachedQuestionSectionMaps;
  }

  const supabaseAdmin = getAdminClient();
  const { data: allQuestions, error } = await supabaseAdmin
    .from("questions")
    .select("id, title, topic");

  if (error) {
    throw new Error(error.message);
  }

  const questionRows = Array.isArray(allQuestions) ? allQuestions : [];
  const questionSectionMap = new Map<string, string>();
  const sectionTotalMap = new Map<string, number>();

  for (const q of questionRows) {
    const qid = String(q.id || "");
    if (!qid) continue;
    const topics = Array.isArray(q.topic) ? q.topic.map((x) => String(x || "")) : [];
    const sectionId = inferDsaSection(topics, String(q.title || ""));
    questionSectionMap.set(qid, sectionId);
    sectionTotalMap.set(sectionId, (sectionTotalMap.get(sectionId) || 0) + 1);
  }

  cachedQuestionSectionMaps = {
    expiresAt: Date.now() + QUESTION_SECTION_CACHE_TTL_MS,
    questionSectionMap,
    sectionTotalMap,
  };

  return cachedQuestionSectionMaps;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: userRow, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, created_at")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!userRow?.id) {
      return NextResponse.json({
        stats: {
          totalSubmissions: 0,
          solvedCount: 0,
          successRate: 0,
          latestSubmissionAt: null,
          byDifficulty: { easy: 0, medium: 0, hard: 0, unknown: 0 },
          byLanguage: [],
          currentStreak: 0,
          weeklyActivity: [],
        },
        submissions: [],
      });
    }

    const [{ data: rows, error: submissionsError }, { data: activityRows }, questionMaps] = await Promise.all([
      supabaseAdmin
        .from("submissions")
        .select("id, question_id, language, difficulty, created_at, output, result, feedback, contest_id")
        .eq("user_id", userRow.id)
        .order("created_at", { ascending: false })
        .limit(1500),
      supabaseAdmin
        .from("user_activity")
        .select("activity_type, source, payload, created_at")
        .eq("user_id", userRow.id)
        .order("created_at", { ascending: false })
        .limit(2000),
      getQuestionSectionMaps(),
    ]);

    if (submissionsError) {
      return NextResponse.json({ error: submissionsError.message }, { status: 500 });
    }

    const submissions = (rows || []) as SubmissionRow[];
    const activities = (activityRows || []) as ActivityRow[];
    const { questionSectionMap, sectionTotalMap } = questionMaps;

    const byDifficulty = { easy: 0, medium: 0, hard: 0, unknown: 0 };
    const languageMap = new Map<string, number>();
    const sectionSolvedSet = new Map<string, Set<string>>();
    const sectionRecentSolvedMap = new Map<string, number>();

    const recentThreshold = new Date();
    recentThreshold.setHours(0, 0, 0, 0);
    recentThreshold.setDate(recentThreshold.getDate() - 13);

    let solvedCount = 0;
    const contestReports: ContestReport[] = [];
    const interviewReports: VoiceInterviewSummary[] = [];
    for (const row of submissions) {
      const diff = String(row.difficulty || "").toLowerCase();
      if (diff === "easy" || diff === "medium" || diff === "hard") byDifficulty[diff] += 1;
      else byDifficulty.unknown += 1;

      const lang = String(row.language || "unknown").trim().toLowerCase() || "unknown";
      languageMap.set(lang, (languageMap.get(lang) || 0) + 1);

      const result = String(row.result || "").toLowerCase();
      const output = String(row.output || "").toLowerCase();
      const passed = result === "passed" || result === "accepted" || (!!output && !output.includes("error"));
      if (passed) solvedCount += 1;

      if (passed) {
        const qid = String(row.question_id || "");
        if (qid) {
          const sectionId = questionSectionMap.get(qid) || "core-dsa";
          const set = sectionSolvedSet.get(sectionId) || new Set<string>();
          set.add(qid);
          sectionSolvedSet.set(sectionId, set);

          const createdAt = new Date(row.created_at);
          if (createdAt >= recentThreshold) {
            sectionRecentSolvedMap.set(sectionId, (sectionRecentSolvedMap.get(sectionId) || 0) + 1);
          }
        }
      }

      if (lang === "contest" && row.feedback) {
        try {
          const parsed = JSON.parse(row.feedback) as {
            type?: string;
            rating?: number;
            acceptanceRate?: number;
            acceptedCount?: number;
            attemptedCount?: number;
            timedOut?: boolean;
            suggestions?: string[];
          };
          if (parsed.type === "contest_summary") {
            contestReports.push({
              contestId: row.contest_id || null,
              createdAt: row.created_at,
              rating: Number(parsed.rating || 0),
              acceptanceRate: Number(parsed.acceptanceRate || 0),
              acceptedCount: Number(parsed.acceptedCount || 0),
              attemptedCount: Number(parsed.attemptedCount || 0),
              timedOut: Boolean(parsed.timedOut),
              suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
            });
          }
        } catch {
          // Ignore malformed feedback payloads
        }
      }

      if (lang === "voice-interview" && row.feedback) {
        try {
          const parsed = JSON.parse(row.feedback) as {
            type?: string;
            overallScore?: number;
            introScore?: number;
            codeScore?: number;
          };
          if (parsed.type === "voice_interview_summary") {
            interviewReports.push({
              createdAt: row.created_at,
              overallScore: Number(parsed.overallScore || 0),
              introScore: Number(parsed.introScore || 0),
              codeScore: Number(parsed.codeScore || 0),
            });
          }
        } catch {
          // Ignore malformed feedback payloads
        }
      }
    }

    const byLanguage = [...languageMap.entries()]
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const lastLoginAt = activities.find((a) => String(a.activity_type || '') === 'login')?.created_at || null;
    const pageTimeSeconds = activities
      .filter((a) => String(a.activity_type || '') === 'page_time')
      .reduce((sum, a) => sum + Number((a.payload as { durationSec?: number } | null)?.durationSec || 0), 0);

    const pageViewMap = new Map<string, number>();
    const chatbotSearches: Array<{ query: string; at: string }> = [];
    let contestActionCount = 0;
    let questionRunCount = 0;
    let questionSubmitCount = 0;

    for (const row of activities) {
      const type = String(row.activity_type || '');
      const payload = (row.payload || {}) as Record<string, unknown>;

      if (type === 'page_view') {
        const path = String(payload.path || '').trim();
        if (path) pageViewMap.set(path, (pageViewMap.get(path) || 0) + 1);
      }

      if (type === 'chatbot_search' || type === 'chatbot_message') {
        const query = String(payload.query || '').trim();
        if (query) chatbotSearches.push({ query: query.slice(0, 200), at: row.created_at });
      }

      if (type === 'contest_action') contestActionCount += 1;
      if (type === 'question_run') questionRunCount += 1;
      if (type === 'question_submit') questionSubmitCount += 1;
    }

    const topPages = [...pageViewMap.entries()]
      .map(([path, visits]) => ({ path, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8);

    const sectionProgress: SectionProgress[] = Array.from(sectionTotalMap.entries())
      .map(([sectionId, total]) => {
        const solved = sectionSolvedSet.get(sectionId)?.size || 0;
        const recentSolved14 = sectionRecentSolvedMap.get(sectionId) || 0;
        return {
          sectionId,
          sectionLabel: sectionLabel(sectionId),
          solved,
          total,
          completionRate: total > 0 ? Math.round((solved / total) * 100) : 0,
          recentSolved14,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate || b.solved - a.solved || a.sectionLabel.localeCompare(b.sectionLabel));

    const stats = {
      totalSubmissions: submissions.length,
      solvedCount,
      successRate: submissions.length > 0 ? Math.round((solvedCount / submissions.length) * 100) : 0,
      latestSubmissionAt: submissions[0]?.created_at || null,
      byDifficulty,
      byLanguage,
      sectionProgress,
      currentStreak: computeCurrentStreak(submissions),
      weeklyActivity: buildLastNDaysSeries(submissions, 14),
      contestReports: contestReports.slice(0, 10),
      voiceInterviewSummary: {
        totalInterviews: interviewReports.length,
        averageOverallScore:
          interviewReports.length > 0
            ? Math.round(interviewReports.reduce((sum, x) => sum + x.overallScore, 0) / interviewReports.length)
            : 0,
        averageIntroScore:
          interviewReports.length > 0
            ? Math.round(interviewReports.reduce((sum, x) => sum + x.introScore, 0) / interviewReports.length)
            : 0,
        averageCodingScore:
          interviewReports.length > 0
            ? Math.round(interviewReports.reduce((sum, x) => sum + x.codeScore, 0) / interviewReports.length)
            : 0,
        trend: interviewReports
          .slice()
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(-8),
      },
      personal: {
        name: String(userRow.name || ''),
        email: String(userRow.email || ''),
        joinedAt: String(userRow.created_at || ''),
      },
      activitySummary: {
        lastLoginAt,
        totalTimeSpentMinutes: Math.round(pageTimeSeconds / 60),
        topPages,
        chatbotSearches: chatbotSearches.slice(0, 30),
        contestActionCount,
        questionRunCount,
        questionSubmitCount,
      },
      resumeStats: {
        analyzerUses: activities.filter((a) => String(a.activity_type || "").startsWith("resume_")).length,
        builderUses: activities.filter((a) => String(a.activity_type || "").startsWith("resume_builder")).length,
      },
    };

    return NextResponse.json(
      { stats, submissions: submissions.slice(0, 12) },
      {
        headers: {
          "Cache-Control": "private, max-age=20, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
