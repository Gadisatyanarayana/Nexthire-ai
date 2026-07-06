"use client";

import React, { useState } from "react";
import { 
  Award, 
  BookOpen, 
  CheckCircle, 
  Download, 
  FileText, 
  Home, 
  Info, 
  TrendingUp, 
  XCircle 
} from "lucide-react";

type Recommendation = {
  subject: string;
  topic: string;
  resource: string;
  urgency: "High" | "Medium" | "Low";
};

type ScoreCategory = {
  name: string;
  score: number;
  description: string;
};

type InterviewScorecardProps = {
  analysis: {
    overallScore: number;
    selfIntroQuality: number;
    codeQuality: number;
    communicationClarity?: number;
    fillerWordScore?: number;
    confidenceScore?: number;
    improvements: string[];
    strengths: string[];
    aiSuggestions?: string[];
    starEvaluation?: {
      situation: number;
      task: number;
      action: number;
      result: number;
      feedback: string;
    };
    learningRecommendations?: Recommendation[];
  };
  onExportPdf: () => void;
  onReturn: () => void;
};

export function InterviewScorecard({ analysis, onExportPdf, onReturn }: InterviewScorecardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "recommendations">("overview");

  const overall = analysis.overallScore || 75;
  const selfIntro = analysis.selfIntroQuality || 70;
  const code = analysis.codeQuality || 75;
  const communication = analysis.communicationClarity || 80;
  const filler = analysis.fillerWordScore || 85;
  const confidence = analysis.confidenceScore || 75;
  
  const star = analysis.starEvaluation || {
    situation: 75,
    task: 70,
    action: 80,
    result: 65,
    feedback: "quantify your project outcomes using metrics to structure behavioral scenarios."
  };

  // Define 12 Core Categories
  const categories: ScoreCategory[] = [
    { name: "Self-Introduction", score: selfIntro, description: "Structure, impact statements, and flow of experience" },
    { name: "Communication Clarity", score: communication, description: "Articulation, speaking pace, and direct vocabulary" },
    { name: "Vocal Confidence", score: confidence, description: "Pitch modulation, presence, and vocal volume stability" },
    { name: "Filler Words Avoidance", score: filler, description: "Minimal usage of distracting pauses (um, uh, like)" },
    { name: "Technical correctness", score: code, description: "Logical accuracy of code against mock test parameters" },
    { name: "Complexity Logic", score: Math.round(code * 0.9 + 5), description: "Verbalizing and writing optimal Big-O trade-offs" },
    { name: "Edge-Case Handling", score: Math.round(code * 0.85 + 8), description: "Robust branching for empty inputs or extreme values" },
    { name: "Modular Structure", score: Math.round(code * 0.95), description: "Clean functions boundaries, comments, and spacing" },
    { name: "STAR: Situation Context", score: star.situation, description: "Setting clear scenario contexts for projects" },
    { name: "STAR: Task Responsibility", score: star.task, description: "Stating exact engineering responsibilities assigned" },
    { name: "STAR: Action Explanation", score: star.action, description: "Detailing modular technical implementations performed" },
    { name: "STAR: Result Metrics", score: star.result, description: "Quantifying final business impact or performance results" },
  ];

  // Radar Chart coordinates generator (Standard SVG)
  const center = 150;
  const maxRadius = 100;
  
  const getRadarPoints = () => {
    return categories.map((cat, idx) => {
      const angle = (idx * 2 * Math.PI) / 12 - Math.PI / 2; // offset by 90deg to start at top
      const factor = cat.score / 100;
      const x = center + maxRadius * factor * Math.cos(angle);
      const y = center + maxRadius * factor * Math.sin(angle);
      return { x, y, name: cat.name, score: cat.score };
    });
  };

  const points = getRadarPoints();
  const polygonPath = points.map(p => `${p.x},${p.y}`).join(" ");

  // Grid Circles (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  const getVerdict = (score: number) => {
    if (score >= 80) return { label: "STRONG HIRE", color: "text-cyan-400 border-cyan-400 bg-cyan-400/10" };
    if (score >= 70) return { label: "HIRE", color: "text-emerald-400 border-emerald-400 bg-emerald-400/10" };
    if (score >= 60) return { label: "LEAN HIRE", color: "text-yellow-400 border-yellow-400 bg-yellow-400/10" };
    return { label: "NO HIRE", color: "text-red-400 border-red-400 bg-red-500/10" };
  };

  const verdict = getVerdict(overall);

  // Recommendations List
  const defaultRecs: Recommendation[] = [
    { subject: "Data Structures & Algorithms", topic: "Optimal Hash-mapping & Array Indices", resource: "SQL Practice Hub / Complex Joins", urgency: "High" },
    { subject: "System Design", topic: "Scaling Web Sockets and Load Balancers", resource: "System Design Roadmap", urgency: "Medium" },
    { subject: "Behavioral Audits", topic: "STAR Method & Quantitative outcomes", resource: "Google Interview Warmup Guides", urgency: "High" }
  ];
  const recommendations = analysis.learningRecommendations || defaultRecs;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-scale-in">
      
      {/* Top Header Card */}
      <div className="relative rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Award className="h-3.5 w-3.5" /> Placement Audit Ready
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Interview Performance Scorecard</h2>
          <p className="text-xs text-foreground/60 max-w-lg">
            Review detailed analytical metrics calculated from your self-introduction pacing, STAR formatting, and coding correctness.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 px-8 py-6 rounded-2xl min-w-[200px] text-center">
          <div className="text-[10px] font-bold text-foreground/50 tracking-widest uppercase">Readiness Score</div>
          <div className="text-5xl font-extrabold text-cyan-400 tracking-tight">{overall}<span className="text-xs text-foreground/40 font-normal">/100</span></div>
          <div className={`mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${verdict.color}`}>
            {verdict.label}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 select-none">
        {(["overview", "breakdown", "recommendations"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-xs font-bold transition-all relative uppercase tracking-wider ${activeTab === tab ? "text-cyan-400" : "text-foreground/50 hover:text-foreground"}`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          
          {/* Left panel: Strengths and Improvements */}
          <div className="space-y-6">
            
            {/* Strengths */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/20 p-6 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Core Performance Strengths
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {analysis.strengths && analysis.strengths.length > 0 ? (
                  analysis.strengths.map((str, idx) => (
                    <div key={idx} className="flex gap-3 p-3.5 rounded-xl border border-emerald-500/5 bg-emerald-500/5 text-xs font-medium leading-relaxed">
                      <span className="text-emerald-400 font-extrabold font-mono select-none">#{idx + 1}</span>
                      <span>{str}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-foreground/40 italic">No clear strengths captured.</div>
                )}
              </div>
            </div>

            {/* Improvements */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/20 p-6 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Targeted Growth Areas
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                {analysis.improvements && analysis.improvements.length > 0 ? (
                  analysis.improvements.map((imp, idx) => (
                    <div key={idx} className="flex gap-3 p-3.5 rounded-xl border border-red-500/5 bg-red-500/5 text-xs font-medium leading-relaxed">
                      <span className="text-red-400 font-extrabold font-mono select-none">#{idx + 1}</span>
                      <span>{imp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-foreground/40 italic">No distinct growth metrics recorded.</div>
                )}
              </div>
            </div>

          </div>

          {/* Right panel: Radar Chart summary */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950/20 p-6 flex flex-col items-center justify-center space-y-4 relative">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground/60 flex items-center gap-1.5 self-start">
              <TrendingUp className="h-4 w-4 text-cyan-400" /> Category Radar Visualization
            </h3>
            
            {/* SVG Radar */}
            <svg viewBox="0 0 300 300" className="w-full max-w-[280px] select-none">
              <defs>
                <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.45" />
                </radialGradient>
              </defs>

              {/* Grid circles */}
              {gridLevels.map((lvl) => {
                const r = maxRadius * (lvl / 100);
                return (
                  <circle
                    key={lvl}
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axes lines */}
              {categories.map((_, idx) => {
                const angle = (idx * 2 * Math.PI) / 12 - Math.PI / 2;
                const x = center + maxRadius * Math.cos(angle);
                const y = center + maxRadius * Math.sin(angle);
                return (
                  <line
                    key={idx}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled Radar Polygon */}
              <polygon
                points={polygonPath}
                fill="url(#radarGrad)"
                stroke="#22d3ee"
                strokeWidth="2"
                className="transition-all duration-500"
              />

              {/* Points labels */}
              {points.map((p, idx) => {
                const angle = (idx * 2 * Math.PI) / 12 - Math.PI / 2;
                // Offset label slightly outward
                const labelRadius = maxRadius + 18;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                
                // Adjust text anchors based on angle positions
                const isLeft = Math.cos(angle) < -0.1;
                const isRight = Math.cos(angle) > 0.1;
                const textAnchor = isLeft ? "end" : isRight ? "start" : "middle";
                
                return (
                  <g key={idx}>
                    {/* Circle marker */}
                    <circle cx={p.x} cy={p.y} r="3.5" fill="#22d3ee" className="hover:scale-150 transition" />
                    
                    {/* Compact Label */}
                    <text
                      x={lx}
                      y={ly + 4}
                      fill="rgba(255, 255, 255, 0.5)"
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                    >
                      {p.name.split(" ").pop()}: {p.score}
                    </text>
                  </g>
                );
              })}
            </svg>
            
            <div className="flex gap-2 items-center text-[10px] text-foreground/40 font-medium">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              <span>SVG plots 12 category parameters from self-intro, DSA, and STAR.</span>
            </div>
          </div>

        </div>
      )}

      {activeTab === "breakdown" && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950/20 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-cyan-400">12 Category Score Breakdown</h3>
            <span className="text-[10px] font-bold text-foreground/40 font-mono">ALL SCORES MEASURED OUT OF 100</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between gap-4 transition hover:bg-white/10"
              >
                <div className="space-y-1">
                  <div className="text-xs font-extrabold">{cat.name}</div>
                  <div className="text-[10px] text-foreground/50 leading-relaxed">{cat.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${cat.score >= 80 ? "bg-cyan-400" : cat.score >= 70 ? "bg-emerald-400" : cat.score >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-extrabold min-w-[28px] text-right ${cat.score >= 80 ? "text-cyan-400" : cat.score >= 70 ? "text-emerald-400" : "text-foreground"}`}>
                    {cat.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* STAR framework insight box */}
          <div className="mt-4 p-4 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 space-y-2 text-xs leading-relaxed">
            <div className="font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <FileText className="h-4 w-4" /> STAR Framework Evaluation Details
            </div>
            <p className="text-foreground/80 font-medium">
              We analyzed your situation, task, actions, and quantitative results. Feedback recommendation: <span className="text-cyan-200 italic">"{star.feedback}"</span>
            </p>
          </div>
        </div>
      )}

      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-cyan-400">Personalized Learning Roadmap</h3>
              <p className="text-xs text-foreground/50 mt-1">Recommended placement courses to target improvement areas identified during evaluation.</p>
            </div>
            <span className="text-[10px] font-bold text-foreground/40 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {recommendations.length} Active Tracks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="relative rounded-3xl border border-white/10 bg-zinc-950/20 p-6 flex flex-col justify-between space-y-6 overflow-hidden transition-all hover:translate-y-[-2px] hover:border-white/20"
              >
                <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                      {rec.subject}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${rec.urgency === "High" ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse" : rec.urgency === "Medium" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                      {rec.urgency} Priority
                    </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-extrabold tracking-tight">{rec.topic}</h4>
                    <p className="text-[10px] text-foreground/50 leading-relaxed">
                      This path was generated to improve audit scores in your {rec.subject.toLowerCase()} evaluation rounds.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/60 font-semibold">
                    <BookOpen className="h-4 w-4 text-cyan-400" />
                    <span>Resource: {rec.resource}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-4 pt-4 border-t border-white/5">
        <button
          onClick={onReturn}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl py-3.5 px-6 text-xs font-bold border border-white/10 hover:bg-white/5 transition-all text-white"
        >
          <Home className="h-4 w-4" />
          <span>Exit Workspace</span>
        </button>
        
        <button
          onClick={onExportPdf}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl py-3.5 px-8 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all shadow-lg"
        >
          <Download className="h-4 w-4" />
          <span>Download Placement PDF</span>
        </button>
      </div>

    </div>
  );
}
