import fs from "node:fs";
import path from "node:path";

let GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^['\"]|['\"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    input: "",
    output: "scripts/data/enriched-problems.json",
    limit: 100,
    concurrency: 3,
  };

  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const next = args[i + 1];
    if (key === "--input" && next) {
      out.input = next;
      i += 1;
      continue;
    }
    if (key === "--output" && next) {
      out.output = next;
      i += 1;
      continue;
    }
    if (key === "--limit" && next) {
      out.limit = Math.max(1, Number(next) || 100);
      i += 1;
      continue;
    }
    if (key === "--concurrency" && next) {
      out.concurrency = Math.max(1, Math.min(8, Number(next) || 3));
      i += 1;
      continue;
    }
  }

  return out;
}

function normalizeDifficulty(value) {
  const x = String(value || "").toLowerCase();
  if (x === "easy") return "Easy";
  if (x === "hard") return "Hard";
  return "Medium";
}

function normalizeTag(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseExampleText(raw) {
  const text = String(raw || "").replace(/\r\n/g, "\n").trim();
  if (!text) return null;

  const inputMatch = text.match(/Input\s*:\s*([\s\S]*?)(?=\n\s*Output\s*:|$)/i);
  const outputMatch = text.match(/Output\s*:\s*([\s\S]*?)(?=\n\s*Explanation\s*:|$)/i);
  const explanationMatch = text.match(/Explanation\s*:\s*([\s\S]*?)$/i);

  const input = String(inputMatch?.[1] || "").trim();
  const output = String(outputMatch?.[1] || "").trim();
  const explanation = String(explanationMatch?.[1] || "").trim();

  if (!input || !output) return null;
  return { input, output, explanation: explanation || undefined };
}

function cleanDescription(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n\s*Example\s*\d+\s*:\s*$/gim, "")
    .replace(/\n\s*Examples?\s*:\s*$/gim, "")
    .replace(/\n\s*Constraints\s*:\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readInputQuestions(filePath, limit) {
  const text = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.questions)
    ? parsed.questions
    : [];

  return list.slice(0, limit).map((q) => {
    const parsedExamples = Array.isArray(q.examples)
      ? q.examples
          .map((ex) => parseExampleText(ex?.example_text || ex?.text || ""))
          .filter(Boolean)
      : [];

    const constraints = Array.isArray(q.constraints)
      ? q.constraints.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 20)
      : [];

    return {
      id: String(q.problem_slug || q.titleSlug || q.slug || q.id || "").trim(),
      title: String(q.title || q.name || "").trim(),
      description: cleanDescription(q.description || q.content || ""),
      difficulty: normalizeDifficulty(q.difficulty),
      topics: [
        ...(Array.isArray(q.topics) ? q.topics : []),
        ...(Array.isArray(q.topicTags) ? q.topicTags.map((t) => (typeof t === "string" ? t : t?.name)) : []),
      ]
        .map((t) => normalizeTag(t))
        .filter(Boolean)
        .slice(0, 12),
      examplesFromDataset: parsedExamples,
      constraintsFromDataset: constraints,
    };
  });
}

function fallbackEnrichment(problem) {
  const sample = Array.isArray(problem.examplesFromDataset)
    ? problem.examplesFromDataset.slice(0, 2).map((ex) => ({ input: ex.input, output: ex.output }))
    : [];

  const hiddenBase = Array.isArray(problem.examplesFromDataset)
    ? problem.examplesFromDataset.slice(2, 5).map((ex) => ({ input: ex.input, output: ex.output }))
    : [];

  const hidden = hiddenBase.length > 0
    ? hiddenBase
    : sample.map((tc) => ({ input: tc.input, output: tc.output }));

  const constraintsText = Array.isArray(problem.constraintsFromDataset)
    ? problem.constraintsFromDataset.join("\n")
    : "";

  return {
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    topics: problem.topics,
    input_format: "Refer to the problem examples and constraints.",
    output_format: "Return output exactly as required in problem examples.",
    constraints: constraintsText,
    sample_test_cases: sample,
    hidden_test_cases: hidden,
  };
}

function inferTestcaseFromDescription(description) {
  const text = String(description || "").replace(/\r\n/g, "\n");
  const inputMatch = text.match(/Input\s*:\s*([^\n]+)/i);
  const outputMatch = text.match(/Output\s*:\s*([^\n]+)/i);
  const input = String(inputMatch?.[1] || "").trim();
  const output = String(outputMatch?.[1] || "").trim();
  if (!input || !output) return null;
  return { input, expectedOutput: output, isHidden: false };
}

function buildPrompt(problem) {
  return [
    "You are a system that enhances coding problems.",
    "",
    "I will provide a coding problem with:",
    "- title",
    "- description",
    "- difficulty",
    "- topics",
    "",
    "You must add and return valid JSON with these fields:",
    "- input_format",
    "- output_format",
    "- constraints",
    "- 2 sample_test_cases",
    "- 3 hidden_test_cases",
    "",
    "Rules:",
    "1) Keep original problem semantics unchanged.",
    "2) Test cases must be realistic and executable.",
    "3) Include at least one edge case in hidden tests.",
    "4) Return JSON only. No markdown.",
    "",
    "Output shape:",
    '{"title":"","description":"","difficulty":"","topics":[],"input_format":"","output_format":"","constraints":"","sample_test_cases":[{"input":"","output":""}],"hidden_test_cases":[{"input":"","output":""}]}',
    "",
    "Problem:",
    JSON.stringify(problem),
  ].join("\n");
}

async function callGroqForEnrichment(problem) {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY for AI enrichment");
  }

  let lastError = "Groq enrichment request failed";
  let content = "";

  for (const model of GROQ_MODELS) {
    const res = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1800,
        messages: [{ role: "user", content: buildPrompt(problem) }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      lastError = `Groq error ${res.status} (${model}): ${err}`;
      continue;
    }

    const data = await res.json();
    content = String(data?.choices?.[0]?.message?.content || "").trim();
    if (content) break;
    lastError = `Empty model response from ${model}`;
  }

  if (!content) throw new Error(lastError);

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  const jsonText = firstBrace >= 0 && lastBrace >= firstBrace ? content.slice(firstBrace, lastBrace + 1) : content;

  const parsed = JSON.parse(jsonText);
  return parsed;
}

function toSupabaseRows(problem, enriched) {
  const sampleCases = Array.isArray(enriched?.sample_test_cases) ? enriched.sample_test_cases : [];
  const hiddenCases = Array.isArray(enriched?.hidden_test_cases) ? enriched.hidden_test_cases : [];

  const allCasesRaw = [...sampleCases, ...hiddenCases]
    .map((tc) => ({
      input: String(tc?.input || "").trim(),
      expectedOutput: String(tc?.output || tc?.expectedOutput || "").trim(),
      isHidden: hiddenCases.includes(tc),
    }))
    .filter((tc) => tc.input && tc.expectedOutput);

  const inferred = inferTestcaseFromDescription(enriched?.description || problem.description);
  const allCases = allCasesRaw.length > 0
    ? allCasesRaw
    : inferred
      ? [inferred]
      : [{ input: "1", expectedOutput: "1", isHidden: false }];

  const examples = sampleCases
    .map((tc) => ({
      input: String(tc?.input || "").trim(),
      output: String(tc?.output || tc?.expectedOutput || "").trim(),
    }))
    .filter((tc) => tc.input && tc.output)
    .slice(0, 3);

  const constraintsText = String(enriched?.constraints || "").trim();
  const constraintsLines = constraintsText
    .split("\n")
    .map((line) => line.replace(/^[-*\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 20);

  const formattedDescription = [
    String(enriched?.description || problem.description || "").trim(),
    constraintsLines.length > 0 ? `\n\nConstraints:\n${constraintsLines.map((c) => `- ${c}`).join("\n")}` : "",
  ]
    .join("")
    .trim();

  return {
    question: {
      id: problem.id,
      title: String(enriched?.title || problem.title || "").trim(),
      difficulty: normalizeDifficulty(enriched?.difficulty || problem.difficulty),
      function_name: "solve",
      input_type: "structured",
      output_type: "structured",
      topic: Array.from(
        new Set([...(Array.isArray(enriched?.topics) ? enriched.topics : []), ...problem.topics].map(normalizeTag))
      )
        .filter(Boolean)
        .slice(0, 12),
      acceptance_rate: 0,
      description: formattedDescription,
      examples,
      testcases: allCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
    },
    test_cases: allCases,
    input_format: String(enriched?.input_format || "").trim(),
    output_format: String(enriched?.output_format || "").trim(),
    constraints: constraintsLines,
  };
}

async function runWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const output = [];

  async function consume() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      const result = await worker(item);
      output.push(result);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => consume()));
  return output;
}

async function main() {
  loadEnvFile();
  GROQ_API_KEY = process.env.GROQ_API_KEY || "";

  const args = parseArgs();
  if (!args.input) {
    throw new Error("Usage: node scripts/enrich-problems-with-ai.mjs --input <path-to-problems.json> [--output <path>] [--limit 100]");
  }

  const inputPath = path.isAbsolute(args.input) ? args.input : path.join(process.cwd(), args.input);
  const outputPath = path.isAbsolute(args.output) ? args.output : path.join(process.cwd(), args.output);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const problems = readInputQuestions(inputPath, args.limit).filter((p) => p.id && p.title && p.description);
  if (problems.length === 0) {
    throw new Error("No valid problems found in input JSON.");
  }

  console.log(`Enriching ${problems.length} problems (${GROQ_API_KEY ? "AI + fallback" : "fallback-only"})...`);
  let done = 0;

  const enrichedRows = await runWithConcurrency(problems, args.concurrency, async (problem) => {
    try {
      const enriched = GROQ_API_KEY
        ? await callGroqForEnrichment(problem).catch(() => fallbackEnrichment(problem))
        : fallbackEnrichment(problem);
      done += 1;
      console.log(`[${done}/${problems.length}] enriched ${problem.id}`);
      return { id: problem.id, ok: true, row: toSupabaseRows(problem, enriched) };
    } catch (error) {
      done += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[${done}/${problems.length}] failed ${problem.id}: ${message}`);
      return { id: problem.id, ok: false, error: message };
    }
  });

  const successful = enrichedRows.filter((r) => r.ok).map((r) => r.row);
  const failed = enrichedRows.filter((r) => !r.ok);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: problems.length,
        success: successful.length,
        failed: failed.length,
        rows: successful,
        failures: failed,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Saved enriched output to ${outputPath}`);
  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
