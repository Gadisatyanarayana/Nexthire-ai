export type VoiceEvent = 
  | { type: "InterviewStarted", sessionId: string }
  | { type: "ResumeParsed", profileJson: string }
  | { type: "QuestionGenerated", round: string, topic: string }
  | { type: "AnswerReceived", transcript: string }
  | { type: "RoundCompleted", nextRound: string }
  | { type: "Error", component: string, message: string };

type EventCallback = (event: VoiceEvent) => void;

class InterviewEventBus {
  private listeners: EventCallback[] = [];

  subscribe(callback: EventCallback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  publish(event: VoiceEvent) {
    // Also optionally log to remote observability
    console.log(`[EventBus] ${event.type}`, event);
    this.listeners.forEach(cb => cb(event));
  }
}

export const eventBus = new InterviewEventBus();
