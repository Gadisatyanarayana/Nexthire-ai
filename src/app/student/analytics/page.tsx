'use client';
import React from 'react';

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Progress</h1>
        <p className="mt-2 text-gray-500 text-lg">Track your learning velocity, accuracy, and company readiness.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Accuracy", value: "78%", trend: "+2.4%", positive: true },
          { label: "Questions Solved", value: "482", trend: "+45 this week", positive: true },
          { label: "Average Solve Time", value: "1m 45s", trend: "-12s", positive: true },
          { label: "Current Streak", value: "12 Days", trend: "Personal Best: 14", positive: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm font-medium text-gray-500 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <p className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
              {stat.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Heatmap (LeetCode style) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Activity Map</h2>
          <div className="flex gap-1 overflow-x-auto pb-4">
            {/* Mocked Heatmap Grid */}
            {Array.from({ length: 52 }).map((_, col) => (
              <div key={col} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, row) => (
                  <div 
                    key={row} 
                    className={`w-3 h-3 rounded-sm ${Math.random() > 0.7 ? 'bg-indigo-500' : Math.random() > 0.4 ? 'bg-indigo-300' : 'bg-gray-100'}`} 
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end items-center gap-2 text-xs text-gray-500 mt-2">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-300"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-500"></div>
            <span>More</span>
          </div>
        </div>

        {/* Company Readiness */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Company Readiness</h2>
          <div className="space-y-6">
            {[
              { name: 'TCS NQT', score: 85, color: 'bg-emerald-500' },
              { name: 'Infosys', score: 62, color: 'bg-yellow-500' },
              { name: 'Accenture', score: 40, color: 'bg-rose-500' }
            ].map(company => (
              <div key={company.name}>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-gray-900">{company.name}</span>
                  <span className={company.score >= 80 ? 'text-emerald-600' : company.score >= 50 ? 'text-yellow-600' : 'text-rose-600'}>{company.score}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${company.color} rounded-full`} style={{ width: `${company.score}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak & Strong Topics */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-emerald-600">Strongest Topics</h2>
          <ul className="space-y-3">
            <li className="flex justify-between text-sm"><span className="text-gray-700">Percentages</span><span className="font-semibold text-gray-900">92% Acc</span></li>
            <li className="flex justify-between text-sm"><span className="text-gray-700">Blood Relations</span><span className="font-semibold text-gray-900">88% Acc</span></li>
            <li className="flex justify-between text-sm"><span className="text-gray-700">Syllogisms</span><span className="font-semibold text-gray-900">85% Acc</span></li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-rose-600">Needs Attention</h2>
          <ul className="space-y-3">
            <li className="flex justify-between text-sm"><span className="text-gray-700">Probability</span><span className="font-semibold text-gray-900">42% Acc</span></li>
            <li className="flex justify-between text-sm"><span className="text-gray-700">Permutations</span><span className="font-semibold text-gray-900">45% Acc</span></li>
            <li className="flex justify-between text-sm"><span className="text-gray-700">Data Sufficiency</span><span className="font-semibold text-gray-900">51% Acc</span></li>
          </ul>
          <button className="w-full mt-6 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
            Generate Weak Topic Quiz
          </button>
        </div>
        
        {/* Bloom Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cognitive Mastery (Bloom's)</h2>
          <div className="flex h-32 items-end gap-2 mt-8">
            {/* Mocked Bar Chart */}
            {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((level, idx) => {
              const height = [80, 95, 60, 40, 20, 5][idx];
              return (
                <div key={level} className="flex-1 flex flex-col justify-end items-center group relative">
                  <div className="w-full bg-indigo-200 rounded-t-md hover:bg-indigo-400 transition-colors" style={{ height: `${height}%` }}></div>
                  <span className="text-[10px] text-gray-500 mt-2 rotate-45 origin-left truncate w-12">{level}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
