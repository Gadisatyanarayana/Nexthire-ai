import React from "react";

export function LessonProgress({ completed, total }: { completed: number, total: number }) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-400">Module Progress</span>
        <span className="text-white font-medium">{percentage}% ({completed}/{total})</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
