"use client";

import React from "react";
import { MessageSquare, Clock } from "lucide-react";

export function ConversationHistory() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-zinc-400" />
        Recent Tutor Conversations
      </h3>
      <div className="text-center py-8">
        <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No past conversations found. Ask the AI Tutor a question to start!</p>
      </div>
    </div>
  );
}
