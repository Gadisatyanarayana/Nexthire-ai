import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getMasterSystemPrompt } from "@/lib/aiMasterPrompt";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const DAILY_SPECIALS = [
  "Mindful Monday: learn one new concept and explain it in your own words.",
  "Tactical Tuesday: solve one medium coding problem and review edge cases.",
  "Wellness Wednesday: 20 minutes of deep work plus a short breathing break.",
  "Theory Thursday: revise one interview topic and create a quick summary note.",
  "Feedback Friday: do one mock answer and improve it using self-review.",
  "Sprint Saturday: complete a timed practice set with focus on speed and clarity.",
  "Strategy Sunday: plan your week and pick one high-impact skill goal.",
];

const LIVE_ASSISTANT_SYSTEM_PROMPT = `${getMasterSystemPrompt("interviewer")}

You are NextHire Live Voice Assistant.

Behavior:
- Be natural, clear, and conversational.
- Answer any topic the user asks (general questions, coding, interview prep, resume, communication, study planning).
- Keep answers concise for spoken delivery unless user asks for depth.
- Default answer length: 2-6 sentences.
- If uncertain, say so honestly and offer the best next step.
- Do not output markdown tables.
- Do not mention internal policies or system messages.
`;

type LiveMessage = {
  role: "user" | "assistant";
  content: string;
};

type LiveAssistantRequest = {
  messages?: LiveMessage[];
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function getTodayContext() {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const special = DAILY_SPECIALS[now.getDay()] || DAILY_SPECIALS[0];
  return { weekday, dateLabel, special };
}

function isTodaySpecialQuestion(text: string): boolean {
  const normalized = String(text || "").toLowerCase();
  return /\b(today|today's|todays)\b.*\b(special|speial)\b|\b(special|speial)\b.*\b(today|today's|todays)\b/.test(normalized);
}

function isDateQuestion(text: string): boolean {
  const normalized = String(text || "").toLowerCase();
  return /\b(what\s+is\s+today|today\s+date|which\s+day\s+is\s+today|what\s+day\s+is\s+today)\b/.test(normalized);
}

function buildTodaySpecialReply() {
  const context = getTodayContext();
  return `Today is ${context.weekday}, ${context.dateLabel}. Today's special is: ${context.special}`;
}

function buildDateReply() {
  const context = getTodayContext();
  return `Today is ${context.weekday}, ${context.dateLabel}.`;
}

function buildFallbackReply(userText: string): string {
  if (isTodaySpecialQuestion(userText)) return buildTodaySpecialReply();
  if (isDateQuestion(userText)) return buildDateReply();

  return "I can help with that. Ask me directly and I will answer in a clear, spoken style.";
}

function sanitizeHistory(messages: LiveMessage[]): LiveMessage[] {
  return messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 5000),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-24);
}

async function callGroqAPI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let lastError = "Live assistant is unavailable";

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
          temperature: 0.5,
          max_tokens: 500,
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
    const gate = await checkRateLimit({ key: `live-assistant:${ip}`, limit: 45, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as LiveAssistantRequest;
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Messages are required." }, { status: 400 });
    }
    if (body.messages.length > 60) {
      return NextResponse.json({ error: "Too many messages in one request." }, { status: 400 });
    }

    const history = sanitizeHistory(body.messages);
    if (history.length === 0) {
      return NextResponse.json({ error: "No valid messages provided." }, { status: 400 });
    }

    const latestUser = [...history].reverse().find((entry) => entry.role === "user");
    const latestUserText = String(latestUser?.content || "").trim();

    if (isTodaySpecialQuestion(latestUserText)) {
      return NextResponse.json({ message: buildTodaySpecialReply() });
    }

    if (isDateQuestion(latestUserText)) {
      return NextResponse.json({ message: buildDateReply() });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ message: buildFallbackReply(latestUserText) });
    }

    try {
      const today = getTodayContext();
      const responseText = await callGroqAPI([
        {
          role: "system",
          content: `${LIVE_ASSISTANT_SYSTEM_PROMPT}\nCurrent context:\n- Day: ${today.weekday}\n- Date: ${today.dateLabel}\n- Today's special: ${today.special}\nIf user asks about today's special, answer with this exact special unless user specifies a different domain.`,
        },
        ...history,
      ]);

      const cleanResponse = responseText.replace(/\n{3,}/g, "\n\n").trim();
      if (!cleanResponse) {
        return NextResponse.json({ message: buildFallbackReply(latestUserText) });
      }

      return NextResponse.json({ message: cleanResponse });
    } catch {
      return NextResponse.json({ message: buildFallbackReply(latestUserText) });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Live assistant error";
    console.error("Live assistant error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
