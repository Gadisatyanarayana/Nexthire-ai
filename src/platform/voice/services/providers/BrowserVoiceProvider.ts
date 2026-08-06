import { VoiceProvider, VoiceProviderConfig } from "./VoiceProvider";

export class BrowserVoiceProvider implements VoiceProvider {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  isReady(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  async initialize(): Promise<void> {
    if (!this.isReady()) return;
    
    // Play a silent utterance to unlock the audio context on user interaction
    const silentUtterance = new SpeechSynthesisUtterance("");
    silentUtterance.volume = 0;
    window.speechSynthesis.speak(silentUtterance);
    
    return Promise.resolve();
  }

  async speak(text: string, config?: VoiceProviderConfig): Promise<void> {
    if (!this.isReady()) return Promise.resolve();

    this.stop(); // Stop anything currently playing

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;

      if (config) {
        if (config.rate !== undefined) utterance.rate = config.rate;
        if (config.pitch !== undefined) utterance.pitch = config.pitch;
        if (config.language !== undefined) utterance.lang = config.language;
      } else {
        utterance.lang = "en-US";
        utterance.rate = 1.05;
      }

      // Voice selection logic could be expanded here if preferred voices are tracked
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Try to find a good voice if none specifically provided via config ID, or just use first match
        const preferred = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium")));
        if (preferred) {
          utterance.voice = preferred;
        }
      }

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          this.activeUtterance = null;
          resolve();
        }
      };

      // Safety timeout: base + 50ms per character
      const safetyTimeoutMs = 5000 + (text.length * 50);
      
      this.timeoutId = setTimeout(() => {
        console.warn("[VoiceProvider] TTS Utterance timeout reached.");
        safeResolve();
      }, safetyTimeoutMs);

      utterance.onend = () => {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        safeResolve();
      };
      
      utterance.onerror = (e) => {
        console.warn("[VoiceProvider] TTS Error:", e);
        if (this.timeoutId) clearTimeout(this.timeoutId);
        safeResolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isReady()) {
      window.speechSynthesis.cancel();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.activeUtterance = null;
  }
}
