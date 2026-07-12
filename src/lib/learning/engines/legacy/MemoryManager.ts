import { LLMMessage } from "@/lib/llm/SafeLLMClient";

export class MemoryManager {
  private static readonly STORAGE_KEY = "aptitude_tutor_memory";

  public static getHistory(): LLMMessage[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load tutor memory", e);
    }
    return [];
  }

  public static saveHistory(messages: LLMMessage[]) {
    if (typeof window === "undefined") return;
    try {
      // Keep only the last 20 messages to prevent hitting token limits or localStorage limits
      const toSave = messages.slice(-20);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("Failed to save tutor memory", e);
    }
  }
  
  public static clearHistory() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
