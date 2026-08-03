import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CodingWorkspaceService } from "@/platform/coding/services/CodingWorkspaceService";
import { enrichQuestionMetadata } from "@/lib/codingMetadataClassifier";
import { MOCK_QUESTIONS, CodingQuestion } from "@/lib/codingQuestions";
import { matchCanonicalLeetCodeProblem } from "@/platform/content-pipeline/data/OfficialLeetCodeCatalogIndex";

const workspaceService = new CodingWorkspaceService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ? "11111111-1111-1111-1111-111111111111" : "00000000-0000-0000-0000-000000000000";
    const tenantId = "11111111-1111-1111-1111-111111111111";
    
    const resolvedParams = await params;
    const problemId = resolvedParams.id;
    
    const data = await workspaceService.initializeWorkspace(tenantId, userId, problemId);
    
    let rawQuestion: (CodingQuestion & { sub_pattern?: string }) | null = null;

    // 1. Search canonical 6902 catalog first
    const matchedCanonical = matchCanonicalLeetCodeProblem(problemId);
    if (matchedCanonical) {
      rawQuestion = {
        id: matchedCanonical.id,
        title: matchedCanonical.title,
        difficulty: matchedCanonical.difficulty,
        topic: matchedCanonical.topic || [],
        company_tags: matchedCanonical.company_tags || [],
        pattern_tags: matchedCanonical.pattern_tags || [],
        sub_pattern: matchedCanonical.sub_pattern,
        acceptance_rate: matchedCanonical.acceptance_rate || 50,
        description: matchedCanonical.description,
        examples: matchedCanonical.examples || [],
        testcases: (matchedCanonical.testcases || []).map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        })),
        starter_code: matchedCanonical.starter_code
      };
    }

    // 2. Fall back to mock questions or workspace database problem
    if (!rawQuestion) {
      const mockFound = MOCK_QUESTIONS.find(q => String(q.id) === String(problemId));
      if (mockFound) {
        rawQuestion = mockFound;
      }
    }

    if (!rawQuestion && data.problem) {
      rawQuestion = {
        id: String(data.problem.id),
        title: data.problem.title || "Coding Problem",
        difficulty: data.problem.difficulty || "Medium",
        topic: data.problem.topic || ["Arrays"],
        company_tags: data.problem.company_tags || ["Amazon", "Google"],
        pattern_tags: data.problem.pattern_tags || ["Two Pointers"],
        acceptance_rate: data.problem.acceptance_rate || 50,
        description: data.problem.description || "",
        examples: data.problem.examples || [],
        testcases: data.problem.testcases || [],
        starter_code: data.problem.codingDetails?.starter_code || {}
      };
    }

    if (!rawQuestion) {
      rawQuestion = MOCK_QUESTIONS[0];
    }

    const richMetadata = enrichQuestionMetadata(rawQuestion);
    const cleanDescription = rawQuestion.description || `### ${richMetadata.title}\n\nGiven input parameters for **${richMetadata.subtopic}**, implement an optimal solution using **${richMetadata.primaryPattern}**.\n\n### Constraints\n- \`1 <= input.length <= 10^5\``;
    const visibleCases = (rawQuestion.examples || richMetadata.sampleTestCases || []).slice(0, 3).map((e: any) => ({
      input: e.input || "",
      expectedOutput: e.output || e.expectedOutput || "",
      isHidden: false
    }));

    return NextResponse.json({
      success: true,
      ...data,
      problem: {
        ...(data.problem || {}),
        id: richMetadata.id,
        title: richMetadata.title,
        difficulty: richMetadata.difficulty,
        description: cleanDescription,
        examples: rawQuestion.examples || richMetadata.sampleTestCases,
        testcases: visibleCases,
        codingDetails: {
          starter_code: rawQuestion.starter_code || richMetadata.starterCode
        }
      },
      richMetadata: {
        ...richMetadata,
        solutions: [],
        editorial: undefined
      }
    });
  } catch (error: any) {
    console.error("GET problem details error:", error);
    const errorMsg = typeof error === "object" ? error?.message || JSON.stringify(error) : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
