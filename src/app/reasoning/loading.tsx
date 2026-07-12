import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-white">Loading Logical Reasoning Hub...</h2>
      <p className="text-zinc-500 mt-2">Fetching your personalized curriculum</p>
    </div>
  );
}
