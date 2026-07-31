import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, language, code, customInput } = body;
    
    // Simulate execution latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Placeholder execution result matching future standard contract
    return NextResponse.json({
      submissionId: crypto.randomUUID(),
      status: "QUEUED",
      message: "Execution queued."
    });
  } catch (error: any) {
    console.error("POST run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
