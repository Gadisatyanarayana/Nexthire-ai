import pino from 'pino';

// Reusing pino for structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

export interface AILogContext {
  requestId: string;
  userId?: string;
  resumeId?: string;
  queueJobId?: string;
  provider: string;
  model: string;
  processingStage?: string;
  pipelineStage?: string;
  cacheHit?: boolean;
  retryCount?: number;
  latency?: number;
  tokens?: number;
  estimatedCost?: number;
  pages?: number;
  characters?: number;
  parserVersion?: string;
}

export class AILogger {
  static info(message: string, context: AILogContext & Record<string, any>) {
    logger.info({ ...context }, message);
  }

  static error(message: string, error: unknown, context: AILogContext & Record<string, any>) {
    logger.error({ ...context, error }, message);
  }

  static trackPerformance(
    context: AILogContext,
    metrics: {
      durationMs: number;
      estimatedPromptTokens?: number;
      estimatedCompletionTokens?: number;
      cacheHit: boolean;
      retryCount: number;
    }
  ) {
    logger.info({
      ...context,
      metrics,
      event_type: 'AI_PERFORMANCE_METRIC'
    }, `AI Operation Metrics: ${context.processingStage}`);
  }
}
