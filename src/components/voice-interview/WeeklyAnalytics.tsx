"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart2, Star, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

type SnapshotItem = {
  date: string;
  score: number;
};

type WeeklyAnalyticsProps = {
  snapshotData: SnapshotItem[];
  averageScore: number;
  readinessScore: number;
  strengths: string[];
  weaknesses: string[];
  categoryAverages: Record<string, number>;
};

export function WeeklyAnalytics({
  snapshotData,
  averageScore,
  readinessScore,
  strengths,
  weaknesses,
  categoryAverages,
}: WeeklyAnalyticsProps) {
  // Format snapshot dates for chart
  const chartData = snapshotData.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  const getScoreDescription = (score: number) => {
    if (score >= 90) return "Excellent - Placement Ready!";
    if (score >= 75) return "Strong candidate - minimal review";
    if (score >= 50) return "Needs preparation - review mock coaching";
    return "Crucial review required";
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 55) return "text-amber-400 border-amber-500/20 bg-amber-500/5";
    return "text-red-400 border-red-500/20 bg-red-500/5";
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Readiness Index */}
        <div className={`p-6 rounded-3xl border ${getReadinessColor(readinessScore)} backdrop-blur-xl shadow-xl flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">Placement Readiness Index</span>
            <div className="text-4xl font-black mt-2">{readinessScore}%</div>
          </div>
          <div className="text-[11px] opacity-80 leading-snug pt-4 border-t border-white/5 mt-4">
            {getScoreDescription(readinessScore)}
          </div>
        </div>

        {/* Average Score */}
        <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-extrabold">Average Session Score</span>
            <div className="text-4xl font-black mt-2">{averageScore}/100</div>
          </div>
          <div className="text-[11px] text-foreground/60 leading-snug pt-4 border-t border-white/5 mt-4">
            A computed average score of your mock placement submissions.
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">Evaluated Sessions</span>
            <div className="text-4xl font-black mt-2">{snapshotData.length} Mocks</div>
          </div>
          <div className="text-[11px] text-foreground/60 leading-snug pt-4 border-t border-white/5 mt-4">
            Historical evaluations available in database context.
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="h-5 w-5 text-cyan-400" />
          <h4 className="text-base font-bold text-white">Vocal Score Trends</h4>
        </div>

        <div className="h-[250px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-foreground/40">
              Complete evaluations to view trend reports.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#ffffff50"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff50"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#ffffff10",
                    borderRadius: "16px",
                  }}
                  itemStyle={{ color: "#22d3ee", fontSize: "11px" }}
                  labelStyle={{ color: "#ffffff", fontSize: "11px" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#scoreColor)"
                  name="Evaluator Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Analysis Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Ratings */}
        <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Category Averages</span>
          </h4>

          {Object.keys(categoryAverages).length === 0 ? (
            <div className="text-center py-8 text-xs text-foreground/40">
              No categories evaluated yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {Object.entries(categoryAverages).map(([category, rating]) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-foreground/80">
                    <span className="capitalize">{category.replace(/_/g, " ")}</span>
                    <span className="text-cyan-400">{Math.round(rating)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-500"
                      style={{ width: `${rating}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="p-6 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl space-y-6">
          {/* Strengths */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Identified Key Strengths</span>
            </h4>
            {strengths.length === 0 ? (
              <p className="text-xs text-foreground/40">Evaluation in progress to identify strengths.</p>
            ) : (
              <ul className="space-y-2">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs text-foreground/80">
                    <Star className="h-3.5 w-3.5 text-cyan-400 fill-current shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Weaknesses */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Recommended Improvement Areas</span>
            </h4>
            {weaknesses.length === 0 ? (
              <p className="text-xs text-foreground/40">Evaluation in progress to identify suggestions.</p>
            ) : (
              <ul className="space-y-2">
                {weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs text-foreground/80">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
