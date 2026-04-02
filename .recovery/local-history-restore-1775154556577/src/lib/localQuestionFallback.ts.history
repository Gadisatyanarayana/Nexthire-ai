import "server-only";

import { readFile } from "fs/promises";
import path from "path";

import type { CodingQuestion } from "@/lib/codingQuestions";
import { STARTER_CODE } from "@/lib/codingQuestions";
import { inferDsaSection } from "@/lib/dsaSections";

type EnrichedProblemsFile = {
  rows?: EnrichedRow[];
};

type EnrichedQuestion = Partial<CodingQuestion> & {
  id?: string;
  title?: string;
  difficulty?: string;
  topic?: string[];
  description?: string;
  examples?: Array<{ input?: string; output?: string; explanation?: string }>;
  testcases?: Array<{ input?: string; expectedOutput?: string }>;
  function_name?: string;
  input_type?: string;
  output_type?: string;
  acceptance_rate?: number;
  company_tags?: string[];
  pattern_tags?: string[];
  starter_code?: Partial<Record<"cpp" | "java" | "python", string>>;
};

type EnrichedRow = {
  question?: EnrichedQuestion;
};

let fallbackCache: { loadedAt: number; value: CodingQuestion[] } | null = null;

function normalizeDifficulty(value: string | undefined): "Easy" | "Medium" | "Hard" {
  const x = String(value || "easy").toLowerCase();
  if (x === "hard") return "Hard";
  if (x === "medium") return "Medium";
  return "Easy";
}

function normalizeTopics(topic: unknown): string[] {
  if (!Array.isArray(topic)) return [];
  return Array.from(
    new Set(
      topic
        .map((t) => String(t || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function toQuestion(raw: EnrichedQuestion | undefined): CodingQuestion | null {
  if (!raw) return null;

  const id = String(raw.id || "").trim();
  const title = String(raw.title || "").trim();
  if (!id || title.length < 3) return null;

  const topic = normalizeTopics(raw.topic);
  const description = String(raw.description || "").trim() || `Solve ${title}.`;

  const examples = Array.isArray(raw.examples)
    ? raw.examples
        .map((item) => ({
        
          input: String(item?.input || "").trim(),
          output: String(item?.output || "").trim(),
          explanation: item?.explanation ? String(item.explanation) : undefined,
        }))
          .filter((item: { input: string; output: string; explanation?: string }) => item.input && item.output)
    : [];

  const testcases = Array.isArray(raw.testcases)
    ? raw.testcases
          .map((tc: { input?: string; expectedOutput?: string }) => ({
          input: String(tc?.input || "").trim(),
          expectedOutput: String(tc?.expectedOutput || "").trim(),
        }))
          .filter((tc: { input: string; expectedOutput: string }) => tc.input.length > 0)
    : [];

  return {
    id,
    title,
    difficulty: normalizeDifficulty(raw.difficulty),
    section: inferDsaSection(topic, title),
    function_name: String(raw.function_name || "solve"),
    input_type: String(raw.input_type || "auto"),
    output_type: String(raw.output_type || "auto"),
    topic,
    company_tags: Array.isArray(raw.company_tags) ? raw.company_tags.map((x: string) => String(x)) : [],
    pattern_tags: Array.isArray(raw.pattern_tags) ? raw.pattern_tags.map((x: string) => String(x)) : [],
    acceptance_rate: Number(raw.acceptance_rate || 0),
    description,
    examples,
    testcases,
    starter_code: {
      cpp: String(raw.starter_code?.cpp || STARTER_CODE.cpp),
      java: String(raw.starter_code?.java || STARTER_CODE.java),
      python: String(raw.starter_code?.python || STARTER_CODE.python),
    },
  };
}

export async function loadLocalFallbackQuestions(): Promise<CodingQuestion[]> {
  if (fallbackCache?.value?.length) {
    return fallbackCache.value;
  }

  const filePath = path.join(process.cwd(), "scripts", "data", "enriched-problems.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as EnrichedProblemsFile;

  const rows: EnrichedRow[] = Array.isArray(parsed.rows) ? parsed.rows : [];
  const mapped = rows
    .map((row) => toQuestion(row?.question))
    .filter((q): q is CodingQuestion => Boolean(q));

  fallbackCache = {
    loadedAt: Date.now(),
    value: mapped,
  };

  return mapped;
}

export async function findLocalFallbackQuestionById(id: string): Promise<CodingQuestion | null> {
  const all = await loadLocalFallbackQuestions();
  return all.find((q) => q.id === id) || null;
}
