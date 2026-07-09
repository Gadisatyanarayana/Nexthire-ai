"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
      <p className="text-zinc-400 mb-6 max-w-md text-center">
        We encountered an error loading the Aptitude curriculum. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
