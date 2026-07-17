export class RetryStrategy {
  /**
   * Executes a function with exponential backoff.
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    baseDelayMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        if (attempt >= maxRetries || !this.isRetryable(error)) {
          throw error;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw new Error('Unreachable');
  }

  private isRetryable(error: any): boolean {
    // 429 Too Many Requests, 500 Internal Server Error, 503 Service Unavailable
    const status = error?.status || error?.response?.status;
    return [429, 500, 502, 503, 504].includes(status) || error.message.includes('timeout');
  }
}
