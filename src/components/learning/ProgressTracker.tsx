"use client";

import { useEffect, useRef, useState } from "react";
import { autoSaveProgressAction, markLessonCompleteAction } from "@/app/actions/progress";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProgressTracker({ lessonId, isCompleted }: { lessonId: string, isCompleted: boolean }) {
  const [activeTime, setActiveTime] = useState(0);
  const lastSaveTime = useRef(0);
  const router = useRouter();
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completed, setCompleted] = useState(isCompleted);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-save every 30 seconds of active time
    if (activeTime > 0 && activeTime % 30 === 0) {
      const timeInc = activeTime - lastSaveTime.current;
      lastSaveTime.current = activeTime;
      
      const scrollPos = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      
      autoSaveProgressAction(lessonId, { scroll: scrollPos }, timeInc).catch(console.error);
    }
  }, [activeTime, lessonId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const timeInc = activeTime - lastSaveTime.current;
      if (timeInc > 0) {
        const scrollPos = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        // Note: navigator.sendBeacon is better for unload, but Server Actions are easier for now.
        autoSaveProgressAction(lessonId, { scroll: scrollPos }, timeInc);
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeTime, lessonId]);

  const handleMarkComplete = async () => {
    if (completed) return;
    setMarkingComplete(true);
    
    // Optimistic UI Update
    setCompleted(true);
    
    const timeInc = activeTime - lastSaveTime.current;
    lastSaveTime.current = activeTime;
    
    try {
      const res = await markLessonCompleteAction(lessonId, timeInc);
      if (res.success) {
        router.refresh(); // Refresh RSC to show updated stats
      } else {
        setCompleted(false); // Revert on failure
      }
    } catch (e) {
      console.error(e);
      setCompleted(false); // Revert on error
    } finally {
      setMarkingComplete(false);
    }
  };

  if (completed) {
    return (
      <div className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 font-bold transition">
        Completed <CheckCircle className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button 
      onClick={handleMarkComplete}
      disabled={markingComplete}
      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition flex items-center justify-center gap-2 font-bold disabled:opacity-50"
    >
      {markingComplete ? "Saving..." : "Mark Complete"}
      <CheckCircle className="w-4 h-4" />
    </button>
  );
}
