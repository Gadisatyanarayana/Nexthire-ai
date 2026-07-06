import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { generateAndStoreProblemTestCases, getProblemTestCaseCoverage } from "@/lib/problemTestCaseService";
import { getAdminClient, isAdminEmail } from "@/lib/supabaseAdmin";

type BulkGenerateBody = {
  limit?: number;
  offset?: number;
  batchSize?: number;
  force?: boolean;
  overwrite?: boolean;
  hiddenCount?: number;
  validateWithSandbox?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function chunkArray<T>(input: T[], size: number): T[][] {
  if (size <= 0) return [input];
  const chunks: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    chunks.push(input.slice(i, i + size));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `admin-generate-testcases:${ip}`, limit: 4, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many admin generation requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const email = String(session?.user?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminEmail(email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as BulkGenerateBody;

    const limit = clamp(Number(body.limit || 100), 1, 500);
    const offset = Math.max(0, Number(body.offset || 0));
    const batchSize = clamp(Number(body.batchSize || 5), 1, 25);
    const force = body.force === true;
    const overwrite = body.overwrite !== false;
    const hiddenCount = clamp(Number(body.hiddenCount || 20), 20, 20);
    const validateWithSandbox = body.validateWithSandbox !== false;

    const admin = getAdminClient();

    const { data: problemRows } = await admin
      .from("problems")
      .select("id")
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1);

    let targets = Array.isArray(problemRows)
      ? problemRows.map((row: { id?: unknown }) => String(row.id || "").trim()).filter(Boolean)
      : [];

    if (targets.length === 0) {
      const { data: questionRows } = await admin
        .from("questions")
        .select("id")
        .order("id", { ascending: true })
        .range(offset, offset + limit - 1);

      targets = Array.isArray(questionRows)
        ? questionRows.map((row: { id?: unknown }) => String(row.id || "").trim()).filter(Boolean)
        : [];
    }

    if (targets.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        generated: 0,
        skipped: 0,
        failed: 0,
        details: [],
        message: "No problems found for this batch window.",
      });
    }

    const details: Array<{
      target: string;
      action: "generated" | "skipped" | "failed";
      reason?: string;
      problem_id?: string;
      linked_question_id?: string | null;
      visible_count?: number;
      hidden_count?: number;
      warnings?: string[];
      validation?: {
        enabled: boolean;
        succeeded: number;
        failed: number;
        avgTimeMs: number | null;
        avgMemoryKb: number | null;
      };
    }> = [];

    let generated = 0;
    let skipped = 0;
    let failed = 0;

    for (const batch of chunkArray(targets, batchSize)) {
      const batchResults = await Promise.all(
        batch.map(async (target) => {
          try {
            const coverage = await getProblemTestCaseCoverage(target);
            const needsGeneration = force || !coverage || coverage.visibleCount < 2 || coverage.visibleCount > 3 || coverage.hiddenCount !== 20;

            if (!needsGeneration) {
              return {
                target,
                action: "skipped" as const,
                reason: "already_compliant",
                problem_id: coverage.problemId,
                linked_question_id: coverage.questionId,
                visible_count: coverage.visibleCount,
                hidden_count: coverage.hiddenCount,
              };
            }

            const result = await generateAndStoreProblemTestCases(target, {
              overwrite,
              visibleCount: 3,
              hiddenCount,
              validateWithSandbox,
            });

            return {
              target,
              action: "generated" as const,
              problem_id: result.problemId,
              linked_question_id: result.questionId,
              visible_count: result.coverage.visibleCount,
              hidden_count: result.coverage.hiddenCount,
              warnings: result.warnings,
              validation: result.validation,
            };
          } catch (error) {
            return {
              target,
              action: "failed" as const,
              reason: error instanceof Error ? error.message : "generation_failed",
            };
          }
        })
      );

      for (const item of batchResults) {
        details.push(item);
        if (item.action === "generated") generated += 1;
        if (item.action === "skipped") skipped += 1;
        if (item.action === "failed") failed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      processed: targets.length,
      generated,
      skipped,
      failed,
      config: {
        limit,
        offset,
        batchSize,
        force,
        overwrite,
        hiddenCount,
        validateWithSandbox,
      },
      details,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate test cases in bulk";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
