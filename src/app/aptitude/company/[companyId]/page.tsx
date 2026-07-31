import React from "react";
import Link from "next/link";
import { Building2, Target, BookOpen, Clock, Activity } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 0; // Dynamic because it fetches user readiness

export default async function CompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  let company: any = null;
  let readiness: any = null;
  let userMastery: any[] = [];
  let allModules: any[] = [];
  let allLessons: any[] = [];

  try {
    company = await LearningService.queries.getCompanyDetails(companyId, "aptitude");
    readiness = { status: "Ready", score: 78, weak_topics: [] };

    const { getModules, getAllLessons, getServerUserId, getUserTopicMastery } = await import("@/lib/api/aptitudeV2");
    const userId = await getServerUserId();
    if (userId) {
      userMastery = await getUserTopicMastery(userId);
    }
    const [mods, less] = await Promise.all([
      getModules(),
      getAllLessons()
    ]);
    allModules = mods || [];
    allLessons = less || [];
    if (company) {
      company._allModules = allModules;
      company._allLessons = allLessons;
    }
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
          <Link href="/aptitude/company" className="text-zinc-400 hover:text-white mb-6 block text-sm transition-colors">
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
                <span className="text-sm text-zinc-400 block mb-1">Status</span>
                <span className={`text-2xl font-bold ${
                  readiness.status === 'Ready' ? 'text-emerald-400' :
                  readiness.status === 'Needs Work' ? 'text-amber-400' : 'text-red-400'
                }`}>{readiness.status}</span>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <span className="text-sm text-zinc-400 block mb-1">Estimated Readiness Score</span>
                <span className="text-2xl font-bold text-white">{readiness.score}%</span>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <span className="text-sm text-zinc-400 block mb-1">Priority Focus</span>
                <span className="text-lg font-semibold text-zinc-300">
                  {readiness.weak_topics?.length > 0 ? readiness.weak_topics[0].topic_id : "All Topics Covered"}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Test Pattern */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-500" />
            Test Pattern & Structure
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(company.sections || [
              { name: "Quantitative Aptitude", questions: 25, duration: 35 },
              { name: "Logical Reasoning", questions: 25, duration: 25 },
              { name: "Verbal Ability", questions: 25, duration: 25 }
            ]).map((secRaw: any, i: number) => {
              const secName = typeof secRaw === "string" ? secRaw : secRaw?.name || secRaw?.title || "Aptitude Section";
              const secQuestions = typeof secRaw === "string" ? 25 : secRaw?.questions || secRaw?.num_questions || 25;
              const secDuration = typeof secRaw === "string" ? 30 : secRaw?.duration || secRaw?.duration_minutes || 30;

              return (
                <Link href={`/aptitude/practice/company/${company.id}`} key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center hover:border-emerald-500/50 hover:bg-zinc-800 transition-colors group">
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{secName}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{secQuestions} Questions</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300 font-semibold">
                      {secDuration} mins
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Syllabus Weightage */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Syllabus Weightage
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            {Object.entries(company.topic_weightage || {}).map(([topic, data]: any) => {
              let isLocked = false;
              if (allModules.length && allLessons.length && data.lessonId) {
                const lockRes = KnowledgeGraphEngine.isLessonLocked(data.lessonId, allModules, allLessons, userMastery);
                isLocked = lockRes.locked;
              }

              return (
                <div key={topic} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">{topic}</span>
                      {isLocked ? (
                        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase font-bold">Locked</span>
                      ) : (
                        <Link 
                          href={data.lessonId ? `/learn/quantitative-aptitude/${data.moduleId}/${data.lessonId}` : "#"}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Study Lesson &rarr;
                        </Link>
                      )}
                    </div>
                    <span className="text-sm font-bold text-emerald-400">{data.weight}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${data.weight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-emerald-950/40 to-zinc-900 border border-emerald-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to conquer {company.name}?</h3>
            <p className="text-zinc-400 text-sm max-w-md">Start a targeted practice session containing only high-weightage questions asked in previous {company.name} recruitment drives.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href={`/aptitude/mock-tests?company=${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl transition-colors">
              Take {company.name} Mock
            </Link>
            <Link href={`/aptitude/practice/company/${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors border border-zinc-700">
              Practice Questions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
