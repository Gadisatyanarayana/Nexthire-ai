"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Target, TrendingUp, Loader2 } from "lucide-react";

export function WeakTopicCoachCard({ plan }: { plan?: any }) {
  if (!plan) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-red-400" />
        Weak Topic Analysis
      </h3>

      <div className="space-y-4">
        {plan.weakTopics?.map((topic: any, idx: number) => (
          <div key={idx} className="bg-zinc-950 p-4 rounded-xl border border-red-500/10">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-zinc-200">{topic.topic}</h4>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                topic.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                topic.priority === 'Medium' ? 'bg-orange-500/20 text-orange-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {topic.priority} Priority
              </span>
            </div>
            <p className="text-sm text-zinc-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              {topic.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
