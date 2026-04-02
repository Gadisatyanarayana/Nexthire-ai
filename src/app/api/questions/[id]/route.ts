import { NextRequest, NextResponse } from "next/server";
import { MOCK_QUESTIONS } from "@/lib/codingQuestions";
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

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\s*\/p\s*>/gi, "\n\n")
      .replace(/<\s*\/li\s*>/gi, "\n")
      .replace(/<\s*li\s*>/gi, "- ")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function parseExamplesFromText(text: string): Array<{ input: string; output: string; explanation?: string }> {
  const out: Array<{ input: string; output: string; explanation?: string }> = [];
  const re = /Example\s*\d+\s*:\s*([\s\S]*?)(?=Example\s*\d+\s*:|Constraints\s*:|Follow up\s*:|$)/gi;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const block = m[1] || "";
    const inputMatch = block.match(/Input\s*:\s*([^\n]+)/i);
    const outputMatch = block.match(/Output\s*:\s*([^\n]+)/i);
    const explanationMatch = block.match(/Explanation\s*:\s*([^\n]+)/i);
    if (!inputMatch || !outputMatch) continue;
    out.push({
      input: inputMatch[1].trim(),
      output: outputMatch[1].trim(),
      explanation: explanationMatch?.[1]?.trim(),
    });
  }

  return out;
}

function parseConstraintsFromText(text: string): string[] {
  const match = text.match(/Constraints\s*:\s*([\s\S]*?)(?=Follow up\s*:|$)/i);
  if (!match?.[1]) return [];
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseFollowUpFromText(text: string): string | undefined {
  const match = text.match(/Follow up\s*:\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || undefined;
}

function examplesToTestcases(
  examples: Array<{ input?: string; output?: string }> | undefined
): Array<{ input: string; expectedOutput: string }> {
  if (!Array.isArray(examples)) return [];
  return examples
    .map((example) => ({
      input: String(example?.input || "").trim(),
      expectedOutput: String(example?.output || "").trim(),
    }))
    .filter((tc) => tc.input.length > 0 && tc.expectedOutput.length > 0);
}

async function fetchLeetCodeDetail(slug: string): Promise<{
  title?: string;
  difficulty?: string;
  description?: string;
  topics?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  followUp?: string;
  testcases?: Array<{ input: string; expectedOutput: string }>;
}> {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "NextHireAI/1.0",
      Referer: "https://leetcode.com/problemset/",
    },
    body: JSON.stringify({
      query: `
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
            difficulty
            content
            exampleTestcases
            topicTags { name }
          }
        }
      `,
      variables: { titleSlug: slug },
    }),
    cache: "no-store",
  });

  if (!res.ok) return {};
  const payload = (await res.json()) as {
    data?: {
      question?: {
        title?: string;
        difficulty?: string;
        content?: string;
        exampleTestcases?: string;
        topicTags?: Array<{ name?: string }>;
      };
    };
  };

  const q = payload?.data?.question;
  if (!q) return {};

  const text = htmlToText(q.content || "");
  const examples = parseExamplesFromText(text);
  const constraints = parseConstraintsFromText(text);
  const followUp = parseFollowUpFromText(text);
  const testcases = (q.exampleTestcases || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((line) => ({ input: line, expectedOutput: "" }));

  return {
    title: q.title,
    difficulty: q.difficulty,
    description: text,
    topics: Array.isArray(q.topicTags) ? q.topicTags.map((t) => String(t?.name || "")).filter(Boolean) : [],
    examples,
    constraints,
    followUp,
    testcases,
  };
}

function isWeakDescription(value: string | undefined): boolean {
  const text = String(value || "").trim().toLowerCase();
  return !text || text.startsWith("solve ");
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();

    if (data && !error) {
      const companyTags = Array.isArray(data.company_tags) ? data.company_tags.map((v: unknown) => String(v)) : [];
      const patternTags = Array.isArray(data.pattern_tags) ? data.pattern_tags.map((v: unknown) => String(v)) : [];
      const rawTopics = Array.isArray(data.topic) ? data.topic.map((v: unknown) => String(v)) : [];
      const cleanedTopics = cleanTopics(rawTopics, companyTags, patternTags);

      const shouldHydrate =
        isWeakDescription(String(data.description || "")) ||
        !Array.isArray(data.examples) ||
        (Array.isArray(data.examples) && data.examples.length === 0);

      let enriched: Awaited<ReturnType<typeof fetchLeetCodeDetail>> = {};
      if (shouldHydrate) {
        try {
          enriched = await fetchLeetCodeDetail(id);
        } catch {
          enriched = {};
        }
      }

      const effectiveTopics =
        cleanedTopics.length > 0
          ? cleanedTopics
          : cleanTopics(enriched.topics || [], companyTags, patternTags);

      const dbTestcases = Array.isArray(data.testcases)
        ? data.testcases.map((tc: unknown) => ({
            input: String((tc as { input?: string })?.input || "").trim(),
            expectedOutput: String((tc as { expectedOutput?: string })?.expectedOutput || "").trim(),
          }))
        : [];

      const dbHasUsefulTestcases = dbTestcases.some(
        (tc: { input: string; expectedOutput: string }) =>
          tc.input.length > 0 && tc.expectedOutput.length > 0
      );

      const dataExampleCases = examplesToTestcases(
        Array.isArray(data.examples)
          ? data.examples.map((e: unknown) => ({
              input: String((e as { input?: string })?.input || ""),
              output: String((e as { output?: string })?.output || ""),
            }))
          : []
      );

      const enrichedExampleCases = examplesToTestcases(enriched.examples);
      const fallbackExampleCases =
        dataExampleCases.length > 0 ? dataExampleCases : enrichedExampleCases;

      const effectiveTestcases = dbHasUsefulTestcases
        ? dbTestcases
        : fallbackExampleCases.length > 0
          ? fallbackExampleCases
          : enriched.testcases || [];

      return NextResponse.json({
        question: {
          ...data,
          function_name: data.function_name ? String(data.function_name) : undefined,
          input_type: data.input_type ? String(data.input_type) : undefined,
          output_type: data.output_type ? String(data.output_type) : undefined,
          title: enriched.title || data.title,
          difficulty: enriched.difficulty || data.difficulty,
          company_tags: companyTags,
          pattern_tags: patternTags,
          topic: effectiveTopics,
          description: isWeakDescription(String(data.description || ""))
            ? enriched.description || data.description
            : data.description,
          examples:
            Array.isArray(data.examples) && data.examples.length > 0
              ? data.examples
              : enriched.examples || [],
          testcases: effectiveTestcases,
          constraints: enriched.constraints || [],
          followUp: enriched.followUp,
        },
      });
    }

    const fallback = MOCK_QUESTIONS.find((q) => q.id === id);
    if (!fallback) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ question: fallback, warning: "Loaded from local fallback." });
  } catch (error) {
    console.error("Question detail API error:", error);
    return NextResponse.json({ error: "Failed to load question" }, { status: 500 });
  }
}
