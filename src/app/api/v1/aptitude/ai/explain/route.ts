import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { LearningService } from "@/lib/learning/services/LearningService";
const { AITutorEngine } = LearningService;

const ExplainRequestSchema = z.object({
  formulaName: z.string().min(1).max(200),
  context: z.any().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ExplainRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: (result.error as any).errors }, { status: 400 });
    }

    const explanation = await AITutorEngine.explainFormula(result.data.formulaName, result.data.context);

    return NextResponse.json({ success: true, data: explanation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
