'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Paperclip, CheckCircle2, AlertCircle, History } from 'lucide-react';
import { useSession } from 'next-auth/react';

const CATEGORIES = [
  'Bug Report',
  'Feature Request',
  'Question Correction',
  'AI Feedback',
  'Technical Issue',
  'Account Issue',
  'Coding Platform',
  'Learning Platform',
  'Interview Platform',
  'Payment',
  'Other'
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

function checkIsAdmin(email: string | null | undefined, role: string | null | undefined): boolean {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm) return false;
  if (norm === 'satyanarayanag904@gmail.com') return true;
  if (String(role || '').toUpperCase() === 'ADMIN') return true;
  return false;
}

export function SupportChatWidget() {
  const { data: session } = useSession();
  const isAdmin = checkIsAdmin(session?.user?.email, (session?.user as any)?.role);

  // All hooks must be called unconditionally (Rules of Hooks)
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Form states
  const [category, setCategory] = useState('Bug Report');
  const [priority, setPriority] = useState('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // History states
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchTickets();
    }
  }, [isOpen, activeTab]);

  // Admin users never see the support widget
  if (isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: session?.user?.name || 'Student',
          email: session?.user?.email || 'student@example.com',
          category,
          priority,
          subject,
          description,
          attachments: attachmentUrl ? [attachmentUrl] : []
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');

      setSubmitSuccess(true);
      setSubject('');
      setDescription('');
      setAttachmentUrl('');
      
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('history');
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Error submitting ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-emerald-500 p-3.5 text-black font-bold shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        title="Student Support & Communication Center"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-96 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4 bg-zinc-900/60">
        <div>
          <h3 className="font-bold text-sm text-white">Communication Center</h3>
          <p className="text-[11px] text-zinc-400">Direct Support & Feedback Portal</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-black/40">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'create' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          New Submission
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'history' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" /> My Tickets
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 text-xs">
        {activeTab === 'create' ? (
          submitSuccess ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-center p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h4 className="font-bold text-base text-white">Ticket Submitted Successfully!</h4>
              <p className="text-zinc-400">Your query has been logged. The administrator will review and respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {submitError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        priority === p
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your ticket..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete details, steps to reproduce, or suggestions..."
                  className="w-full h-24 resize-none rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Attachment Link (Optional)</label>
                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="https://screenshot.link or drive URL..."
                    className="w-full bg-transparent text-[11px] text-white placeholder-zinc-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50"
              >
                {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          )
        ) : (
          <div className="space-y-3">
            {loadingHistory ? (
              <p className="text-center text-zinc-500 py-8">Loading ticket history...</p>
            ) : tickets.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">No support tickets found.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[200px]">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-2">{t.description}</p>
                  
                  {t.admin_reply && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] space-y-1">
                      <span className="font-bold text-emerald-400 block">Admin Reply:</span>
                      <p>{t.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                    <span>Category: {t.category}</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
