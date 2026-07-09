import React from "react";
import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <FileQuestion className="w-16 h-16 text-emerald-500 mb-6 opacity-80" />
      <h2 className="text-3xl font-bold text-white mb-4">Content Not Found</h2>
      <p className="text-zinc-400 mb-8 max-w-md text-center text-lg">
        The module, lesson, or formula you are looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/aptitude"
        className="px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-600 transition-colors"
      >
        Return to Aptitude Hub
      </Link>
    </div>
  );
}
