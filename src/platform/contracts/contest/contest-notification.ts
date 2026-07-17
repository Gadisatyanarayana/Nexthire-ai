export interface BroadcastProvider {
  providerId: string; // 'WEBSOCKET', 'SSE', 'PUSH', 'EMAIL'
  broadcast(topic: string, message: any): Promise<void>;
}
