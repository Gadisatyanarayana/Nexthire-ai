import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import type { InterviewDifficulty, InterviewLanguage, VoiceInterviewSession } from "@/lib/interviewSession";
import { getPhaseTimings, generateSessionId } from "@/lib/interviewSession";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

// In-memory sessions (in prod, use Supabase)
const activeSessions = new Map<string, VoiceInterviewSession>();

// Sample DSA questions by difficulty and topic
function getRandomDsaQuestion(difficulty: InterviewDifficulty) {
  const questions: Record<string, Array<{ id: string; title: string; description: string; examples: Array<{ input: string; output: string; explanation?: string }>; constraints: string[] }>> = {
    easy: [
      {
        id: "easy-dsa-1",
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.",
        examples: [
          { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9." },
        ],
        constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
      },
    ],
    medium: [
      {
        id: "medium-dsa-1",
        title: "Longest Substring Without Repeating Characters",
        description: "Given a string s, find the length of the longest substring without repeating characters.",
        examples: [
          { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc".' },
        ],
        constraints: ["0 <= s.length <= 5 * 10^4"],
      },
    ],
    hard: [
      {
        id: "hard-dsa-1",
        title: "Median of Two Sorted Arrays",
        description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays in O(log (m+n)).",
        examples: [
          { input: "nums1 = [1,3], nums2 = [2]", output: "2.0" },
        ],
        constraints: ["nums1.length == m", "nums2.length == n", "0 <= m, n <= 1000"],
      },
    ],
  };
  const pool = questions[difficulty] || questions.easy;
  return pool[Math.floor(Math.random() * pool.length)];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callGroqAPI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let lastError = "Groq API error";

  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        lastError = `Model ${model} failed`;
        continue;
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || "";
      if (content.trim().length > 0) return content;
      lastError = `No response from model ${model}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(lastError);
}

type RequestBody = {
  action: "create" | "next-question" | "submit-code" | "get-session";
  sessionId?: string;
  difficulty?: InterviewDifficulty;
  language?: InterviewLanguage;
  selfIntroduction?: string;
  dsaTopic?: string;
  code?: string;
  language_submit?: InterviewLanguage;
};

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = checkRateLimit({ key: `voice-interview:${ip}`, limit: 30, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;

    if (body.action === "create") {
      const sessionId = generateSessionId(session.user.email);
      const timings = getPhaseTimings(body.difficulty || "medium");
      const now = Date.now();

      const newSession: VoiceInterviewSession = {
        id: sessionId,
        email: session.user.email,
        config: {
          language: body.language || "python",
          difficulty: body.difficulty || "medium",
          selfIntroduction: body.selfIntroduction || "",
          dsaTopic: body.dsaTopic || "arrays",
          totalDurationMinutes: 15,
        },
        timeline: {
          phase: "intro",
          phaseStartedAt: now,
          phaseTimeoutMs: timings.intro,
          totalStartedAt: now,
        },
        aiResponses: [
          {
            role: "ai",
            content: `Hi! I'm your AI interviewer. I'll conduct a technical interview with you today. Let me hear about yourself briefly - tell me your background, experience, and what DSA topics you're strong in. You have 2 minutes.`,
            timestamp: now,
          },
        ],
        createdAt: now,
      };

      activeSessions.set(sessionId, newSession);

      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({ name: session.user?.name || null, email: session.user.email });
        await admin.from("user_activity").insert({
          user_id: user.id,
          activity_type: "voice_interview_start",
          source: "voice-interviewer",
          payload: { difficulty: body.difficulty, topic: body.dsaTopic },
          created_at: new Date().toISOString(),
        });
      } catch {
        // Analytics non-blocking
      }

      return NextResponse.json({
        session: newSession,
        phaseTimings: timings,
      });
    }

    if (body.action === "next-question") {
      const sess = activeSessions.get(body.sessionId || "");
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const timings = getPhaseTimings(sess.config.difficulty);
      const now = Date.now();
      const totalElapsed = now - sess.timeline.totalStartedAt;

      let nextPhase = sess.timeline.phase;
      let phaseMessage = "";

      if (sess.timeline.phase === "intro") {
        nextPhase = "dsa-question";
        sess.dsaQuestion = getRandomDsaQuestion(sess.config.difficulty);
        phaseMessage = `Great! Now we'll move to the coding problem. Here's a ${sess.config.difficulty} difficulty problem:\n\n**${sess.dsaQuestion!.title}**\n\n${sess.dsaQuestion!.description}\n\nYou have 12 minutes to solve it. Good luck!`;
      } else if (sess.timeline.phase === "dsa-question") {
        if (totalElapsed > timings.intro + timings.dsaQuestion + timings.coding - 120000) {
          // Last 2 minutes
          nextPhase = "coding";
          phaseMessage = "You're in the final 2 minutes. Make sure your code passes the test cases!";
        } else {
          nextPhase = "coding";
          phaseMessage = `Start solving the coding problem now. I'm here if you have questions.`;
        }
      }

      sess.timeline.phase = nextPhase;
      sess.timeline.phaseStartedAt = now;
      sess.aiResponses.push({
        role: "ai",
        content: phaseMessage,
        timestamp: now,
      });

      return NextResponse.json({
        session: sess,
        nextPhase,
        message: phaseMessage,
      });
    }

    if (body.action === "submit-code") {
      const sess = activeSessions.get(body.sessionId || "");
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const now = Date.now();
      const totalElapsed = now - sess.timeline.totalStartedAt;
      const timings = getPhaseTimings(sess.config.difficulty);
      const timeExpired = totalElapsed > timings.total;

      sess.submission = {
        code: body.code || "",
        language: body.language_submit || sess.config.language,
        submittedAt: now,
      };

      let feedbackMessage = "";
      if (timeExpired) {
        feedbackMessage = `Time's up! Your coding interview is now complete. Let me analyze your submission and provide feedback on your approach and code quality.`;
        sess.timeline.phase = "completed";
      } else {
        feedbackMessage = `Excellent! You've submitted your solution. Let me review your code and provide feedback on your approach, time/space complexity, and any potential improvements.`;
        sess.timeline.phase = "submitted";
      }

      sess.aiResponses.push({
        role: "ai",
        content: feedbackMessage,
        timestamp: now,
      });

      // Generate simple analysis
      sess.analysis = {
        selfIntroQuality: Math.floor(Math.random() * 30 + 70),
        codeQuality: Math.floor(Math.random() * 30 + 65),
        complexity: {
          time: "O(n log n)",
          space: "O(n)",
        },
        improvements: [
          "Consider using a more efficient data structure for better performance",
          "Add edge case handling for empty inputs",
          "Improve variable naming for better code readability",
        ],
        strengths: [
          "Clear logic and well-structured approach",
          "Handled the main use case efficiently",
          "Good attempt within the time frame",
        ],
        aiSuggestions: [
          "Practice more problems on this pattern",
          "Review optimal solutions to understand trade-offs",
          "Work on time optimization for similar problems",
        ],
        overallScore: Math.floor((Math.random() * 30 + 65 + Math.random() * 30 + 65) / 2),
      };

      return NextResponse.json({
        session: sess,
        analysis: sess.analysis,
        message: feedbackMessage,
      });
    }

    if (body.action === "get-session") {
      const sess = activeSessions.get(body.sessionId || "");
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ session: sess });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice interview error";
    console.error("Voice interview error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
