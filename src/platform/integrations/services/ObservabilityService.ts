export class IntegrationsObservability {
  /**
   * Stub for tracking core integration metrics. 
   * In production, this would pipe to Datadog, Prometheus, or a structured logger.
   */
  public static trackApiRequest(tenantId: string, endpoint: string, statusCode: number, latencyMs: number) {
    console.log(`[METRIC] api_request | tenant:${tenantId} | endpoint:${endpoint} | status:${statusCode} | latency:${latencyMs}ms`);
  }

  public static trackAuthFailure(tenantId: string, reason: string) {
    console.warn(`[METRIC] auth_failure | tenant:${tenantId} | reason:${reason}`);
  }

  public static trackRateLimitViolation(tenantId: string, tier: string) {
    console.warn(`[METRIC] rate_limit_violation | tenant:${tenantId} | tier:${tier}`);
  }

  public static trackWebhookDelivery(tenantId: string, event: string, success: boolean, attempt: number, latencyMs: number) {
    const statusStr = success ? 'success' : 'failure';
    console.log(`[METRIC] webhook_delivery | tenant:${tenantId} | event:${event} | attempt:${attempt} | status:${statusStr} | latency:${latencyMs}ms`);
  }

  public static trackWebhookDeadLetter(tenantId: string, event: string, webhookId: string) {
    console.error(`[METRIC] webhook_dead_letter | tenant:${tenantId} | event:${event} | webhook_id:${webhookId}`);
  }
}
