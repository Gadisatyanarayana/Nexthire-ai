import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";

export async function RevisionList({ userId }: { userId: string }) {
  // Fetch from our internal API (using absolute URL since we are in RSC)
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  
  let revisions: any[] = [];
  try {
    const res = await fetch(`${protocol}://${host}/api/v1/reasoning/revision`, {
      headers: { cookie: headersList.get("cookie") || "" },
      cache: "no-store"
    });
    const data = await res.json();
    if (data.success) revisions = data.data;
  } catch (error) {
    console.error(error);
  }

  if (revisions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        No topics due for revision today!
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-2 flex-1">
      {revisions.slice(0, 3).map((rev) => (
        <Link 
          key={rev.topic_id} 
          href={`/reasoning/learn/${rev.reasoning_lessons?.module_id}/${rev.topic_id}?tab=practice`}
          className="block p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white truncate mr-4">
              {rev.reasoning_lessons?.title || "Unknown Lesson"}
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Overdue (Ease: {rev.ease_factor?.toFixed(1)})
          </div>
        </Link>
      ))}
      {revisions.length > 3 && (
        <div className="text-xs text-center text-zinc-500 pt-2">
          +{revisions.length - 3} more topics due
        </div>
      )}
    </div>
  );
}
