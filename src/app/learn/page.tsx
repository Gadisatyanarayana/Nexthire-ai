"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Activity, Loader2 } from "lucide-react";
import ContinueLearningWidget from "@/components/learning/dashboard/ContinueLearningWidget";
import StreaksAndGoals from "@/components/learning/dashboard/StreaksAndGoals";
import ActivityFeed from "@/components/learning/dashboard/ActivityFeed";
import CourseCatalog from "@/components/learning/dashboard/CourseCatalog";
import { useSession } from "next-auth/react";

export default function LearningWorkspacePage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/learning/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error("Failed to load learning workspace", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [status]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-emerald-500" />
              Learning Workspace
            </h1>
            <p className="mt-3 text-lg text-zinc-400 max-w-2xl">
              Your personalized home for mastering essential technical skills.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-6 py-3 text-sm font-semibold transition flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Performance Intelligence
            </Link>
          </div>
        </header>

        {/* Top Section: Continue Learning & Streaks */}
        <div className="space-y-8">
          <section>
            <ContinueLearningWidget recommendationPayload={data?.continueLearning} />
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Today's Progress</h2>
            <StreaksAndGoals progress={data?.todayProgress} />
          </section>
        </div>

        {/* Middle Section: Catalog & Activity */}
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              Course Catalog
            </h2>
            <CourseCatalog />
          </section>

          <aside className="space-y-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
            <ActivityFeed events={data?.recentActivity || []} />
            
            <div className="bg-gradient-to-b from-zinc-900/50 to-zinc-900/20 border border-zinc-800 rounded-xl p-6 mt-8">
              <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
              <div className="space-y-3 mt-4">
                <Link href="/coding" className="block w-full text-center py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition">
                  Practice Coding
                </Link>
                <Link href="/contests" className="block w-full text-center py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium transition">
                  Take an Assessment
                </Link>
              </div>
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
