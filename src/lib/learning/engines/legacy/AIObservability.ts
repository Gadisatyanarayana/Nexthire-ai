import { getAdminClient } from "@/lib/supabaseAdmin";
import pino from 'pino';

const logger = pino({ name: 'AIObservability' });

export interface AIObservabilityEvent {
  provider: string;
  model: string;
  promptVersion?: string;
  tokensIn: number;
  tokensOut: number;
  responseTimeMs: number;
  retryCount: number;
  isCacheHit: boolean;
  errorType?: string;
  isFallback: boolean;
  success: boolean;
}

export class AIObservability {
  public static async logEvent(event: AIObservabilityEvent) {
    // Log to console/logger for standard debugging
    logger.info(`AI Event: [${event.provider}] ${event.model} - Success: ${event.success} - ${event.responseTimeMs}ms`);

    // In a production system, this would write to a time-series DB, DataDog, or a dedicated analytics table
    // For now, we fire and forget to a generic telemetry table (assuming it exists, or just log)
    try {
      const supabaseAdmin = getAdminClient();
      // NOTE: Do not log sensitive user data, only metrics
      await supabaseAdmin.from('system_telemetry').insert({
        event_type: 'ai_request_metric',
        metrics: event,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // Silently fail telemetry so we don't break the main flow
      logger.error({ err: e }, "Failed to log AI telemetry");
    }
  }
}
