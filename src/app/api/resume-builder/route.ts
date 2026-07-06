import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mammoth from "mammoth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

async function logBuilderActivity(
  sessionEmail: string | null,
  sessionName: string | null,
  activityType: string,
  payload: Record<string, unknown>
) {
  if (!sessionEmail) return;
  try {
    const user = await upsertUserAdmin({
      name: sessionName,
      email: sessionEmail,
    });
    await getAdminClient().from("user_activity").insert({
      user_id: user.id,
      activity_type: activityType,
      source: "resume-builder",
      payload,
    });
  } catch {
    // Ignore logging failures
  }
}

type BuilderMode = "improve" | "autofill" | "fill-missing";

type AutofillPayload = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  degree: string;
  college: string;
  graduationYear: string;
  summary: string;
  technicalSkills: string;
  projectDescription: string;
  internshipAchievements: string;
  missingFields: string[];
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractJsonBlock(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

async function parsePdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParseLib = (await import("pdf-parse")) as unknown;
    const parser = ((pdfParseLib as { default?: unknown }).default ?? pdfParseLib) as (bytes: Buffer) => Promise<{ text?: string }>;
    if (typeof parser !== "function") return "";
    const parsed = await parser(buffer);
    return cleanText(parsed?.text ?? "");
  } catch (error) {
    console.error("PDF parse failed:", error);
    return "";
  }
}

async function extractResumeText(file: File | null): Promise<string> {
  if (!file) return "";

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".pdf")) {
      return await parsePdfText(buffer);
    }

    if (lowerName.endsWith(".docx")) {
      const parsed = await mammoth.extractRawText({ buffer });
      return cleanText(parsed.value ?? "");
    }

    if (lowerName.endsWith(".doc") || lowerName.endsWith(".txt")) {
      return cleanText(buffer.toString("utf-8"));
    }

    return "";
  } catch (error) {
    console.error("Builder extraction failed:", error);
    return "";
  }
}

async function extractImageTextWithOpenRouter(file: File | null): Promise<string> {
  if (!file) return "";
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "";
  if (!file.type.startsWith("image/")) return "";

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    const response = await fetch("https://openrouter.io/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen2.5-vl-72b-instruct:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Read this resume image and extract all visible text exactly. Return plain text only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1200,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);
    if (!response.ok) return "";

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return cleanText(data.choices?.[0]?.message?.content ?? "");
  } catch (error) {
    console.error("Image extraction failed:", error);
    return "";
  }
}

function extractStructuredFieldsFromText(text: string): AutofillPayload {
  const source = cleanText(text);
  const emailMatch = source.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  const phoneMatch = source.match(/(?:\+?\d[\d\s\-()]{8,}\d)/);
  const linkedinMatch = source.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s,;]+/i);
  const githubMatch = source.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s,;]+/i);
  const portfolioMatch = source.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[\w\-./?%&=]*)?/);

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let fullName = "";
  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 60) continue;
    if (/@|linkedin|github|http|www|\d{3,}/i.test(line)) continue;
    fullName = line;
    break;
  }

  const educationLine = lines.find((line) => /(b\.?tech|bachelor|master|m\.?tech|b\.?e\.?|university|college|institute)/i.test(line)) || "";
  const degreeMatch = educationLine.match(/(b\.?tech|bachelor[^,;]*|m\.?tech|master[^,;]*|b\.?e\.?[^,;]*)/i);
  const gradYearMatch = source.match(/(20\d{2}|19\d{2})/);

  const skillsLine = lines.find((line) => /skills?/i.test(line)) || "";
  const projectLine = lines.find((line) => /project/i.test(line)) || "";
  const expLine = lines.find((line) => /(experience|internship|worked at)/i.test(line)) || "";

  const draft: AutofillPayload = {
    fullName,
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0] ?? "",
    location: "",
    linkedin: linkedinMatch?.[0] ?? "",
    github: githubMatch?.[0] ?? "",
    portfolio: portfolioMatch?.[0] && !emailMatch?.[0]?.includes(portfolioMatch[0]) ? portfolioMatch[0] : "",
    degree: degreeMatch?.[0] ?? "",
    college: educationLine,
    graduationYear: gradYearMatch?.[0] ?? "",
    summary: source.slice(0, 280),
    technicalSkills: skillsLine || "",
    projectDescription: projectLine || "",
    internshipAchievements: expLine || "",
    missingFields: [],
  };

  const required: Array<keyof Omit<AutofillPayload, "missingFields">> = [
    "fullName",
    "email",
    "phone",
    "degree",
    "college",
    "summary",
    "technicalSkills",
  ];
  draft.missingFields = required.filter((field) => !String(draft[field] || "").trim());

  return draft;
}

async function callOpenRouter(prompt: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://openrouter.io/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a resume writing assistant. Return JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 900,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return extractJsonBlock(content);
  } catch (error) {
    console.error("Builder AI call failed:", error);
    return null;
  }
}

function fallbackImprove(text: string, section: string): string {
  const trimmed = cleanText(text);
  if (!trimmed) return "Add concise, impact-focused content for this section.";

  if (section === "skills") {
    return `Core Skills: ${trimmed}. Highlight proficiency level and tools used in real projects.`;
  }

  if (section === "experience" || section === "projects") {
    return `Developed and delivered ${trimmed}, improving measurable outcomes and aligning with role requirements.`;
  }

  return `${trimmed}. Refined for clarity, professionalism, and ATS readability.`;
}

function fallbackAutofill(text: string): AutofillPayload {
  const guessed = extractStructuredFieldsFromText(text);
  return {
    ...guessed,
    summary: guessed.summary || "Aspiring software engineer focused on scalable web applications and measurable project outcomes.",
    technicalSkills: guessed.technicalSkills || "JavaScript, TypeScript, React, Node.js, SQL, Git",
    projectDescription: guessed.projectDescription || "Built production-ready projects with clear outcomes and performance impact.",
    internshipAchievements: guessed.internshipAchievements || "Collaborated on feature delivery and improved development efficiency.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `resume-builder:${ip}`, limit: 12, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email ? String(session.user.email).trim().toLowerCase() : null;
    const sessionName = session?.user?.name ? String(session.user.name) : null;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const mode = String(formData.get("mode") ?? "") as BuilderMode;

      if (mode === "autofill") {
        const fileEntry = formData.get("resumeFile");
        const file = fileEntry instanceof File ? fileEntry : null;
        const resumeText = await extractResumeText(file);
        const imageText = resumeText ? "" : await extractImageTextWithOpenRouter(file);
        const sourceText = resumeText || imageText;
        const fallback = fallbackAutofill(sourceText);

        const ai = await callOpenRouter(
          `Extract resume details and return strict JSON with shape {` +
            `"fullName": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string, "portfolio": string, ` +
            `"degree": string, "college": string, "graduationYear": string, "summary": string, "technicalSkills": string, "projectDescription": string, "internshipAchievements": string` +
            `}. Resume text: ${sourceText || "No text extracted"}`
        );

        const responsePayload = !ai
          ? fallback
          : {
              fullName: typeof ai.fullName === "string" && ai.fullName.trim() ? ai.fullName : fallback.fullName,
              email: typeof ai.email === "string" && ai.email.trim() ? ai.email : fallback.email,
              phone: typeof ai.phone === "string" && ai.phone.trim() ? ai.phone : fallback.phone,
              location: typeof ai.location === "string" && ai.location.trim() ? ai.location : fallback.location,
              linkedin: typeof ai.linkedin === "string" && ai.linkedin.trim() ? ai.linkedin : fallback.linkedin,
              github: typeof ai.github === "string" && ai.github.trim() ? ai.github : fallback.github,
              portfolio: typeof ai.portfolio === "string" && ai.portfolio.trim() ? ai.portfolio : fallback.portfolio,
              degree: typeof ai.degree === "string" && ai.degree.trim() ? ai.degree : fallback.degree,
              college: typeof ai.college === "string" && ai.college.trim() ? ai.college : fallback.college,
              graduationYear: typeof ai.graduationYear === "string" && ai.graduationYear.trim() ? ai.graduationYear : fallback.graduationYear,
              summary: typeof ai.summary === "string" && ai.summary.trim() ? ai.summary : fallback.summary,
              technicalSkills: typeof ai.technicalSkills === "string" && ai.technicalSkills.trim() ? ai.technicalSkills : fallback.technicalSkills,
              projectDescription: typeof ai.projectDescription === "string" && ai.projectDescription.trim() ? ai.projectDescription : fallback.projectDescription,
              internshipAchievements:
                typeof ai.internshipAchievements === "string" && ai.internshipAchievements.trim()
                  ? ai.internshipAchievements
                  : fallback.internshipAchievements,
              missingFields: [],
            };

        const extractionSource = resumeText ? "document" : imageText ? "image" : "none";
        const extractedChars = sourceText.length;
        const qualityHint =
          extractedChars < 60
            ? "Low text detected. Use a clearer image or upload PDF/DOCX for better autofill accuracy."
            : "";

        const requiredFields: Array<keyof Omit<AutofillPayload, "missingFields">> = [
          "fullName",
          "email",
          "phone",
          "degree",
          "college",
          "summary",
          "technicalSkills",
        ];
        responsePayload.missingFields = requiredFields.filter((field) => !String(responsePayload[field] || "").trim());

        await logBuilderActivity(sessionEmail, sessionName, "resume_builder_autofill", {
          mode,
          hasFile: Boolean(file),
          fileType: file?.type || "unknown",
          extractionSource,
          extractedChars,
          missingFields: responsePayload.missingFields,
        });

        return NextResponse.json({
          ...responsePayload,
          extractionSource,
          extractedChars,
          qualityHint,
        });
      }
    }

    const payload = (await req.json()) as {
      mode: BuilderMode;
      section?: string;
      text?: string;
      missingFields?: string[];
      formData?: Record<string, string>;
    };

    if (payload.mode === "fill-missing") {
      const missingFields = Array.isArray(payload.missingFields)
        ? payload.missingFields.map((x) => String(x || "").trim()).filter(Boolean)
        : [];
      const formData = payload.formData || {};

      if (missingFields.length === 0) {
        return NextResponse.json({ generated: {}, missingFields: [] });
      }

      const context = JSON.stringify(formData || {});
      const ai = await callOpenRouter(
        `Generate concise professional values for only these missing resume fields: ${missingFields.join(", ")}. ` +
          `Return strict JSON object where keys are field names and values are strings. ` +
          `Use this existing form data as context: ${context}`
      );

      const generated: Record<string, string> = {};
      for (const field of missingFields) {
        const v = ai && typeof ai[field] === "string" ? String(ai[field]).trim() : "";
        if (v) generated[field] = v;
      }

      await logBuilderActivity(sessionEmail, sessionName, "resume_builder_fill_missing", {
        mode: payload.mode,
        requestedFields: missingFields,
        generatedCount: Object.keys(generated).length,
      });

      return NextResponse.json({
        generated,
        missingFields: missingFields.filter((f) => !generated[f]),
      });
    }

    if (payload.mode !== "improve") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const section = payload.section ?? "general";
    const text = payload.text ?? "";

    const fallback = fallbackImprove(text, section);
    const ai = await callOpenRouter(`Rewrite this resume section in a professional ATS-friendly style. Return JSON with shape {"improvedText": string}. Section: ${section}. Content: ${text}`);

    const responsePayload = {
      improvedText:
        typeof ai?.improvedText === "string" && ai.improvedText.trim()
          ? ai.improvedText
          : fallback,
    };

    await logBuilderActivity(sessionEmail, sessionName, "resume_builder_improve", {
      mode: payload.mode,
      section,
      inputLength: text.length,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Resume builder API error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
