export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechRecognitionEvents {
  onResult?: (result: SpeechRecognitionResult) => void;
  onEnd?: () => void;
  onError?: (error: Error | string) => void;
}

export interface SpeechRecognitionProvider {
  /**
   * Start listening to the microphone stream and trigger events.
   */
  start(events: SpeechRecognitionEvents): Promise<boolean>;

  /**
   * Stop listening.
   */
  stop(): void;

  /**
   * Check if the provider is supported by the current environment.
   */
  isSupported(): boolean;
}
