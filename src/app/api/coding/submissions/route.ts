import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");

    // Placeholder history
    return NextResponse.json({
      success: true,
      submissions: [
        {
          id: "sub-1",
          status: "Accepted",
          language: "python",
          score: 100,
          submittedAt: new Date().toISOString()
        }
      ]
    });
  } catch (error: any) {
    console.error("GET submissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
