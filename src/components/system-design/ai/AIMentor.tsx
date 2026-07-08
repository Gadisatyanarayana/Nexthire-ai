"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { useVisualLearningStore } from '@/lib/store/visualLearningStore';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, Bot, User, Sparkles, Brain, Code, Network } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIMentor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const { activeLesson, visualMode, highlightedConcept } = useVisualLearningStore();

  // Dynamic context detection from URL / Pathname
  const contextInfo = useMemo(() => {
    if (!pathname) return { type: 'General', title: 'General System Design' };

    const parts = pathname.split('/');

    // Case Study: /system-design/cases/case-whatsapp
    if (pathname.includes('/system-design/cases/')) {
      const caseId = pathname.split('/system-design/cases/')[1]?.split('/')[0] || '';
      const formattedTitle = caseId.replace('case-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: 'Case Study', title: `Case Study: ${formattedTitle || caseId}` };
    }

    // Company Path: /system-design/company-paths/google
    if (pathname.includes('/system-design/company-paths/')) {
      const companyId = pathname.split('/system-design/company-paths/')[1]?.split('/')[0] || '';
      const formattedTitle = companyId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: 'Company Path', title: `Company Path: ${formattedTitle || companyId}` };
    }

    // Lesson: /system-design/mod-foundations/scalability
    if (parts.length >= 4 && parts[1] === 'system-design' && parts[2] !== 'cases' && parts[2] !== 'company-paths' && parts[2] !== 'modules') {
      const moduleId = parts[2];
      const lessonId = parts[3];
      const formattedLesson = lessonId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const formattedModule = moduleId.replace('mod-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: 'Lesson', title: `Lesson: ${formattedLesson} (${formattedModule})` };
    }

    // Module Dashboard: /system-design/mod-foundations or /system-design/modules
    if (parts.length >= 3 && parts[1] === 'system-design' && parts[2] !== 'cases' && parts[2] !== 'company-paths') {
      const moduleId = parts[2];
      const formattedModule = moduleId.replace('mod-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { type: 'Module', title: `Module: ${formattedModule}` };
    }

    return { type: 'General', title: 'System Design Dashboard' };
  }, [pathname]);

  // Set greeting message based on context
  useEffect(() => {
    setMessages([
      { 
        role: 'assistant', 
        content: `Hi! I'm your AI System Design Mentor. I've automatically loaded context for the ${contextInfo.type}: "${contextInfo.title}". How can I help you master this topic?` 
      }
    ]);
  }, [contextInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const payload = {
        userId: session?.user?.email || 'anonymous',
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        lessonTitle: contextInfo.title,
        difficulty: "Intermediate",
        masteryScore: 45,
        weakTopics: ["Caching"],
        mode: visualMode
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
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Sorry, my cognitive circuits are experiencing a timeout. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestAction = (action: string) => {
    sendMessage(action);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-transform z-50 flex items-center gap-2 font-bold"
      >
        <Sparkles className="h-5 w-5" />
        AI Mentor
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-background border border-foreground/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-foreground/10 bg-foreground/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500/20 p-1.5 rounded-lg">
            <Brain className="h-5 w-5 text-cyan-500" />
          </div>
          <span className="font-bold text-sm">System Design Mentor</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-foreground/10 rounded-lg transition-colors">
          <X className="h-5 w-5 opacity-70" />
        </button>
      </div>

      {/* Context Bar */}
      {contextInfo.title && (
        <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-xs font-mono text-indigo-400">
          <Network className="h-3.5 w-3.5" />
          Context: {contextInfo.title}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-cyan-500/20 text-cyan-500'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-none' : 'bg-foreground/5 rounded-tl-none leading-relaxed'}`}>
              {msg.content || <span className="animate-pulse">...</span>}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-3 rounded-xl bg-foreground/5 rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2 flex overflow-x-auto gap-2 no-scrollbar">
        <button onClick={() => suggestAction("Explain like I'm 5")} className="flex-shrink-0 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-xs transition-colors whitespace-nowrap">Explain Like Beginner</button>
        <button onClick={() => suggestAction("Quiz me on this topic")} className="flex-shrink-0 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-xs transition-colors whitespace-nowrap">Quiz Me</button>
        <button onClick={() => suggestAction("What are the trade-offs?")} className="flex-shrink-0 px-3 py-1.5 bg-foreground/5 hover:bg-foreground/10 rounded-full text-xs transition-colors whitespace-nowrap">Trade-offs</button>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-foreground/10 bg-background">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask mentor anything..."
            className="w-full bg-foreground/5 border border-foreground/10 rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:border-cyan-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-cyan-500 text-black rounded-full hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 transition-colors"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
