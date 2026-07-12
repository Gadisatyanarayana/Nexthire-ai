'use client';

import React from 'react';
import { Medal, Trophy, Star } from 'lucide-react';

export function Leaderboard({ data = [] }: { data?: any[] }) {
  return (
    <div className="bg-[#121212] p-6 rounded-2xl border border-[#2a2a2a] text-white">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold">Global Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Leaderboard loading...</div>
        ) : (
          data.map((user, idx) => (
            <div key={user.user_id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : idx === 1 ? 'bg-gray-400/20 text-gray-300' : idx === 2 ? 'bg-amber-700/20 text-amber-500' : 'bg-[#222] text-gray-500'}`}>
                  {idx + 1}
                </div>
                <div>
                  <p className="font-semibold">{user.users?.name || 'Anonymous Learner'}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400" /> Lvl {user.current_level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-400">{user.xp_total.toLocaleString()} XP</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
