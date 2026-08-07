/* eslint-disable */
import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceProvider } from "@/platform/voice/services/providers/VoiceProvider";
import { SpeechRecognitionProvider } from "@/platform/voice/services/providers/SpeechRecognitionProvider";

export type VoiceState = 
  | "Idle" 
  | "Preparing" 
  | "Listening" 
  | "SilenceDetected"
  | "Transcribing" 
  | "Thinking" 
  | "CallingBackend" 
  | "Speaking" 
  | "Waiting"
  | "Recovery"
  | "Finished"
  | "Error";

interface UseVoiceMachineProps {
  voiceProvider: VoiceProvider;
  speechProvider: SpeechRecognitionProvider;
  onTranscriptReady: (transcript: string) => Promise<string>; 
  onError?: (err: string) => void;
  onStateChange?: (state: VoiceState) => void;
  silenceTimeoutMs?: number;
}

const logVoiceStep = (step: number, message: string, details?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[VOICE][${step}] ${message}`, details ? JSON.stringify(details) : "");
  }
};

const INVALID_TRANSCRIPTS = ["", " ", "...", "uh", "hmm", "um", "ah"];

export function useVoiceMachine({
  voiceProvider,
  speechProvider,
  onTranscriptReady,
  onError,
  onStateChange,
  silenceTimeoutMs = 2500
}: UseVoiceMachineProps) {
  const [state, setState] = useState<VoiceState>("Idle");
  const [transcriptDraft, setTranscriptDraft] = useState("");
  
  const stateRef = useRef(state);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTranscriptRef = useRef("");
  const sessionStartTimeRef = useRef<number>(Date.now());
  const stateStartTimeRef = useRef<number>(Date.now());
  const retryCountRef = useRef(0);
  const turnIdRef = useRef(1);

  const updateState = useCallback((newState: VoiceState) => {
    const duration = Date.now() - stateStartTimeRef.current;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[VOICE][STATE] Exited: ${stateRef.current} (Duration: ${duration}ms)`);
      console.log(`[VOICE][STATE] Entered: ${newState} at ${new Date().toISOString()}`);
    }

    stateRef.current = newState;
    stateStartTimeRef.current = Date.now();
    setState(newState);
    onStateChange?.(newState);
    
    // Clear old watchdogs
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

    // Set strict new watchdogs based on state
    let watchdogMs = 0;
    if (newState === "Listening" || newState === "Transcribing") watchdogMs = 30000;
    else if (newState === "Thinking" || newState === "CallingBackend") watchdogMs = 15000;
    else if (newState === "Speaking") watchdogMs = 30000;

    if (watchdogMs > 0) {
      watchdogTimerRef.current = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') console.warn(`[VOICE][WATCHDOG] State '${newState}' exceeded ${watchdogMs}ms. Forcing Recovery.`);
        handleRecovery();
      }, watchdogMs);
    }
  }, [onStateChange]);

  const handleRecovery = useCallback(() => {
    updateState("Recovery");
    speechProvider.stop();
    voiceProvider.stop();
    
    if (retryCountRef.current < 1) {
      retryCountRef.current++;
      logVoiceStep(15, "Attempting Recovery Restart...");
      setTimeout(() => {
        updateState("Listening");
        speechProvider.start({
          onResult: handleResult,
          onEnd: handleSpeechEnd,
          onError: handleError
        });
      }, 1000);
    } else {
      updateState("Error");
      onError?.("Voice recognition failed. Please click Resume Interview.");
    }
  }, [speechProvider, voiceProvider, updateState, onError]);

  const triggerThinkingRef = useRef<((text: string) => Promise<void>) | null>(null);

  const handleSpeechEnd = useCallback(() => {
    if (stateRef.current === "Listening" || stateRef.current === "Transcribing") {
      // The browser natively ended speech recognition without us calling stop (e.g. user stopped speaking for a while)
      // Because continuous=false, it naturally stops after an utterance.
      logVoiceStep(7, "Recognition Stopped (native onend)");
      
      const text = pendingTranscriptRef.current.trim();
      if (!text || INVALID_TRANSCRIPTS.includes(text.toLowerCase())) {
        logVoiceStep(8, "Invalid/Empty Transcript, restarting listening");
        updateState("Listening");
        setTimeout(() => {
          speechProvider.start({
            onResult: handleResult,
            onEnd: handleSpeechEnd,
            onError: handleError
          }).catch(() => {});
        }, 500); // Small delay to prevent rapid restart network errors
        return;
      }

      updateState("SilenceDetected");
      if (triggerThinkingRef.current) {
        void triggerThinkingRef.current(text);
      }
    }
  }, []);

  const handleError = useCallback((error: Error | string) => {
    const errorMsg = typeof error === 'string' ? error : error.message;
    if (process.env.NODE_ENV === 'development') console.warn(`[VOICE][Error] ${errorMsg}`);
    
    if (stateRef.current === "Listening" || stateRef.current === "Transcribing") {
      handleRecovery();
    } else {
      updateState("Error");
      onError?.(errorMsg);
    }
  }, [updateState, onError, handleRecovery]);

  const handleResult = useCallback((result: { transcript: string, isFinal: boolean }) => {
    if (stateRef.current === "Speaking") {
      if (result.transcript.toLowerCase().includes("wait") || result.transcript.toLowerCase().includes("stop")) {
        logVoiceStep(5, "Interruption Detected");
        voiceProvider.stop();
        updateState("Listening");
        setTranscriptDraft("");
        pendingTranscriptRef.current = "";
        
        speechProvider.start({
          onResult: handleResult,
          onEnd: handleSpeechEnd,
          onError: handleError
        }).catch(() => {});
      }
      return;
    }

    if (stateRef.current !== "Listening" && stateRef.current !== "Transcribing") return;
    
    if (stateRef.current === "Listening") {
      logVoiceStep(5, "Speech Detected");
      updateState("Transcribing");
    }

    pendingTranscriptRef.current = result.transcript;
    setTranscriptDraft(result.transcript);

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    if (result.isFinal) {
      logVoiceStep(6, "Final Transcript Received");
      // For continuous=false, the browser will soon trigger onend.
      // But we set a failsafe silence timer just in case it hangs.
      silenceTimerRef.current = setTimeout(() => {
        speechProvider.stop(); // This will trigger onend
      }, silenceTimeoutMs);
    }
  }, [updateState, silenceTimeoutMs, voiceProvider, speechProvider, handleSpeechEnd, handleError]);

  const triggerThinking = useCallback(async (finalTranscript: string) => {
    updateState("Thinking");
    setTranscriptDraft("");
    pendingTranscriptRef.current = "";
    retryCountRef.current = 0; // Reset retries on successful utterance

    try {
      const fillers = ["Hmm...", "Let me see.", "Right.", "Okay.", "That's interesting."];
      const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
      
      logVoiceStep(8, "Sending Backend Request", { turnId: turnIdRef.current });
      updateState("CallingBackend");
      
      voiceProvider.speak(randomFiller).catch(() => {});

      const llmStartTime = Date.now();
      const aiReply = await onTranscriptReady(finalTranscript);
      const llmTime = Date.now() - llmStartTime;
      
      logVoiceStep(12, "Groq Response Received", { turnId: turnIdRef.current, llmTimeMs: llmTime });
      
      updateState("Waiting");
      await new Promise(r => setTimeout(r, 600));

      updateState("Speaking");
      logVoiceStep(13, "TTS Started");
      
      try {
        await voiceProvider.speak(aiReply);
        logVoiceStep(14, "TTS Finished");
      } catch (ttsErr) {
        if (process.env.NODE_ENV === 'development') console.warn("[VOICE][TTS] Failed, simulating completion", ttsErr);
      }
      
      if (stateRef.current !== "Finished" && stateRef.current !== "Error") {
        turnIdRef.current++;
        updateState("Listening");
        logVoiceStep(15, "Listening Restarted");
        await speechProvider.start({
          onResult: handleResult,
          onEnd: handleSpeechEnd,
          onError: handleError
        });
      }
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') console.warn("[VOICE][Error] Backend error:", e);
      handleRecovery();
    }
  }, [voiceProvider, speechProvider, onTranscriptReady, updateState, handleResult, handleSpeechEnd, handleError, handleRecovery]);

  useEffect(() => {
    triggerThinkingRef.current = triggerThinking;
  }, [triggerThinking]);

  const startSession = useCallback(async (initialGreeting?: string) => {
    sessionStartTimeRef.current = Date.now();
    logVoiceStep(1, "Interview Started");
    updateState("Preparing");
    await voiceProvider.initialize();

    if (initialGreeting) {
      updateState("Speaking");
      logVoiceStep(2, "AI Speaking Started");
      await voiceProvider.speak(initialGreeting);
      logVoiceStep(3, "AI Speaking Finished");
    }
    
    updateState("Listening");
    const started = await speechProvider.start({
      onResult: handleResult,
      onEnd: handleSpeechEnd,
      onError: handleError
    });

    if (!started) {
      updateState("Error");
      onError?.("Failed to start microphone. Please check browser permissions.");
    }
  }, [voiceProvider, speechProvider, handleResult, handleSpeechEnd, handleError, updateState, onError]);

  const stopSession = useCallback(() => {
    updateState("Finished");
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    voiceProvider.stop();
    speechProvider.stop();
  }, [voiceProvider, speechProvider, updateState]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      voiceProvider.stop();
      speechProvider.stop();
    };
  }, [voiceProvider, speechProvider]);

  return {
    state,
    transcriptDraft,
    startSession,
    stopSession
  };
}
