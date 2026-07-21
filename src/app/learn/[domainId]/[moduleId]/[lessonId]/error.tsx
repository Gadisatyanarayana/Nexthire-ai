'use client';

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Failed to load lesson</h2>
      <p className="text-zinc-400 max-w-md text-center mb-8">
        We encountered an error while trying to fetch the lesson content. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 text-sm font-semibold transition"
      >
        <RotateCcw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
