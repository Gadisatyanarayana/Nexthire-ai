import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { generateAndStoreProblemTestCases } from "@/lib/problemTestCaseService";

type GenerateBody = {
  overwrite?: boolean;
  visibleCount?: number;
  hiddenCount?: number;
  validateWithSandbox?: boolean;
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const problemIdentifier = String(id || "").trim();
    if (!problemIdentifier) {
      return NextResponse.json({ error: "Invalid problem id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as GenerateBody;
    const result = await generateAndStoreProblemTestCases(problemIdentifier, {
      overwrite: body.overwrite !== false,
      visibleCount: Number(body.visibleCount || 3),
      hiddenCount: Number(body.hiddenCount || 20),
      validateWithSandbox: body.validateWithSandbox !== false,
    });

    return NextResponse.json({
      success: result.success,
      source: result.source,
      ai_used: result.aiUsed,
      problem_id: result.problemId,
      linked_question_id: result.questionId,
      visible_count: result.coverage.visibleCount,
      hidden_count: result.coverage.hiddenCount,
      total_count: result.coverage.totalCount,
      compliant: result.coverage.compliant,
      validation: result.validation,
      warnings: result.warnings,
      policy: {
        visible_range_required: "2-3",
        hidden_range_required: "exactly 20",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate test cases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
