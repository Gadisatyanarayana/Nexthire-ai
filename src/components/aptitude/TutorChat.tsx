"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { LLMMessage } from "@/lib/llm/SafeLLMClient";
import { MemoryManager } from "@/lib/learning/engines/legacy/MemoryManager";

export function TutorChat({ initialContext }: { initialContext?: any }) {
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = MemoryManager.getHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([{ role: 'assistant', content: "Hi! I'm your AI Aptitude Tutor. Are you stuck on a problem or do you want to learn a new concept?" }]);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) {
      MemoryManager.saveHistory(messages);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: LLMMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/aptitude/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          context: initialContext
        })
      });

      if (!res.ok) throw new Error("Failed to connect to AI Tutor");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          // Parse Server-Sent Events (SSE) format typically used by streaming completions
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                const text = data.choices?.[0]?.delta?.content || "";
                assistantContent += text;
                setMessages(prev => {
                  const newArr = [...prev];
                  newArr[newArr.length - 1].content = assistantContent;
                  return newArr;
                });
              } catch (e) {
                // Ignore parse errors on incomplete chunks
              }
            }
          }
        }
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an error processing your request. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-emerald-500" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-none'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl p-2 focus-within:border-emerald-500/50 transition-colors"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-transparent border-none outline-none text-white px-2 placeholder:text-zinc-600"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-black rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
