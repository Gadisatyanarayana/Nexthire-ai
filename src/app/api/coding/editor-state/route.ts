import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { EditorSessionService } from "@/platform/coding/services/EditorSessionService";

const editorService = new EditorSessionService();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email ? "11111111-1111-1111-1111-111111111111" : "00000000-0000-0000-0000-000000000000";
    const tenantId = "11111111-1111-1111-1111-111111111111";
    
    const body = await request.json();
    const { problemId, language, code, cursorPosition } = body;
    
    await editorService.saveSession(tenantId, userId, problemId, language, code, cursorPosition);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST editor-state error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
