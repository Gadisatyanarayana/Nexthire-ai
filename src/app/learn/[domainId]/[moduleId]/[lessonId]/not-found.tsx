import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function LessonNotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-zinc-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Lesson Not Found</h2>
      <p className="text-zinc-400 max-w-md text-center mb-8">
        The lesson you are looking for does not exist or has been moved. It may be part of an upcoming curriculum update.
      </p>
      <Link 
        href="/learn"
        className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black text-white px-6 py-3 text-sm font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Curriculum
      </Link>
    </div>
  );
}
