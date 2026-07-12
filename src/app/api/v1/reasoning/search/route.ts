import { NextResponse } from "next/server";
import { searchReasoningLessons, searchReasoningFormulas } from "@/lib/api/reasoningV2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, lessons: [], formulas: [] });
    }

    const [lessons, formulas] = await Promise.all([
      searchReasoningLessons(query),
      searchReasoningFormulas(query)
    ]);

    return NextResponse.json({
      success: true,
      lessons,
      formulas
    });
  } catch (error: any) {
    console.error("Reasoning Search API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
