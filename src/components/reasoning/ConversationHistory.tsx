"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Clock, Loader2 } from "lucide-react";

export function ConversationHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/v1/reasoning/ai/history");
        const json = await res.json();
        if (json.success) setHistory(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-zinc-400" />
        Recent Tutor Conversations
      </h3>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No past conversations found. Ask the AI Tutor a question to start!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((h: any) => (
            <div key={h.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
              <p className="text-sm text-zinc-300 truncate">
                {h.session_data?.messages?.[0]?.content || "Conversation session"}
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                {new Date(h.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
