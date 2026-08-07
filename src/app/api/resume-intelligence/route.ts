import { z } from 'zod';
import { withAISecurity as withPlatformSecurity } from '../../../platform/ai/middleware/PlatformSecurityMiddleware';
import { ResumeApplicationService } from '../../../platform/ai/services/ResumeApplicationService';
import { NextResponse } from 'next/server';

const RequestSchema = z.object({
  resumeId: z.string().uuid(),
  resumeContent: z.string().min(10),
  forceRefresh: z.boolean().optional().default(false)
});

export const POST = withPlatformSecurity(RequestSchema, async ({ body, requestId }) => {
  const { resumeId, resumeContent, forceRefresh } = body;
  
  const intelligence = await ResumeApplicationService.processResumeUpload(
    resumeId, 
    Buffer.from(resumeContent, 'utf-8'), 
    'text/plain'
  );

  return NextResponse.json({
    success: true,
    data: intelligence,
    requestId
  });
});
