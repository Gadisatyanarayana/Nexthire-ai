export interface AnalyticsPlugin {
  id: string;
  name: string;
  trackEvent: (eventName: string, payload?: any) => void;
}

export const AnalyticsRegistry: Record<string, AnalyticsPlugin> = {};
