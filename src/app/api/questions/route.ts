import { NextRequest, NextResponse } from "next/server";
import { MOCK_QUESTIONS, type CodingQuestion } from "@/lib/codingQuestions";
import { supabase } from "@/lib/supabase";

function normalizeTag(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanTopics(rawTopics: string[], companyTags: string[], patternTags: string[]): string[] {
  const generic = new Set(["leetcode", "leetcodes", "problem", "problems", "question", "questions", "company", "companies"]);
  const companySet = new Set(companyTags.map((c) => normalizeTag(c)));
  const patternSet = new Set(patternTags.map((p) => normalizeTag(p)));

  return Array.from(
    new Set(
      rawTopics
        .map((t) => normalizeTag(t))
        .filter(Boolean)
        .filter((t) => !generic.has(t))
        .filter((t) => !companySet.has(t))
        .filter((t) => !patternSet.has(t))
        .filter((t) => !/^\d+/.test(t))
    )
  );
}

function toQuestion(row: Record<string, unknown>): CodingQuestion {
  const companyTags = Array.isArray(row.company_tags) ? row.company_tags.map((t) => String(t)) : [];
  const patternTags = Array.isArray(row.pattern_tags) ? row.pattern_tags.map((t) => String(t)) : [];
  const rawTopics = Array.isArray(row.topic) ? row.topic.map((t) => String(t)) : [];

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    difficulty: String(row.difficulty ?? "Easy") as CodingQuestion["difficulty"],
    function_name: row.function_name ? String(row.function_name) : undefined,
    input_type: row.input_type ? String(row.input_type) : undefined,
    output_type: row.output_type ? String(row.output_type) : undefined,
    topic: cleanTopics(rawTopics, companyTags, patternTags),
    company_tags: companyTags,
    pattern_tags: patternTags,
    acceptance_rate: Number(row.acceptance_rate ?? 0),
    description: String(row.description ?? ""),
    examples: Array.isArray(row.examples)
      ? row.examples.map((item) => ({
          input: String((item as { input?: string }).input ?? ""),
          output: String((item as { output?: string }).output ?? ""),
          explanation: (item as { explanation?: string }).explanation,
        }))
      : [],
    testcases: Array.isArray(row.testcases)
      ? row.testcases.map((tc) => ({
          input: String((tc as { input?: string }).input ?? ""),
          expectedOutput: String((tc as { expectedOutput?: string }).expectedOutput ?? ""),
        }))
      : [],
    starter_code:
      row.starter_code && typeof row.starter_code === "object"
        ? {
            cpp: String((row.starter_code as { cpp?: string }).cpp ?? ""),
            java: String((row.starter_code as { java?: string }).java ?? ""),
            python: String((row.starter_code as { python?: string }).python ?? ""),
          }
        : undefined,
  };
}

async function loadQuestions(): Promise<CodingQuestion[]> {
  const { data, error } = await supabase.from("questions").select("*").order("title", { ascending: true });

  if (error) return MOCK_QUESTIONS;
  if (!data || data.length === 0) {
    await supabase.from("questions").upsert(MOCK_QUESTIONS, { onConflict: "id" });
    return MOCK_QUESTIONS;
  }

  return data.map((row) => toQuestion(row as Record<string, unknown>));
}

async function loadOverallCount(): Promise<number | null> {
  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true });

  if (error) return null;
  return typeof count === "number" ? count : null;
}

async function loadLastSyncAt(): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_meta")
    .select("value")
    .eq("key", "questions_last_sync_at")
    .maybeSingle();

  if (error) return null;
  const value = data?.value;
  return typeof value === "string" && value.trim() ? value : null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const difficulty = (searchParams.get("difficulty") || "all").toLowerCase();
    const topic = (searchParams.get("topic") || "all").toLowerCase();
    const company = (searchParams.get("company") || "all").toLowerCase();
    const rawPage = Number(searchParams.get("page") || 1);
    const rawLimit = Number(searchParams.get("limit") || 100);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 100;
    const questions = await loadQuestions();
    const topicOptions = Array.from(
      new Set(
        questions
          .flatMap((q) => q.topic || [])
          .map((t) => t.toLowerCase())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    const companyOptions = Array.from(
      new Set(
        questions
          .flatMap((q) => q.company_tags || [])
          .map((c) => c.toLowerCase())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    const companyCountMap = new Map<string, number>();
    for (const q of questions) {
      for (const c of q.company_tags || []) {
        const key = c.toLowerCase();
        if (!key) continue;
        companyCountMap.set(key, (companyCountMap.get(key) || 0) + 1);
      }
    }
    const companyStats = Array.from(companyCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const filtered = questions.filter((q) => {
      const terms = search.split(/\s+/).filter(Boolean);
      const haystack = [q.title, ...(q.topic || []), ...((q.company_tags || []).map((c) => String(c)))]
        .join(" ")
        .toLowerCase();

      const bySearch =
        terms.length === 0 || terms.every((term) => haystack.includes(term));

      const byDifficulty = difficulty === "all" || q.difficulty.toLowerCase() === difficulty;
      const byTopic = topic === "all" || q.topic.some((t) => t.toLowerCase() === topic);
      const byCompany = company === "all" || (q.company_tags || []).some((c) => c.toLowerCase() === company);

      return bySearch && byDifficulty && byTopic && byCompany;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * limit;
    const end = start + limit;
    const paged = filtered.slice(start, end);

    const [overallCount, lastSyncAt] = await Promise.all([
      loadOverallCount(),
      loadLastSyncAt(),
    ]);

    return NextResponse.json({
      questions: paged,
      filteredCount: filtered.length,
      overallCount: overallCount ?? questions.length,
      topicOptions,
      companyOptions,
      companyStats,
      page: currentPage,
      limit,
      totalPages,
      lastSyncAt,
    });
  } catch (error) {
    console.error("Questions API error:", error);
    return NextResponse.json({
      questions: MOCK_QUESTIONS.slice(0, 100),
      filteredCount: MOCK_QUESTIONS.length,
      overallCount: MOCK_QUESTIONS.length,
      topicOptions: [],
      companyOptions: [],
      companyStats: [],
      page: 1,
      limit: 100,
      totalPages: Math.max(1, Math.ceil(MOCK_QUESTIONS.length / 100)),
      lastSyncAt: null,
      warning: "Using local fallback questions.",
    });
  }
}
