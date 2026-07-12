import { supabaseAdmin } from "@/lib/supabaseAdmin";
import pino from 'pino';
import { FeatureFlags } from "./FeatureFlags";

const logger = pino({ name: 'Observability' });

export interface ObservabilityMetrics {
  metricType: 'api_latency' | 'db_query_time' | 'ai_response_time' | 'cache_hit_ratio' | 'error_rate' | 'certificate_generation_time' | 'mock_evaluation_time' | 'leaderboard_refresh_time';
  durationMs?: number;
  success?: boolean;
  metadata?: any;
}

export class Observability {
  public static async logMetric(metric: ObservabilityMetrics): Promise<void> {
    if (!FeatureFlags.isObservabilityEnabled()) return;

    logger.info(`Metric: ${metric.metricType} | Duration: ${metric.durationMs}ms | Success: ${metric.success}`);

    try {
      await supabaseAdmin.from('system_telemetry').insert({
        event_type: metric.metricType,
        metrics: metric,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      logger.error({ err: e }, "Failed to log observability metric");
    }
  }
}
