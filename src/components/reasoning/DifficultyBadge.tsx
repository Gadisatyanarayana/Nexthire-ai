import React from "react";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const getStyle = () => {
    switch (difficulty.toLowerCase()) {
      case "easy":
      case "beginner":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "medium":
      case "intermediate":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "hard":
      case "advanced":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-zinc-800 text-zinc-300 border border-zinc-700";
    }
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${getStyle()}`}>
      {difficulty}
    </span>
  );
}
