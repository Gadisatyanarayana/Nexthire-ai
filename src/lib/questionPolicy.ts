export type DifficultyLabel = "easy" | "medium" | "hard" | "Easy" | "Medium" | "Hard";

export type CasePair = {
  input: string;
  expectedOutput: string;
};

export function normalizeDifficultyLabel(value: DifficultyLabel | string | undefined): "easy" | "medium" | "hard" {
  const normalized = String(value || "easy").trim().toLowerCase();
  if (normalized === "medium") return "medium";
  if (normalized === "hard") return "hard";
  return "easy";
}

export function getDefaultHiddenCaseCount(_: DifficultyLabel | string | undefined): number {
  return 20;
}

export function getDefaultTimeLimitMinutes(difficulty: DifficultyLabel | string | undefined): number {
  const normalized = normalizeDifficultyLabel(difficulty);
  if (normalized === "medium") return 30;
  if (normalized === "hard") return 45;
  return 20;
}

export function buildMandatoryCaseSet(cases: CasePair[], targetCount: number): CasePair[] {
  const normalized = cases
    .map((item) => ({ input: String(item.input || "").trim(), expectedOutput: String(item.expectedOutput || "").trim() }))
    .filter((item) => item.input.length > 0 && item.expectedOutput.length > 0);

  if (normalized.length === 0 || targetCount <= 0) return normalized.slice(0, Math.max(0, targetCount));

  const output = [...normalized];
  let index = 0;

  while (output.length < targetCount) {
    const source = normalized[index % normalized.length];
    output.push({ input: source.input, expectedOutput: source.expectedOutput });
    index += 1;
  }

  return output.slice(0, targetCount);
}
