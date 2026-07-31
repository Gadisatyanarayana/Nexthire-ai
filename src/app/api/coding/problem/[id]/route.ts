import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { CodingWorkspaceService } from "@/platform/coding/services/CodingWorkspaceService";
import { enrichQuestionMetadata } from "@/lib/codingMetadataClassifier";
import { MOCK_QUESTIONS } from "@/lib/codingQuestions";

const workspaceService = new CodingWorkspaceService();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ? "11111111-1111-1111-1111-111111111111" : "00000000-0000-0000-0000-000000000000";
    const tenantId = "11111111-1111-1111-1111-111111111111"; // Mock tenant
    
    const resolvedParams = await params;
    const problemId = resolvedParams.id;
    
    const data = await workspaceService.initializeWorkspace(tenantId, userId, problemId);
    
    // Find matching question for rich metadata enrichment
    const rawQuestion = MOCK_QUESTIONS.find(q => String(q.id) === String(problemId)) || MOCK_QUESTIONS[0];
    const richMetadata = enrichQuestionMetadata(rawQuestion);

    return NextResponse.json({ ...data, richMetadata });
  } catch (error: any) {
    console.error("GET problem details error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
