'use client';

import React from 'react';
import { Trophy, TrendingUp, Target, Clock, Calendar, Zap, AlertTriangle, Crosshair, Star } from 'lucide-react';

export function AnalyticsDashboard({ data }: { data?: any }) {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/v1/reasoning/analytics");
        const json = await res.json();
        if (json.success) setStats(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#121212] p-6 rounded-2xl border border-[#2a2a2a] text-white flex justify-center py-20">
        <span className="text-zinc-500 animate-pulse">Initializing Mission Control...</span>
      </div>
    );
  }

  const accuracy = stats?.stats?.accuracy ? Math.round(stats.stats.accuracy) : 0;
  const attempted = stats?.stats?.totalAttempted || 0;
  const mastered = stats?.mastery?.filter((m: any) => m.mastery_score >= 80).length || 0;
  
  // Placeholder metrics for new Mission Dashboard features (requires gamification API integration)
  const dailyXP = Math.round(attempted * 5.5 + mastered * 50);
  const streak = stats?.streak || Math.max(1, Math.floor(attempted / 20));

  return (
    <div className="bg-[#121212] p-6 lg:p-8 rounded-3xl border border-[#2a2a2a] text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
            <h2 className="text-2xl font-bold tracking-tight">Mission Command Center</h2>
          </div>
          <p className="text-zinc-400 text-sm">Your intelligent learning trajectory and daily objectives.</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
          <div className="flex flex-col items-center px-4 border-r border-zinc-800">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Streak</span>
            <div className="flex items-center gap-1.5 text-orange-400 font-bold text-lg">
              <Zap className="w-4 h-4 fill-orange-400" /> {streak} Days
            </div>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Daily XP</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-lg">
              <Star className="w-4 h-4 fill-emerald-400" /> {dailyXP} XP
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-10">
        {/* Today's Mission */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Today's Mission
            </h3>
            <p className="text-zinc-400 text-sm mb-4">Complete 3 practice sessions with &gt;80% accuracy to earn the Daily Scholar badge.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Practice Completion</span>
              <span className="text-emerald-400 font-bold">1 / 3</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '33%' }} />
            </div>
          </div>
        </div>

        {/* Weekly Revision */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-orange-500/20 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Smart Revision Queue
            </h3>
            <p className="text-zinc-400 text-sm mb-4">Knowledge decay detected in 2 topics. Review now to prevent retention loss.</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-orange-500/10 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-500/20">Percentages</span>
            <span className="bg-orange-500/10 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-500/20">Time & Work</span>
          </div>
        </div>

        {/* Core Metrics */}
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Accuracy</p>
            <p className="text-3xl font-extrabold mt-1 text-white">{accuracy}%</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Mastered</p>
            <p className="text-3xl font-extrabold mt-1 text-emerald-400">{mastered}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Attempted</p>
            <p className="text-xl font-bold mt-1 text-zinc-300">{attempted} Qs</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Est. Completion</p>
            <p className="text-xl font-bold mt-1 text-zinc-300">3 Weeks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-indigo-400" />
            Target Company Readiness
          </h3>
          <div className="space-y-5">
             {stats?.readiness && stats.readiness.length > 0 ? (
               stats.readiness.slice(0, 3).map((r: any) => (
                 <div key={r.company_id}>
                   <div className="flex justify-between items-center text-sm mb-2">
                      <span className="capitalize font-medium text-zinc-200">{r.company_id.replace('-', ' ')}</span>
                      <span className="text-indigo-400 font-bold">{Math.round(r.readiness_score)}% Ready</span>
                   </div>
                   <div className="w-full bg-zinc-800 rounded-full h-1.5">
                     <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1.5 rounded-full" style={{ width: `${Math.round(r.readiness_score)}%` }} />
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-6 text-zinc-500 italic text-sm">
                 <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                 Set a target company in your profile to track readiness.
               </div>
             )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-indigo-300">
            <Trophy className="w-5 h-5" />
            AI Coach Recommendation
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed mb-6">
            Based on your recent performance drop in <strong className="text-white">Quantitative Speed</strong>, I recommend switching to <strong className="text-white">Mental Math & Rapid Fire</strong> mode for your next 2 practice sessions before attempting the Module Assessment.
          </p>
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20">
            Start Recommended Session
          </button>
        </div>
      </div>
    </div>
  );
}
