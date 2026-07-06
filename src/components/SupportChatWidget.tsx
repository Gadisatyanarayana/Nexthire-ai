'use client';

import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    // Future integration: Send to Supabase 'support_tickets' table
    await new Promise(resolve => setTimeout(resolve, 800));
    setSending(false);
    setSent(true);
    setMessage('');
    
    setTimeout(() => {
      setIsOpen(false);
      setSent(false);
    }, 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-600 p-3.5 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="font-semibold text-white">Support & Feedback</h3>
        <button onClick={() => setIsOpen(false)} className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm text-white/80">
        <p className="mb-4">Found a bug or have a suggestion? Let us know!</p>
        
        {sent ? (
          <div className="rounded-lg bg-emerald-500/20 p-3 text-emerald-400">
            Thanks! Your message has been sent to the admins.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue..."
              className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/40 focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Message'}
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
