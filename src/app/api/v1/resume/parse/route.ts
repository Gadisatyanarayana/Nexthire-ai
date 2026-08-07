import { NextRequest, NextResponse } from 'next/server';
import { withAISecurity } from '../../../../../platform/ai/middleware/PlatformSecurityMiddleware';
import { ResumeApplicationService } from '../../../../../platform/ai/services/ResumeApplicationService';
import { z } from 'zod';

const RequestSchema = z.any(); // Handled as FormData

export const POST = withAISecurity(RequestSchema, async ({ req, requestId, user }: { req: NextRequest, requestId: string, user: { id: string }, body?: any }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const resumeId = formData.get('resumeId') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 422 });
    }

    if (!resumeId) {
      return NextResponse.json({ success: false, message: 'resumeId is required' }, { status: 422 });
    }

    // Convert File to Buffer for the parser
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Orchestrate logic
    const results = await ResumeApplicationService.processResumeUpload(resumeId, buffer, file.type);

    return NextResponse.json({
      success: true,
      data: results,
      requestId
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to parse resume',
      requestId
    }, { status: 500 });
  }
});
