import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, AlertTriangle } from "lucide-react";

export async function WeakTopicsList({ userId }: { userId: string }) {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  let weakTopics: any[] = [];
  try {
    const res = await fetch(`${protocol}://${host}/api/v1/reasoning/weak-topics`, {
      headers: { cookie: headersList.get("cookie") || "" },
      cache: "no-store"
    });
    const data = await res.json();
    if (data.success) weakTopics = data.data;
  } catch (error) {
    console.error(error);
  }

  if (weakTopics.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        No weak topics identified yet. Keep practicing!
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2 flex-1">
      {weakTopics.slice(0, 3).map((wt) => (
        <Link 
          key={wt.topic_id} 
          href={`/reasoning/learn/${wt.module_id}/${wt.topic_id}?tab=practice`}
          className="block p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white truncate mr-4">
              {wt.lesson_title || "Unknown Lesson"}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-orange-400">
                {Math.round(wt.mastery_score)}%
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
            </div>
          </div>
        </Link>
      ))}
      {weakTopics.length > 3 && (
        <div className="text-xs text-center text-zinc-500 pt-2">
          +{weakTopics.length - 3} more weak topics
        </div>
      )}
    </div>
  );
}
