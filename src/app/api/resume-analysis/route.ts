import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import mammoth from "mammoth";
import { authOptions } from "@/lib/auth";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonBadRequest, jsonError, jsonOk, jsonRateLimited } from "../../../lib/apiResponses";

export const runtime = "nodejs";

async function logActivity(
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
      source: "resume-analyzer",
      payload,
    });
  } catch {
    // Ignore audit logging failures
  }
}

type Mode = "resume" | "job-match" | "fix-resume";

type ResumeAnalysisRequest = {
  mode: Mode;
  resumeFileName?: string;
  jobDescription?: string;
  resumeText?: string;
};

type SectionScores = {
  skills: number;
  projects: number;
  experience: number;
  education: number;
};

export interface AnalyzerFinding {
  category: string;
  statement: string;
  evidence: string[];
  confidence: number;
  status: "PRESENT" | "MISSING" | "UNKNOWN";
}

type ResumeAnalysisResponse = {
  atsScore?: number;
  label?: "Excellent" | "Good" | "Needs Improvement";
  aiSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  findings?: AnalyzerFinding[];
  includedKeywords?: string[];
  missingKeywords?: string[];
  sectionScores?: SectionScores;
  matchPercentage?: number;
  matchedKeywords?: string[];
  jobMissingKeywords?: string[];
  jobSuggestions?: string[];
  matchSummary?: string;
  improvedBullets?: string[];
  error?: string;
};

const KEYWORD_BANK = [
  "react",
  "node.js",
  "typescript",
  "javascript",
  "next.js",
  "tailwind",
  "api",
  "rest",
  "graphql",
  "git",
  "sql",
  "postgresql",
  "mongodb",
  "testing",
  "jest",
  "cypress",
  "docker",
  "aws",
  "ci/cd",
  "problem solving",
  "communication",
  "leadership",
  "collaboration",
  "agile",
];

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeScore(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function normalizeStringArray(raw: unknown, max = 8): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
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

function getLabel(score: number): "Excellent" | "Good" | "Needs Improvement" {
  if (score > 75) return "Excellent";
  if (score >= 50) return "Good";
  return "Needs Improvement";
}

function keywordHits(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword));
}

async function parsePdfText(buffer: Buffer): Promise<string> {
  try {
    const pdfParseLib = (await import("pdf-parse")) as unknown;
    const parser = ((pdfParseLib as { default?: unknown }).default ?? pdfParseLib) as (bytes: Buffer) => Promise<{ text?: string }>;
    if (typeof parser !== "function") return "";
    const parsed = await parser(buffer);
    return cleanText(parsed?.text ?? "");
  } catch (error) {
    console.error("Resume PDF parse failed:", error);
    return "";
  }
}

class UploadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function extractResumeText(file: File | null): Promise<string> {
  if (!file) return "";

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("File is too large. Maximum allowed size is 5 MB.", 413);
  }

  const mimeType = file.type.toLowerCase();
  const lowerName = file.name.toLowerCase();

  let expectedType = "";
  if (lowerName.endsWith(".pdf") && (mimeType === "application/pdf" || mimeType === "")) {
    expectedType = "pdf";
  } else if (lowerName.endsWith(".docx") && (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimeType === "")) {
    expectedType = "docx";
  } else if ((lowerName.endsWith(".txt") || lowerName.endsWith(".doc")) && (mimeType === "text/plain" || mimeType === "")) {
    expectedType = "txt";
  } else {
    throw new UploadError("Unsupported or invalid file type.", 415);
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (expectedType === "pdf") {
      if (buffer.length < 5 || buffer.toString("utf8", 0, 5) !== "%PDF-") {
        throw new UploadError("Unsupported or invalid file type.", 415);
      }
      return await parsePdfText(buffer);
    }

    if (expectedType === "docx") {
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B || buffer[2] !== 0x03 || buffer[3] !== 0x04) {
        throw new UploadError("Unsupported or invalid file type.", 415);
      }
      const parsed = await mammoth.extractRawText({ buffer });
      return cleanText(parsed.value ?? "");
    }

    if (expectedType === "txt") {
      return cleanText(buffer.toString("utf-8"));
    }

    return "";
  } catch (error) {
    if (error instanceof UploadError) throw error;
    console.error("Resume extraction failed:", error);
    throw new UploadError("Unable to process this document.", 400);
  }
}

async function parseRequest(req: NextRequest): Promise<ResumeAnalysisRequest> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const mode = String(formData.get("mode") ?? "") as Mode;
    const jobDescription = String(formData.get("jobDescription") ?? "");
    const fileEntry = formData.get("resumeFile");
    const file = fileEntry instanceof File ? fileEntry : null;
    const resumeText = await extractResumeText(file);

    return {
      mode,
      jobDescription,
      resumeFileName: file?.name,
      resumeText,
    };
  }

  return (await req.json()) as ResumeAnalysisRequest;
}

function heuristicSectionScores(resumeText: string): SectionScores {
  const text = resumeText.toLowerCase();
  const skills = /skills?/.test(text) ? 78 : 42;
  const projects = /projects?|portfolio/.test(text) ? 74 : 40;
  const experience = /experience|internship|work/.test(text) ? 72 : 38;
  const education = /education|college|university|degree|bachelor/.test(text) ? 80 : 48;
  return { skills, projects, experience, education };
}

function heuristicResumeAnalysis(resumeText: string): ResumeAnalysisResponse {
  const text = resumeText.toLowerCase();
  const included = keywordHits(text, KEYWORD_BANK);
  const core = ["react", "node.js", "typescript", "api", "git", "sql", "testing"];
  const missingCore = core.filter((keyword) => !included.includes(keyword));

  const hasMetrics = /\d+%|\d+\+|increased|reduced|improved|optimized/.test(text);
  const hasSummary = /summary|objective|profile/.test(text);
  const hasProjects = /projects?|portfolio/.test(text);

  const sections = heuristicSectionScores(text);
  const averageSection = Math.round((sections.skills + sections.projects + sections.experience + sections.education) / 4);
  const atsScore = sanitizeScore(averageSection + Math.min(included.length * 2, 16) + (hasMetrics ? 8 : 0));

  const strengths: string[] = [];
  if (hasProjects) strengths.push("Projects section demonstrates practical implementation experience.");
  if (sections.education >= 75) strengths.push("Education details are structured and ATS-readable.");
  if (included.length >= 5) strengths.push("Good baseline technical keyword coverage.");
  if (hasMetrics) strengths.push("Contains measurable achievements that improve credibility.");

  const weaknesses: string[] = [];
  if (!hasSummary) weaknesses.push("Missing professional summary at the top.");
  if (!hasMetrics) weaknesses.push("Few quantified achievements in experience bullets.");
  if (missingCore.length > 0) weaknesses.push("Important role keywords are not fully covered.");
  if (sections.experience < 55) weaknesses.push("Experience section lacks depth or business impact context.");

  const suggestions: string[] = [
    "Add action-driven bullets using words like built, improved, and delivered.",
    "Include quantified outcomes such as percentages, users, or time saved.",
    "Tailor technical keywords to the target job description before applying.",
    "Move your strongest and most relevant project near the top.",
  ];

  const aiSummary =
    atsScore > 75
      ? "Strong technical profile with good ATS readiness. Focus on role-specific keyword tuning."
      : atsScore >= 50
      ? "Solid foundation, but resume impact can improve with metrics and clearer role alignment."
      : "Resume requires structural and keyword improvements to improve shortlist chances.";

  return {
    atsScore,
    label: getLabel(atsScore),
    aiSummary,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    suggestions: suggestions.slice(0, 6),
    includedKeywords: included.slice(0, 10),
    missingKeywords: missingCore.slice(0, 10),
    sectionScores: sections,
  };
}

function heuristicJobMatch(resumeText: string, jobDescription: string): ResumeAnalysisResponse {
  const resume = resumeText.toLowerCase();
  const jd = jobDescription.toLowerCase();

  const jdKeywords = keywordHits(jd, KEYWORD_BANK);
  const evaluated = jdKeywords.length > 0 ? jdKeywords : ["communication", "problem solving", "collaboration"];

  const matchedKeywords = evaluated.filter((keyword) => resume.includes(keyword));
  const jobMissingKeywords = evaluated.filter((keyword) => !resume.includes(keyword));
  const matchPercentage = sanitizeScore(Math.round((matchedKeywords.length / evaluated.length) * 100));

  const jobSuggestions = [
    "Mirror top 3 required skills from the JD in your resume skills and project bullets.",
    "Align project descriptions with the responsibilities listed in the role.",
    "Add one impact metric in each relevant experience bullet.",
  ];

  const matchSummary =
    matchPercentage > 75
      ? "Strong alignment with this role. Minor keyword tuning can further improve fit."
      : matchPercentage >= 50
      ? "Moderate alignment. Add missing role keywords to improve match quality."
      : "Low alignment. Resume should be tailored with required technical and domain keywords.";

  return {
    matchPercentage,
    matchedKeywords: matchedKeywords.slice(0, 10),
    jobMissingKeywords: jobMissingKeywords.slice(0, 10),
    jobSuggestions: jobSuggestions.slice(0, 4),
    matchSummary,
  };
}

function heuristicFixBullets(resumeText: string): ResumeAnalysisResponse {
  const compact = resumeText.slice(0, 3000);
  const bulletLike = compact
    .split(/\s[•\-]\s|\n-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 25)
    .slice(0, 3);

  const improvedBullets =
    bulletLike.length > 0
      ? bulletLike.map((line) => `Improved: ${line.replace(/^\w/, (c) => c.toUpperCase())}. Added clearer impact and role-relevant keywords.`)
      : [
          "Improved: Developed and deployed a responsive web application using React and TypeScript, reducing page load time by 30%.",
          "Improved: Built REST API integrations to automate data flow, improving process efficiency and reducing manual effort.",
          "Improved: Collaborated in agile sprints and delivered production-ready features with test coverage and version control best practices.",
        ];

  return { improvedBullets };
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
            content:
              "You are a resume ATS and job-match analyst. Always return valid JSON only with no markdown wrappers.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.2,
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
    console.error("OpenRouter call failed:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { mode, resumeText, resumeFileName, jobDescription } = await parseRequest(req);

    // Validate that we actually extracted text
    if (!resumeText || resumeText.trim().length < 50) {
      return jsonBadRequest(
        "Could not extract sufficient text from this file. The file may be image-based, encrypted, or corrupted. Please try a standard text-based PDF or DOCX."
      );
    }

    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `resume-analysis:${ip}`, limit: 12, windowMs: 60_000 });
    if (!gate.allowed) {
      return jsonRateLimited(gate.retryAfterSeconds);
    }

    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email ? String(session.user.email).trim().toLowerCase() : null;
    const sessionName = session?.user?.name ? String(session.user.name) : null;

    if (!["resume", "job-match", "fix-resume"].includes(mode)) {
      return jsonBadRequest("Invalid mode");
    }

    const normalizedResume = cleanText(resumeText ?? "").slice(0, 9000);

    if (mode === "resume") {
      const fallback = heuristicResumeAnalysis(normalizedResume);
      const prompt = `You are an expert ATS analyzer. Analyze this resume. 
CRITICAL RULE: DO NOT hallucinate. Ground your analysis strictly in the provided resume text.
You must extract findings and state whether they are PRESENT, MISSING, or UNKNOWN based ONLY on the text. 

Return JSON with this exact shape:
{
  "aiSummary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "includedKeywords": ["string"],
  "missingKeywords": ["string"],
  "findings": [
    {
      "category": "string (e.g. Technical Skills, Leadership, Github)",
      "statement": "string",
      "evidence": ["string array containing exact excerpts from the text. Empty if missing"],
      "confidence": 0.0 to 1.0,
      "status": "PRESENT" | "MISSING" | "UNKNOWN"
    }
  ]
}

Resume file: ${resumeFileName ?? "unknown"}. 
Resume text: ${normalizedResume || "No text extracted"}`;

      const ai = await callOpenRouter(prompt);
      const responsePayload = !ai
        ? fallback
        : {
        ...fallback,
        aiSummary:
          typeof ai.aiSummary === "string" && ai.aiSummary.trim()
            ? ai.aiSummary
            : fallback.aiSummary,
        strengths:
          normalizeStringArray(ai.strengths, 6).length > 0
            ? normalizeStringArray(ai.strengths, 6)
            : fallback.strengths,
        weaknesses:
          normalizeStringArray(ai.weaknesses, 6).length > 0
            ? normalizeStringArray(ai.weaknesses, 6)
            : fallback.weaknesses,
        suggestions:
          normalizeStringArray(ai.suggestions, 8).length > 0
            ? normalizeStringArray(ai.suggestions, 8)
            : fallback.suggestions,
        findings: Array.isArray(ai.findings) ? ai.findings : [],
        includedKeywords:
          normalizeStringArray(ai.includedKeywords, 10).length > 0
            ? normalizeStringArray(ai.includedKeywords, 10)
            : fallback.includedKeywords,
        missingKeywords:
          normalizeStringArray(ai.missingKeywords, 10).length > 0
            ? normalizeStringArray(ai.missingKeywords, 10)
            : fallback.missingKeywords,
      };

      await logActivity(sessionEmail, sessionName, "resume_analysis", {
        mode,
        atsScore: responsePayload.atsScore ?? null,
        label: responsePayload.label ?? null,
        resumeFileName: resumeFileName ?? null,
      });

      return jsonOk(responsePayload);
    }

    if (mode === "fix-resume") {
      const fallback = heuristicFixBullets(normalizedResume);
      const prompt = `Rewrite up to 3 resume bullets professionally and return JSON with exact shape {"improvedBullets": string[]}. Resume text: ${normalizedResume || "No text extracted"}`;
      const ai = await callOpenRouter(prompt);
      const improvedBullets = normalizeStringArray(ai?.improvedBullets, 4);
      const responsePayload = !ai
        ? fallback
        : {
        improvedBullets: improvedBullets.length > 0 ? improvedBullets : fallback.improvedBullets,
      };

      await logActivity(sessionEmail, sessionName, "resume_fix", {
        mode,
        improvedCount: Array.isArray(responsePayload.improvedBullets) ? responsePayload.improvedBullets.length : 0,
        resumeFileName: resumeFileName ?? null,
      });

      return jsonOk(responsePayload);
    }

    if (!jobDescription || jobDescription.trim().length < 20) {
      return jsonBadRequest("Job description is required");
    }

    const fallback = heuristicJobMatch(normalizedResume, jobDescription);
    const prompt = `Compare resume and job description. Return JSON with exact shape:
{"matchSummary": string, "jobSuggestions": string[]}
Resume text: ${normalizedResume || "No text extracted"}
Job description: ${jobDescription}`;

    const ai = await callOpenRouter(prompt);
    const responsePayload = !ai
      ? fallback
      : {
      ...fallback,
      matchSummary:
        typeof ai.matchSummary === "string" && ai.matchSummary.trim()
          ? ai.matchSummary
          : fallback.matchSummary,
      jobSuggestions:
        normalizeStringArray(ai.jobSuggestions, 5).length > 0
          ? normalizeStringArray(ai.jobSuggestions, 5)
          : fallback.jobSuggestions,
    };

    await logActivity(sessionEmail, sessionName, "resume_job_match", {
      mode,
      matchPercentage: responsePayload.matchPercentage ?? null,
      resumeFileName: resumeFileName ?? null,
    });

    return jsonOk(responsePayload);
  } catch (error) {
    if (error instanceof UploadError) {
      return jsonError(error.message, error.status);
    }
    console.error("Resume analysis error:", error);
    return jsonError("Failed to analyze resume", 500);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ? String(session.user.email).trim().toLowerCase() : null;
    if (!email) {
      return jsonError("Unauthorized", 401);
    }
    const admin = getAdminClient();
    const user = await upsertUserAdmin({ name: session?.user?.name ?? null, email });
    const { data } = await admin
      .from("submissions")
      .select("code")
      .eq("user_id", user.id)
      .eq("language", "resume-workspace")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.code) {
      return jsonOk({ workspace: null });
    }
    return jsonOk({ workspace: JSON.parse(String(data.code)) });
  } catch (error) {
    return jsonError("Failed to fetch analyzer workspace", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ? String(session.user.email).trim().toLowerCase() : null;
    if (!email) {
      return jsonError("Unauthorized", 401);
    }
    const body = await req.json().catch(() => ({}));
    const snapshot = body.snapshot || body;
    if (!snapshot || typeof snapshot !== "object") {
      return jsonBadRequest("Invalid snapshot");
    }
    const admin = getAdminClient();
    const user = await upsertUserAdmin({ name: session?.user?.name ?? null, email });

    // UPSERT on user_id + language to prevent unbounded row growth.
    // Each user has exactly one analyzer workspace record.
    await admin.from("submissions").upsert(
      {
        user_id: user.id,
        language: "resume-workspace",
        code: JSON.stringify(snapshot),
        output: "Analyzer workspace synced",
        feedback: "Resume analyzer state saved",
        difficulty: "easy",
        result: "Saved",
      },
      { onConflict: "user_id,language" }
    );

    return jsonOk({ success: true });
  } catch (error) {
    return jsonError("Failed to save workspace", 500);
  }
}
