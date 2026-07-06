import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { getMasterSystemPrompt } from "@/lib/aiMasterPrompt";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

type ChatRequest = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const ASSISTANT_SYSTEM_PROMPT = `${getMasterSystemPrompt("coding-assistant")}

You are the NextHire AI Global Productivity and Placement Coach.
Your primary role is to help students plan their coding practice, structure study schedules, optimize task managers, prepare roadmap milestones, recommend daily topics, and maintain motivation.

If the user asks for roadmaps, daily schedules, topic priority, study plans, or productivity advice, structure your response as follows:
1) Placement Strategy: Insights on the specific topic or company target.
2) Actionable Steps: Clear daily tasks or study schedules.
3) Motivation Boost: A short, high-energy summary to keep them going.

Ensure your answers are concise, structured, and focused on placement success.`;

function detectMode(userText: string): "full" | "hints" | "explain" | "code" {
  const text = userText.toLowerCase();
  if (/\b(hint|hints only|only hints|step hint)\b/.test(text) && !/\b(full code|complete code|solution code|final code)\b/.test(text)) {
    return "hints";
  }
  if (/\b(explain only|only explain|just explain|intuition only)\b/.test(text)) {
    return "explain";
  }
  if (/\b(full code|complete code|solution code|just code|only code)\b/.test(text)) {
    return "code";
  }
  return "full";
}

function sanitizeAssistantResponse(raw: string): string {
  const cleaned = raw
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^[@*#]{2,}$/.test(trimmed)) return "";
      if (/^@+\s+/.test(trimmed)) return `- ${trimmed.replace(/^@+\s+/, "")}`;
      return line;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "").trim();
}

async function callGroqAPI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let lastError = "Groq API error";

  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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
          temperature: 0.45,
          max_tokens: 768,
          top_p: 1,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as GroqResponse;
        lastError = errorData.error?.message || `Groq API error on model ${model}`;
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
    const gate = await checkRateLimit({ key: `chatbot:${ip}`, limit: 45, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ChatRequest;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Empty messages" }, { status: 400 });
    }

    if (body.messages.length > 50) {
      return NextResponse.json({ error: "Too many messages (max 50)" }, { status: 400 });
    }

    const lastMessage = body.messages[body.messages.length - 1];
    if (lastMessage.content.length > 5000) {
      return NextResponse.json({ error: "Message too long (max 5000 chars)" }, { status: 400 });
    }

    const cleanedHistory = body.messages
      .filter((msg) => (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string")
      .map((msg) => ({ role: msg.role, content: msg.content.trim() }))
      .filter((msg) => msg.content.length > 0)
      .slice(-16);

    const mode = detectMode(lastMessage.content);
    const modePrompt =
      mode === "hints"
        ? "User asked for hints only. Give only progressive hints. Do not provide full code or final full solution."
        : mode === "explain"
        ? "User asked for explanation only. Explain clearly with intuition and examples. Do not provide full code."
        : mode === "code"
        ? "User asked for code. Provide optimal working code with short explanation."
        : "Use the full structured mentor format.";

    const rawResponse = await callGroqAPI([
      { role: "system", content: `${ASSISTANT_SYSTEM_PROMPT}\n\nMode instruction: ${modePrompt}` },
      ...cleanedHistory,
    ]);

    const responseText = mode === "hints" || mode === "explain"
      ? sanitizeAssistantResponse(stripCodeBlocks(rawResponse))
      : sanitizeAssistantResponse(rawResponse);

    const last = body.messages[body.messages.length - 1];
    void (async () => {
      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({
          name: typeof session?.user?.name === "string" ? session.user.name : null,
          email: userEmail,
        });
        await Promise.race([
          admin.from("user_activity").insert({
            user_id: user.id,
            activity_type: "chatbot_search",
            source: "chatbot",
            payload: {
              query: String(last?.content || "").slice(0, 1000),
              messageCount: body.messages.length,
              responseLength: responseText.length,
            },
            created_at: new Date().toISOString(),
          }), 
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]); 
      } catch {
        // Analytics should never block chatbot responses
      }
    })();

    return NextResponse.json({
      message: responseText,
      limitReached: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chatbot error";
    console.error("Chatbot error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
