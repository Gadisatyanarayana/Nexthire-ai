"use client";
import React from 'react';

export default function MockInterviewDashboard() {
  return (
    <div className="p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800 text-white">
      <h2 className="text-2xl font-bold mb-4">Mock Interview Dashboard</h2>
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-slate-700 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
