import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AIErrorCodes } from '../errors/AIErrors';
import { AILogger } from '../observability/AILogger';

export interface AIRequestContext<T = any> {
  req: NextRequest;
  user: { id: string };
  body: T;
  requestId: string;
}

export type AIRouteHandler<T> = (context: AIRequestContext<T>) => Promise<NextResponse>;

export function withAISecurity<T>(
  schema: z.ZodSchema<T>,
  handler: AIRouteHandler<T>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();

    try {
      // 1. Authentication
      // Replace with actual Supabase / NextAuth check
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({
          success: false,
          code: AIErrorCodes.UNAUTHORIZED,
          message: 'Missing authorization',
          requestId
        }, { status: 401 });
      }

      // 2. Rate Limiting Placeholder
      // e.g., await checkRateLimit(req.ip, 'AI_ENDPOINT');

      // 3. Input Validation
      let body: any = {};
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          body = await req.json();
        } catch (e) {
          return NextResponse.json({
            success: false,
            code: AIErrorCodes.INVALID_JSON,
            message: 'Invalid JSON payload',
            requestId
          }, { status: 400 });
        }
      }

      let validationData: any = body;
      if (schema !== z.any()) {
        const validation = schema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json({
            success: false,
            code: AIErrorCodes.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validation.error.format(),
            requestId
          }, { status: 400 });
        }
        validationData = validation.data;
      }

      return await handler({
        req,
        user: { id: 'mock-user-id' }, // Mocked until auth integrated
        body: validationData,
        requestId
      });

    } catch (error: any) {
      AILogger.error('Unhandled AI Route Error', error, {
        requestId,
        provider: 'system',
        model: 'system',
        processingStage: 'middleware'
      });

      return NextResponse.json({
        success: false,
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
        requestId
      }, { status: error.status || 500 });
    }
  };
}
