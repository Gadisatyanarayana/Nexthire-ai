import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, Target, BookOpen, Clock, Activity } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 0; // Dynamic because it fetches user readiness

export default async function CompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  let company: any = null;
  let readiness: any = null;
  let userMastery: any[] = [];

  try {
    const [cRes, rRes] = await Promise.all([
      fetch(`${protocol}://${host}/api/v1/reasoning/company/${companyId}`),
      fetch(`${protocol}://${host}/api/v1/reasoning/company-readiness?company_id=${companyId}`, {
        headers: { cookie: headersList.get("cookie") || "" }
      })
    ]);
    
    const cData = await cRes.json();
    if (cData.success) company = cData.data;

    const rData = await rRes.json();
    if (rData.success) readiness = rData.data;

    const { getModules, getAllLessons, getServerUserId, getUserTopicMastery } = await import("@/lib/api/reasoningV2");
    const userId = await getServerUserId();
    if (userId) {
      userMastery = await getUserTopicMastery(userId);
    }
    const [allModules, allLessons] = await Promise.all([
      getModules(),
      getAllLessons()
    ]);
    
    // Attach to a global ref or pass down so we can use it in the render loop without blocking
    company._allModules = allModules;
    company._allLessons = allLessons;
  } catch (e) {
    console.error(e);
  }

  if (!company) {
    return <div className="p-8 text-center text-white">Company not found.</div>;
  }


  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-12 md:px-8">
          <Link href="/reasoning/company" className="text-zinc-400 hover:text-white mb-6 block text-sm transition-colors">
            &larr; Back to Companies
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold">{company.name}</h1>
              <p className="text-zinc-400 mt-1">Placement Preparation Roadmap</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-12">
        {/* Readiness Meter */}
        {readiness && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Your Readiness
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <div className="text-4xl font-bold text-white mb-2">{readiness.readiness_percentage}%</div>
                <div className="text-sm text-zinc-400">Overall Readiness</div>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">{readiness.interview_probability}</div>
                <div className="text-sm text-zinc-400">Interview Probability</div>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <div className="text-4xl font-bold text-orange-400 mb-2">{readiness.estimated_cutoff}%</div>
                <div className="text-sm text-zinc-400">Estimated Cutoff</div>
              </div>
            </div>
          </section>
        )}

        {/* Hiring Pattern */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Exam Pattern
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(company.sections || []).map((sec: any, i: number) => (
              <Link href={`/reasoning/practice/company/${company.id}`} key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center hover:border-blue-500/50 hover:bg-zinc-800 transition-colors group">
                <span className="font-semibold text-lg group-hover:text-blue-400 transition-colors">{sec.name}</span>
                <div className="text-right">
                  <div className="text-sm text-zinc-300">{sec.num_questions} Questions</div>
                  <div className="text-xs text-zinc-500 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> {sec.duration_minutes} mins</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Topic Weightage */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            High Weightage Topics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(company.topic_weightage || {}).map(([topic, data]: any) => {
              const weight = typeof data === 'object' ? data.weight : data;
              
              // Real readiness logic
              let userTopicReadiness = 0;
              let isLocked = false;
              if (data.lessonId) {
                const masteryObj = userMastery.find(m => m.topic_id === data.lessonId);
                if (masteryObj) {
                  userTopicReadiness = masteryObj.mastery_score;
                }
                
                if (company._allModules && company._allLessons) {
                  const { locked } = KnowledgeGraphEngine.isLessonLocked(data.lessonId, company._allModules, company._allLessons, userMastery);
                  isLocked = locked;
                }
              }

              const linkHref = typeof data === 'object' && data.lessonId && data.moduleId 
                ? `/reasoning/learn/${data.moduleId}/${data.lessonId}` 
                : `/reasoning?search=${encodeURIComponent(topic)}`;

              if (isLocked) {
                return (
                  <div key={topic} className="block p-5 bg-zinc-900/50 border border-zinc-800/50 rounded-xl opacity-60 cursor-not-allowed">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-zinc-400">{topic}</span>
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1">
                        Locked
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-500">
                        <span>Complete earlier levels</span>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link key={topic} href={linkHref} className="block p-5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-xl transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors">{topic}</span>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20">
                      {weight > 0 ? `${weight}% Exam Weight` : 'Core Topic'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Your Mastery</span>
                      <span>{userTopicReadiness}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-zinc-500 to-purple-400 h-1.5 rounded-full" style={{ width: `${userTopicReadiness}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Action Panel */}
        <section className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-8 rounded-2xl border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to conquer {company.name}?</h3>
            <p className="text-zinc-400 text-sm max-w-md">Start a targeted practice session containing only high-weightage questions asked in previous {company.name} recruitment drives.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href={`/reasoning/mock-tests?company=${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors">
              Take {company.name} Mock
            </Link>
            <Link href={`/reasoning/practice/company/${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors border border-zinc-700">
              Practice Questions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
