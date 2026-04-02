"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your NextHire AI assistant. I can help you with coding questions, resume tips, and interview preparation. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);

      const response = await fetch("/api/chatbot", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = (await response.json()) as {
        message?: string;
      };
      const assistantMessage = {
        role: "assistant",
        content: typeof data.message === "string" ? data.message : "",
      } as Message;
      setMessages((prev): Message[] => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? (error.name === "AbortError" ? "Request timed out. Please try again." : error.message)
        : "An error occurred";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-4xl">NextHire AI Assistant</h1>
            <p className="mt-1 text-sm text-white/70 md:text-base">Natural real-time chat for coding, debugging, resumes, interview prep, and projects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/voice-interviewer"
              className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20"
            >
              Open AI Interviewer
            </Link>
            <Link
              href="/coding"
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Back To Coding
            </Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="rounded-xl border border-white/15 bg-black/30 p-3">
              <p className="text-xs font-semibold text-white">Learning Notes</p>
              <ul className="mt-2 space-y-1 text-xs text-white/80">
                <li>Ask exactly what you want, in plain language</li>
                <li>Request code, explanation, or both</li>
                <li>Ask follow-ups to refine output quickly</li>
              </ul>
            </div>
          </aside>

          <section className="flex h-[calc(100vh-12rem)] min-h-140 flex-col rounded-2xl border border-white/15 bg-white/5">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">Conversation</p>
              <p className="text-xs text-white/65">Ask naturally: explanations, complete implementations, debugging, interview prep, or test-case generation.</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "border border-white/25 bg-white text-black"
                      : "border border-white/20 bg-black/55 text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-white/20 bg-black/55 px-4 py-3 text-white">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/70"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/70 delay-100"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/70 delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Type your question..."
                  disabled={loading}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
