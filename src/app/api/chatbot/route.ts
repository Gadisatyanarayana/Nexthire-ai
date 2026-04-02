import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";

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

const ASSISTANT_SYSTEM_PROMPT = `You are NextHire AI, a fast and natural chat assistant.

Behavior:
- Respond conversationally like a modern general AI assistant.
- Do not force numbered templates unless the user asks for them.
- Give direct, useful answers for coding, debugging, interviews, resumes, and career prep.
- If user asks for code, provide complete runnable code.
- If user asks for explanation, keep it clear and practical.
- Preserve conversation context across turns.

Style:
- Natural language first, not robotic script.
- Keep answers concise by default, expand when asked.
- No hardcoded section format unless explicitly requested.

Safety:
- Refuse harmful or unsafe requests.
- If the user asks for JSON, return valid JSON only.`;

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
    const gate = checkRateLimit({ key: `chatbot:${ip}`, limit: 45, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
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

    const responseText = await callGroqAPI([{ role: "system", content: ASSISTANT_SYSTEM_PROMPT }, ...cleanedHistory]);

    const last = body.messages[body.messages.length - 1];
    void (async () => {
      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({ name: session.user?.name || null, email: session.user.email });
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
