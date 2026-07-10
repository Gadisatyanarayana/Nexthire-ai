import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HintEngine } from "@/lib/aptitude/HintEngine";
import { z } from "zod";

const HintRequestSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()),
  correctOption: z.string(),
  topic: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = HintRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: "Invalid payload", details: (result.error as any).errors }, { status: 400 });
    }

    const hints = await HintEngine.generateHints(
      result.data.question,
      result.data.options,
      result.data.correctOption,
      result.data.topic
    );

    return NextResponse.json({ success: true, data: hints });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
