import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

type CoachRequest = {
  message?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  questionId?: string;
  questionTitle?: string;
  questionDifficulty?: string;
  questionTopics?: string[];
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

function buildCoachPrompt(meta: {
  questionTitle?: string;
  questionDifficulty?: string;
  questionTopics?: string[];
}) {
  const topics = (meta.questionTopics || []).filter(Boolean).slice(0, 8).join(", ");
  const contextLines = [
    meta.questionTitle ? `Question title: ${meta.questionTitle}` : "",
    meta.questionDifficulty ? `Difficulty: ${meta.questionDifficulty}` : "",
    topics ? `Topics: ${topics}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are NextHire AI Coach, an expert 1:1 coding mentor.

Behavior:
- Be practical, human, and interview-focused.
- Give direct guidance, not generic textbook filler.
- If user asks for hints, give progressive hints from easy to strong.
- If user asks for full solution, provide complete solution with explanation.
- Always include time complexity and space complexity when discussing solutions.
- If user code/approach is wrong, explain exactly where and how to fix.
- Provide 2-4 crisp improvement points when useful.

Tone:
- Supportive but realistic like a senior interviewer.
- Clear, concise, and actionable.

Question Context:
${contextLines || "Not provided"}`;
}

async function callGroqAPI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let lastError = "AI coach unavailable";

  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.35,
          max_tokens: 900,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as GroqResponse;
        lastError = errorData.error?.message || `Model ${model} failed`;
        continue;
      }

      const data = (await response.json()) as GroqResponse;
      const content = data.choices?.[0]?.message?.content || "";
      if (content.trim().length > 0) return content;
      lastError = `No response from model ${model}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(lastError);
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `ai-coach:${ip}`, limit: 30, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CoachRequest;
    const userMessage = String(body.message || "").trim();
    if (!userMessage) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const history = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content.trim() }))
          .filter((m) => m.content.length > 0)
          .slice(-24)
      : [{ role: "user" as const, content: userMessage }];

    const responseText = await callGroqAPI([
      {
        role: "system",
        content: buildCoachPrompt({
          questionTitle: body.questionTitle,
          questionDifficulty: body.questionDifficulty,
          questionTopics: body.questionTopics,
        }),
      },
      ...history,
    ]);

    void (async () => {
      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({
          name: typeof session.user?.name === "string" ? session.user.name : null,
          email: userEmail,
        });

        await admin.from("user_activity").insert({
          user_id: user.id,
          activity_type: "ai_coach_query",
          source: "ai-coach",
          payload: {
            questionId: String(body.questionId || ""),
            questionTitle: String(body.questionTitle || ""),
            difficulty: String(body.questionDifficulty || ""),
            topics: Array.isArray(body.questionTopics) ? body.questionTopics.slice(0, 12) : [],
            query: userMessage.slice(0, 4000),
            response: responseText.slice(0, 4000),
            messageCount: history.length,
          },
          created_at: new Date().toISOString(),
        });
      } catch {
        // Never block response on analytics failures.
      }
    })();

    return NextResponse.json({ message: responseText });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load AI coaching";
    console.error("AI Coach error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
