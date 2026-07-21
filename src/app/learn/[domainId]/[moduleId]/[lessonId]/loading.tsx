import { Loader2 } from "lucide-react";

export default function LessonLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Loading Lesson Content...</h2>
      <p className="text-zinc-500 text-sm">Preparing interactive workspace</p>
    </div>
  );
}
