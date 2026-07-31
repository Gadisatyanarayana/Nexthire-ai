import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, language, code } = body;
    
    // Simulate grading latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Placeholder submission result matching future standard contract
    return NextResponse.json({
      submissionId: crypto.randomUUID(),
      status: "QUEUED",
      message: "Execution queued."
    });
  } catch (error: any) {
    console.error("POST submit error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
