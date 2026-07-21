"use client";

import React from 'react';
import { Flame, Target, Trophy, Clock } from 'lucide-react';

interface StreaksAndGoalsProps {
  progress: {
    xp: number;
    dailyGoal: number;
    currentStreak: number;
    studyTimeMinutes: number;
  };
}

export default function StreaksAndGoals({ progress }: StreaksAndGoalsProps) {
  const goalProgress = Math.min(100, Math.round((progress.xp / progress.dailyGoal) * 100)) || 0;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      
      {/* Daily XP Goal */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Daily Goal</span>
          <Target className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {progress.xp} <span className="text-sm font-normal text-zinc-500">/ {progress.dailyGoal} XP</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Learning Streak */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-500">Streak</span>
          <Flame className={`w-4 h-4 ${progress.currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-zinc-600'}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {progress.currentStreak} <span className="text-sm font-normal text-zinc-500">Days</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {progress.currentStreak > 0 ? "You're on fire! Keep it up." : "Complete a lesson today to start."}
          </div>
        </div>
      </div>

      {/* Total XP */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-yellow-500">Total XP</span>
          <Trophy className="w-4 h-4 text-yellow-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {progress.xp}
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Earn more XP by passing assessments.
          </div>
        </div>
      </div>

      {/* Study Time */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">Focus Time</span>
          <Clock className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {progress.studyTimeMinutes} <span className="text-sm font-normal text-zinc-500">Mins</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Time spent active in lessons today.
          </div>
        </div>
      </div>

    </div>
  );
}
