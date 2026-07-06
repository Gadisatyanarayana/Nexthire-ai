"use client";

import React, { useState } from "react";
import { Filter, Play, Trash2, RotateCcw, Calendar, ChevronRight, Award } from "lucide-react";
import { InterviewReplay, ReplayMessage } from "./InterviewReplay";

export type HistoryItem = {
  id: string;
  session_id: string;
  interview_type: string;
  company_mode: string;
  persona: string;
  difficulty: string;
  duration_seconds: number;
  questions_count: number;
  overall_score: number;
  category_scores: Record<string, number>;
  transcript: ReplayMessage[];
  feedback?: { overall_summary?: string; text?: string; summary?: string } | string;
  created_at: string;
};

type InterviewHistoryProps = {
  history: HistoryItem[];
  onDelete: (id: string) => Promise<void>;
  onRetake: (item: HistoryItem) => void;
};

export function InterviewHistory({ history, onDelete, onRetake }: InterviewHistoryProps) {
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterTrack, setFilterTrack] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Replay modal state
  const [activeReplay, setActiveReplay] = useState<HistoryItem | null>(null);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy": return "border-emerald-500/20 text-emerald-400 bg-emerald-500/5";
      case "hard": return "border-red-500/20 text-red-400 bg-red-500/5";
      case "medium":
      default:
        return "border-amber-500/20 text-amber-400 bg-amber-500/5";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  const filteredHistory = history.filter((item) => {
    const diffMatch = filterDifficulty === "all" || item.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
    const trackMatch = filterTrack === "all" || item.interview_type.toLowerCase() === filterTrack.toLowerCase();
    const companyMatch = !searchTerm || (item.company_mode || "").toLowerCase().includes(searchTerm.toLowerCase());
    return diffMatch && trackMatch && companyMatch;
  });

  const handleDeleteConfirm = async (id: string) => {
    setDeletingId(null);
    await onDelete(id);
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Filter className="h-4 w-4 text-cyan-400" />
          <span>Filters</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search by Company */}
          <input
            type="text"
            placeholder="Search by company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-foreground/40 focus:border-cyan-500/40 focus:outline-none w-44"
          />

          {/* Difficulty filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Track Filter */}
          <select
            value={filterTrack}
            onChange={(e) => setFilterTrack(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:border-cyan-500/40 focus:outline-none"
          >
            <option value="all">All Tracks</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="hr">HR</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border border-white/5 bg-zinc-950/20 backdrop-blur-xl">
          <Calendar className="h-8 w-8 text-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-foreground/40">No completed placement mock sessions found matching filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const rawFeedback = item.feedback;
            let summaryString = "";
            if (rawFeedback) {
              if (typeof rawFeedback === "string") {
                summaryString = rawFeedback;
              } else if (rawFeedback.overall_summary) {
                summaryString = rawFeedback.overall_summary;
              } else if (rawFeedback.summary) {
                summaryString = rawFeedback.summary;
              } else if (rawFeedback.text) {
                summaryString = rawFeedback.text;
              }
            }

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl border border-white/10 bg-zinc-950/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all duration-300 group"
              >
                {/* Details column */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                      {item.company_mode ? `${item.company_mode} Placement` : "Voice Interview"}
                    </span>
                    <span className="text-[9px] text-foreground/40 font-bold">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </div>

                  <p className="text-[11px] text-foreground/60 leading-relaxed max-w-xl line-clamp-2">
                    {summaryString || "Interview evaluation details stored. Replay conversation and view recommended tracks below."}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-foreground/50 font-bold pt-1">
                    <span>Questions: {item.questions_count}</span>
                    <span>Duration: {formatDuration(item.duration_seconds)}</span>
                    <span>Track: {item.interview_type}</span>
                  </div>
                </div>

                {/* Score & Actions columns */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  {/* Score */}
                  <div className="text-center md:text-right min-w-[70px]">
                    <div className="text-[9px] text-foreground/40 font-bold uppercase tracking-wider">Score</div>
                    <div className={`text-2xl font-black ${getScoreColor(item.overall_score)}`}>
                      {item.overall_score}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveReplay(item)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-white transition-all flex items-center justify-center"
                      title="Replay Dialogue"
                    >
                      <Play className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => onRetake(item)}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-cyan-400 transition-all flex items-center justify-center"
                      title="Retake Interview"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    {deletingId === item.id ? (
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-1.5 rounded-2xl">
                        <button
                          onClick={() => handleDeleteConfirm(item.id)}
                          className="text-[9px] font-extrabold text-red-400 hover:text-red-300 px-2 py-1 rounded"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="text-[9px] font-bold text-foreground/60 hover:text-white px-2 py-1 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-500/10 text-foreground/40 hover:text-red-400 transition-all flex items-center justify-center"
                        title="Delete Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Embedded Replay Dialog */}
      {activeReplay && (
        <InterviewReplay
          isOpen={true}
          onClose={() => setActiveReplay(null)}
          title={activeReplay.company_mode ? `${activeReplay.company_mode} Placement Mock` : "Placement Mock Replay"}
          transcript={activeReplay.transcript}
          score={activeReplay.overall_score}
          feedback={
            typeof activeReplay.feedback === "string"
              ? activeReplay.feedback
              : activeReplay.feedback?.overall_summary || activeReplay.feedback?.summary || activeReplay.feedback?.text
          }
        />
      )}
    </div>
  );
}
