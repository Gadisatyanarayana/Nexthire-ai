import React from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle, AlertTriangle, Target } from "lucide-react";

type ActionType = {
  type: "lesson" | "revision" | "mock" | "assessment";
  targetId: string;
  title: string;
  reason: string;
  moduleId?: string;
};

export function ContinueLearningCard({ action }: { action: ActionType }) {
  let href = "#";
  let icon = <PlayCircle className="w-5 h-5" />;
  let label = "Continue";
  let colorClass = "emerald";

  if (action.type === "lesson") {
    href = action.moduleId ? `/aptitude/learn/${action.moduleId}/${action.targetId}` : `/aptitude/learn/${action.targetId}`; 
    label = "Resume Lesson";
  } else if (action.type === "revision") {
    href = `/aptitude/revision/${action.targetId}`;
    icon = <AlertTriangle className="w-5 h-5" />;
    label = "Start Revision";
    colorClass = "orange";
  } else if (action.type === "mock") {
    href = `/aptitude/mock-tests`;
    icon = <Target className="w-5 h-5" />;
    label = "Take Mock";
    colorClass = "indigo";
  }

  return (
    <div className={`bg-zinc-900/50 border border-${colorClass}-500/20 rounded-xl p-6 relative overflow-hidden group`}>
      <div className={`absolute inset-0 bg-gradient-to-br from-${colorClass}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-md bg-${colorClass}-500/10 text-${colorClass}-400 text-xs font-semibold uppercase tracking-wider`}>
              {action.type === "revision" ? "Revision Due" : "Continue Learning"}
            </span>
            <span className="text-zinc-400 text-sm">{action.reason}</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{action.title}</h3>
        </div>
        <Link 
          href={href}
          className={`flex items-center gap-2 bg-${colorClass}-500 hover:bg-${colorClass}-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors shrink-0 justify-center`}
        >
          {icon}
          {label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
