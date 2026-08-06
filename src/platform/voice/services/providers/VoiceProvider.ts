export interface VoiceProviderConfig {
  voiceId?: string;
  rate?: number;
  pitch?: number;
  language?: string;
}

export interface VoiceProvider {
  /**
   * Initialize the TTS engine. For browser, this might play a silent audio chunk to unlock autoplay.
   */
  initialize(): Promise<void>;

  /**
   * Speak a string of text. Resolves when the text has finished speaking.
   */
  speak(text: string, config?: VoiceProviderConfig): Promise<void>;

  /**
   * Stop any current speech.
   */
  stop(): void;

  /**
   * Check if the provider is ready.
   */
  isReady(): boolean;
}
