'use client';
import React from 'react';

export default function ContestHub() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contests & Challenges</h1>
          <p className="mt-2 text-gray-500 text-lg">Compete globally, climb the leaderboards, and win badges.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-xl font-bold text-gray-900 leading-none">1,452</p>
              <p className="text-xs font-semibold text-gray-500 uppercase mt-1">Global Rank</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active & Upcoming Contests */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Live & Upcoming</h2>
          
          <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse flex items-center gap-2 w-max mb-3">
                    <span className="w-2 h-2 bg-white rounded-full"></span> LIVE NOW
                  </span>
                  <h3 className="text-2xl font-bold">Weekly Coding Challenge #45</h3>
                  <p className="text-indigo-200 mt-1">Sponsored by TCS Digital</p>
                </div>
                <div className="text-right bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider mb-1">Ends In</p>
                  <p className="text-2xl font-mono font-bold text-white">01:45:22</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span>👥</span> 4,521 Participants
                </div>
                <div className="flex items-center gap-2">
                  <span>💻</span> 4 Questions
                </div>
              </div>
              <button className="mt-6 w-full py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
                Enter Contest Arena
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex justify-between items-center hover:border-indigo-300 transition-all cursor-pointer">
            <div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">UPCOMING</span>
              <h3 className="text-lg font-bold text-gray-900">Bi-Weekly System Design Mock</h3>
              <p className="text-sm text-gray-500 mt-1">Starts Sunday at 10:00 AM IST</p>
            </div>
            <button className="px-5 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Notify Me</button>
          </div>
        </div>

        {/* Global Leaderboard Snapshot */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Top Rankers</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500">Weekly Leaderboard</span>
              <span className="text-indigo-600 text-sm font-semibold cursor-pointer">View All</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { rank: 1, name: "Rahul S.", score: 4500, avatar: "bg-yellow-100 text-yellow-700" },
                { rank: 2, name: "Priya M.", score: 4320, avatar: "bg-gray-100 text-gray-700" },
                { rank: 3, name: "Amit K.", score: 4100, avatar: "bg-orange-100 text-orange-700" },
                { rank: 4, name: "You", score: 2850, avatar: "bg-indigo-100 text-indigo-700", isYou: true },
              ].map(user => (
                <div key={user.name} className={`p-4 flex items-center justify-between ${user.isYou ? 'bg-indigo-50/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-4">{user.rank}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>
                      {user.name.charAt(0)}
                    </div>
                    <span className={`font-medium ${user.isYou ? 'text-indigo-900' : 'text-gray-900'}`}>{user.name}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-600">{user.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
