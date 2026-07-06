import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { getMasterSystemPrompt } from "@/lib/aiMasterPrompt";

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

  const corePrompt = getMasterSystemPrompt("coding-assistant");

  return `${corePrompt}

You are NextHire AI Coach, an expert DSA tutor and coding assistant.

For every problem, follow this structure STRICTLY:

1. UNDERSTAND THE PROBLEM
- Explain the problem in simple terms.
- Identify the pattern (stack, two pointers, DP, graph, greedy, etc.).

2. APPROACH
- Explain intuition clearly.
- Mention brute force briefly.
- Then give optimal approach.

3. HINTS (VERY IMPORTANT)
- Give 2-3 hints before code.
- Do not jump directly to full code.

4. CODE (IMPORTANT RULES)
- Use clean, correct code.
- Default language: Python.
- Ensure compatibility with Python 3.7+.

STRICT CODE RULES:
- Do NOT use list[int].
- Use either no type hints, or use "from typing import List" with List[int].
- Follow exact function signature required by platform.
- Do NOT add main().
- Do NOT print anything.

5. EDGE CASES
- Cover empty input, single element, sorted inputs, duplicates.

6. COMPLEXITY
- Time complexity and space complexity are mandatory.

7. DEBUGGING SAFETY
- Avoid syntax errors and unsupported features.
- Ensure code runs on older Python versions.

8. OUTPUT FORMAT (STRICT)
- Return only: Explanation, Code, Complexity.

9. SPECIAL RULE
- If platform expects class Solution with solve(...), keep solve exactly.
- Do not rename required functions.

10. FOR STACK / ADVANCED PROBLEMS
- Explain why stack (or chosen data structure) is needed.
- Explain each key variable role.

Tone:
- Clear, simple, structured, interview-focused.
- Avoid unnecessary complexity.

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
