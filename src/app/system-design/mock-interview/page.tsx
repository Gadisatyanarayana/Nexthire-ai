"use client";

import { Mic, Video, Play, Bot, User, Send, Brain } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function MockInterviewSetupPage() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: "Welcome to your FAANG System Design Mock Interview. I will be your interviewer today. Are you ready to begin? If so, which system would you like to design?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        userId: session?.user?.email || 'anonymous',
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        lessonTitle: "Mock Interview",
        difficulty: "Hard",
        masteryScore: 80,
        weakTopics: [],
        mode: "interview"
      };

      const res = await fetch('/api/v1/system-design/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to reach mentor");
      if (!res.body) throw new Error("No readable stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantContent;
          return newMessages;
        });
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl h-[calc(100vh-120px)] flex flex-col">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Mic className="h-8 w-8 text-rose-500" />
          AI Mock Interviews
        </h1>
        <p className="text-sm opacity-70 mt-2">
          Simulate high-pressure FAANG System Design rounds. The AI will evaluate your architecture, push back on your tradeoffs, and score your performance based on real rubrics.
        </p>
      </section>

      <div className="flex-1 bg-background border border-foreground/10 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="h-14 border-b border-foreground/10 bg-foreground/5 flex items-center px-4 gap-2">
          <div className="bg-rose-500/20 p-1.5 rounded-lg">
            <Brain className="h-5 w-5 text-rose-500" />
          </div>
          <span className="font-bold text-sm">System Design Interviewer</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-rose-500/20 text-rose-500'}`}>
                {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-foreground/5 rounded-tl-none leading-relaxed'}`}>
                {msg.content || <span className="animate-pulse">...</span>}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1].role === 'user' && (
             <div className="flex gap-4 max-w-[85%]">
               <div className="flex-shrink-0 h-10 w-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                 <Bot className="h-5 w-5" />
               </div>
               <div className="p-4 rounded-2xl bg-foreground/5 rounded-tl-none flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                 <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-foreground/10 bg-background">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response to the interviewer..."
              className="w-full bg-foreground/5 border border-foreground/10 rounded-full pl-6 pr-14 py-4 text-sm outline-none focus:border-rose-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-rose-500 text-white rounded-full hover:bg-rose-400 disabled:opacity-50 disabled:hover:bg-rose-500 transition-colors"
            >
              <Send className="h-5 w-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
