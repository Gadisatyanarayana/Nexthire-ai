import { SpeechRecognitionProvider, SpeechRecognitionEvents } from "./SpeechRecognitionProvider";

export class BrowserSpeechRecognitionProvider implements SpeechRecognitionProvider {
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private vadInterval: any = null;
  private silenceStart: number | null = null;
  private mediaStream: MediaStream | null = null;

  isSupported(): boolean {
    return typeof window !== "undefined" && 
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }

  destroy() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch(e){}
    }
    this.recognition = null;
  }

  async start(events: SpeechRecognitionEvents): Promise<boolean> {
    if (!this.isSupported()) {
      events.onError?.("Voice Interview isn't supported in this browser. Please use Chrome or Edge.");
      return false;
    }
    
    if (this.isListening && this.recognition) {
      return true;
    }

    try {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionConstructor();
      
      this.recognition.lang = "en-US";
      this.recognition.continuous = false; // Important: Forces atomic turn blocks
      this.recognition.interimResults = true; // We still want them to display, but won't send them to backend


      this.recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).trim();
        const hasFinal = finalTranscript.trim().length > 0;

        if (fullTranscript && events.onResult) {
          events.onResult({
            transcript: fullTranscript,
            isFinal: hasFinal && interimTranscript.trim().length === 0
          });
        }
      };

      // Native Speech Event Logging
      this.recognition.onaudiostart = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onaudiostart"); };
      this.recognition.onsoundstart = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onsoundstart"); };
      this.recognition.onspeechstart = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onspeechstart"); };
      this.recognition.onspeechend = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onspeechend"); };
      this.recognition.onsoundend = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onsoundend"); };
      this.recognition.onaudioend = () => { if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onaudioend"); };

      this.recognition.onerror = (event: any) => {
        const errorMsg = String(event.error || "").toLowerCase();
        if(process.env.NODE_ENV === 'development') console.warn(`[VOICE][Event] onerror: ${errorMsg}`);
        
        if (errorMsg === "no-speech" || errorMsg === "aborted" || errorMsg === "network") return;
        
        if (events.onError) {
          events.onError(errorMsg);
        }
      };

      this.recognition.onend = () => {
        if(process.env.NODE_ENV === 'development') console.log("[VOICE][Event] onend triggered");
        this.isListening = false;
        this.recognition = null;
        if (events.onEnd) {
          events.onEnd();
        }
      };

      this.recognition.start();
      this.isListening = true;
      if(process.env.NODE_ENV === 'development') console.log("[VOICE][4] Recognition Started");
      return true;
    } catch (e) {
      console.error("[VOICE] Failed to start recognition:", e);
      this.isListening = false;
      this.recognition = null;
      return false;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try {
        if(process.env.NODE_ENV === 'development') console.log("[VOICE][7] Recognition Stopped manually");
        this.recognition.stop();
      } catch (e) {
        console.warn("[VOICE] Error stopping recognition:", e);
      }
    }
    this.isListening = false;
    this.recognition = null;
  }
}
