import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Zap, BookOpen, ArrowRight, Activity, Clock, AlertTriangle } from "lucide-react";
import { getServerUserId, getUserTopicMastery } from "@/lib/api/reasoningV2";
import { KnowledgeGraphEngine } from "@/lib/learning/engines/KnowledgeGraphEngine";
import { cookies } from "next/headers";

async function getCompanyData(companyId: string) {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/reasoning/company/${companyId}`, { 
      cache: 'no-store',
      headers: {
        'Cookie': cookieStore.toString()
      }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    return null;
  }
}

export default async function ReasoningCompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = await getCompanyData(companyId);

  if (!company) {
    notFound();
  }

  const userId = await getServerUserId();
  const userMastery = await getUserTopicMastery(userId as string);

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row items-center gap-6 relative">
        <div className="w-32 h-32 relative bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-blue-500/10" />
          <Image src={company.logo_url} alt={company.name} width={96} height={96} className="object-contain relative z-10 drop-shadow-2xl" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {company.name} Preparation
            </h1>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-lg border border-blue-500/20">
              {company.tier} Tier
            </span>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl">
            {company.overview?.description || `Master the exact logical reasoning patterns and high-frequency questions asked in ${company.name} placement assessments.`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <div className="text-zinc-400 text-sm font-medium mb-1">Target Cutoff</div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              {company.overview?.cutoff || '70%'}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <div className="text-zinc-400 text-sm font-medium mb-1">Test Duration</div>
            <div className="text-2xl font-bold text-white">
              {company.test_pattern?.duration || '90 mins'}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <div className="text-zinc-400 text-sm font-medium mb-1">Eligibility</div>
            <div className="text-xl font-bold text-white">
              {company.eligibility?.cgpa || '6.0+ CGPA'}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <div className="text-zinc-400 text-sm font-medium mb-1">Total Questions</div>
            <div className="text-2xl font-bold text-white">
              {company.sections?.reduce((sum: number, s: any) => sum + s.num_questions, 0) || '60+'}
            </div>
          </div>
        </div>

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

              // Calculate star rating (1 to 5) based on relative weight
              let stars = "★";
              if (weight >= 20) stars = "★★★★★";
              else if (weight >= 15) stars = "★★★★";
              else if (weight >= 10) stars = "★★★";
              else if (weight >= 5) stars = "★★";

              return (
                <Link key={topic} href={linkHref} className="block p-5 bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-xl transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-white group-hover:text-purple-400 transition-colors flex items-center">
                      <span className="text-yellow-500 mr-2 text-lg">{stars}</span>
                      {topic}
                    </span>
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/20 shrink-0">
                      {weight > 0 ? `${weight}% Weight` : 'Core Topic'}
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
