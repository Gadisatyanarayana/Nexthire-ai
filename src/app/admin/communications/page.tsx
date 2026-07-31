'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  MessageSquare, Search, Filter, ShieldCheck, CheckCircle2, AlertCircle, 
  Send, User, Clock, ArrowLeft, Download, Paperclip, RefreshCw, BarChart2
} from 'lucide-react';

type SupportTicket = {
  id: string;
  user_id: string | null;
  student_name: string;
  student_email: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  subject: string;
  description: string;
  attachments: string[];
  status: 'Open' | 'In Progress' | 'Pending Student' | 'Resolved' | 'Closed' | 'Archived';
  admin_notes: string | null;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

const CATEGORIES = [
  'All Categories',
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

const STATUSES = ['All Statuses', 'Open', 'In Progress', 'Pending Student', 'Resolved', 'Closed', 'Archived'];
const PRIORITIES = ['All Priorities', 'Low', 'Medium', 'High', 'Critical'];

export default function AdminCommunicationsPage() {
  const { data: session, status: authStatus } = useSession();
  const isAdmin = session?.user?.email === 'satyanarayanag904@gmail.com';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');

  // Form states for active ticket
  const [replyText, setReplyText] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/support/tickets');
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load support tickets');
      
      const loaded: SupportTicket[] = data.tickets || [];
      setTickets(loaded);

      if (loaded.length > 0 && !selectedTicketId) {
        setSelectedTicketId(loaded[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTickets();
    }
  }, [isAdmin]);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  useEffect(() => {
    if (selectedTicket) {
      setReplyText(selectedTicket.admin_reply || '');
      setInternalNotes(selectedTicket.admin_notes || '');
    }
  }, [selectedTicket]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (categoryFilter !== 'All Categories' && t.category !== categoryFilter) return false;
      if (statusFilter !== 'All Statuses' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'All Priorities' && t.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.student_name.toLowerCase().includes(q) ||
          t.student_email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, categoryFilter, statusFilter, priorityFilter, search]);

  const analytics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Open').length;
    const resolved = tickets.filter((t) => t.status === 'Resolved').length;
    const critical = tickets.filter((t) => t.priority === 'Critical').length;
    return { total, open, resolved, critical };
  }, [tickets]);

  const handleUpdateTicket = async (updates: Partial<SupportTicket>) => {
    if (!selectedTicketId) return;

    try {
      setUpdating(true);
      const res = await fetch('/api/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          ...updates,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicketId ? { ...t, ...data.ticket } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await handleUpdateTicket({
      admin_reply: replyText,
      admin_notes: internalNotes,
      status: 'Resolved',
    });
  };

  if (authStatus === 'loading') {
    return <div className="min-h-screen bg-black text-white p-12 text-center">Loading authentication...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">Admin Privileges Required</h1>
        <p className="text-zinc-400 text-sm mt-2 max-w-md">
          Access restricted exclusively to administrator <span className="text-emerald-400 font-mono">satyanarayanag904@gmail.com</span>.
        </p>
        <Link href="/dashboard" className="mt-6 px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-bold hover:bg-zinc-700">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-2">
                <MessageSquare className="w-7 h-7 text-emerald-400" /> Admin Communication Inbox
              </h1>
              <p className="text-zinc-400 text-xs mt-1">
                Real-time student tickets, bug reports, question corrections, and platform feedback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={loadTickets} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center gap-2 text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Inbox
            </button>
          </div>
        </header>

        {/* Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <p className="text-[11px] font-semibold text-zinc-400">Total Tickets</p>
            <p className="text-2xl font-black text-white mt-1">{analytics.total}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] font-semibold text-amber-400">Open Tickets</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{analytics.open}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[11px] font-semibold text-emerald-400">Resolved</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">{analytics.resolved}</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <p className="text-[11px] font-semibold text-red-400">Critical Priority</p>
            <p className="text-2xl font-black text-red-300 mt-1">{analytics.critical}</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[240px] relative flex items-center bg-black border border-zinc-800 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, email, subject, or description..."
              className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none w-full"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-black border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-black border border-zinc-800 text-xs text-white rounded-xl px-3 py-2 outline-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Ticket List */}
          <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <span>Submissions ({filteredTickets.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60">
              {loading ? (
                <p className="text-center py-12 text-zinc-500 text-xs">Loading tickets...</p>
              ) : filteredTickets.length === 0 ? (
                <p className="text-center py-12 text-zinc-500 text-xs">No matching tickets found.</p>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = t.id === selectedTicketId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full p-4 text-left transition-colors flex flex-col space-y-2 cursor-pointer ${
                        isSelected ? 'bg-emerald-500/10 border-l-4 border-emerald-500' : 'hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate max-w-[220px]">{t.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : t.priority === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {t.priority}
                        </span>
                      </div>

                      <p className="text-zinc-400 text-[11px] line-clamp-2">{t.description}</p>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                        <span className="font-medium text-emerald-400">{t.student_name}</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Ticket Details & Reply Panel */}
          <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
            {selectedTicket ? (
              <div className="space-y-6">
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase">
                        {selectedTicket.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTicket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mt-2">{selectedTicket.subject}</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Submitted by <span className="text-white font-semibold">{selectedTicket.student_name}</span> ({selectedTicket.student_email}) on {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTicket({ status: 'Resolved' })}
                      className="px-3 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Student Message</h4>
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Attachments */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Attachments</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-700"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> Attachment #{i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Reply Input */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Administrator Response</h4>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type official response to student..."
                    className="w-full h-28 resize-none rounded-xl border border-zinc-800 bg-black p-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-emerald-500/50"
                  />

                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Internal admin notes (private)..."
                      className="bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-400 w-2/3 outline-none"
                    />

                    <button
                      onClick={handleSendReply}
                      disabled={updating || !replyText.trim()}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Send & Resolve
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-24 text-zinc-500">
                <MessageSquare className="w-12 h-12 mb-3 text-zinc-600" />
                <p className="text-sm font-semibold">Select a ticket from the inbox list to view and reply.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
