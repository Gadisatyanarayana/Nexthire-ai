"use client";

import React from "react";
import { Award, Zap, Trophy, Flame } from "lucide-react";

export type Badge = {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  iconName: string;
};

type GamificationPanelProps = {
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
};

export function GamificationPanel({ xp, level, streak, badges }: GamificationPanelProps) {
  const xpInCurrentLevel = xp % 500;
  const xpNeededForNextLevel = 500;
  const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* XP & Level Status Card */}
      <div className="md:col-span-2 p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">Skill Level</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-white mt-1">Level {level}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Trophy className="h-6 w-6" />
            </div>
          </div>

          <p className="text-xs text-foreground/60 leading-relaxed mb-6">
            Complete placement interviews to earn Experience Points (XP). Every 500 XP raises your evaluator rank.
          </p>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2 text-xs font-bold">
            <span className="text-foreground/80">{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
            <span className="text-cyan-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-foreground/40 mt-1 block">Total Earned: {xp} XP</span>
        </div>
      </div>

      {/* Streak Panel */}
      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl flex flex-col justify-between items-center text-center">
        <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
          <Flame className="h-8 w-8 fill-current" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground/60">Vocal Streak</h4>
          <div className="text-4xl font-black text-white my-1">{streak} Days</div>
          <p className="text-[10px] text-foreground/40 leading-relaxed max-w-[200px] mx-auto">
            Consecutive days answering voice placement queries. Keep it up!
          </p>
        </div>
        <div className="w-full mt-4 p-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] text-amber-400 font-bold">
          {streak > 0 ? "Streak is Active!" : "Start your streak today!"}
        </div>
      </div>

      {/* Badges Grid Card */}
      <div className="md:col-span-3 p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5 text-cyan-400" />
          <h4 className="text-base font-bold text-white">Earned Badges & Achievements</h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
          {badges.map((badge) => {
            const isUnlocked = !!badge.unlockedAt;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border flex flex-col items-center text-center justify-between transition-all duration-300 ${isUnlocked ? "bg-white/5 border-cyan-500/20 hover:border-cyan-500/40" : "bg-black/40 border-white/5 opacity-40"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-2.5 ${isUnlocked ? "bg-cyan-500/10 text-cyan-400" : "bg-white/5 text-foreground/40"}`}>
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">{badge.title}</h5>
                  <p className="text-[9px] text-foreground/50 leading-tight mt-1 line-clamp-2 h-6">{badge.description}</p>
                </div>
                {isUnlocked && (
                  <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full mt-2">
                    Unlocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
