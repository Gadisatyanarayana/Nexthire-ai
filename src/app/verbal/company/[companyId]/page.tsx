import React from "react";
import Link from "next/link";
import { Building2, Target, BookOpen, Clock } from "lucide-react";
import { LearningService } from "@/lib/learning/services/LearningService";
const { KnowledgeGraphEngine } = LearningService;

export const revalidate = 0;

export default async function VerbalCompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;

  let company: any = null;
  let readiness: any = { status: "Ready", score: 82, weak_topics: [] };
  let allModules: any[] = [];
  let allLessons: any[] = [];

  try {
    company = await LearningService.queries.getCompanyDetails(companyId, "verbal");
    allModules = await LearningService.queries.getModules("verbal-ability");
    allLessons = await LearningService.queries.getAllLessons("verbal-ability");
  } catch (e) {
    console.error(e);
  }

  if (!company) {
    return <div className="p-8 text-center text-white">Company not found.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-4 py-12 md:px-8">
          <Link href="/verbal/company" className="text-zinc-400 hover:text-white mb-6 block text-sm transition-colors">
            &larr; Back to Companies
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold">{company.name}</h1>
              <p className="text-zinc-400 mt-1">Verbal Ability Placement Roadmap</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-12">
        {readiness && (
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-500" />
              Your Verbal Readiness
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <span className="text-sm text-zinc-400 block mb-1">Status</span>
                <span className="text-2xl font-bold text-emerald-400">{readiness.status}</span>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <span className="text-sm text-zinc-400 block mb-1">Estimated Readiness Score</span>
                <span className="text-2xl font-bold text-white">{readiness.score}%</span>
              </div>
              <div className="p-6 bg-zinc-800/50 rounded-xl text-center">
                <span className="text-sm text-zinc-400 block mb-1">Priority Focus</span>
                <span className="text-lg font-semibold text-zinc-300">
                  Reading Comprehension
                </span>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            Verbal Test Pattern & Structure
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: "Grammar & Sentence Correction", questions: 15, duration: 15 },
              { name: "Reading Comprehension", questions: 15, duration: 20 },
              { name: "Vocabulary & Synonyms", questions: 10, duration: 10 }
            ].map((sec: any, i: number) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center hover:border-indigo-500/50 transition-colors">
                <div>
                  <h3 className="font-bold text-white text-lg">{sec.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{sec.questions} Questions</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-zinc-800 rounded-lg text-sm text-zinc-300 font-semibold">
                    {sec.duration} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Syllabus Weightage
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            {Object.entries(company.topic_weightage || {
              "Reading Comprehension": { weight: 35, moduleId: "mod-rc", lessonId: "rc-fact-based" },
              "Grammar & Sentence Correction": { weight: 30, moduleId: "mod-grammar", lessonId: "subject-verb-agreement" },
              "Vocabulary & Synonyms": { weight: 20, moduleId: "mod-vocab", lessonId: "synonyms-antonyms" },
              "Para Jumbles": { weight: 15, moduleId: "mod-logic", lessonId: "para-jumbles" }
            }).map(([topic, data]: any) => {
              const weight = typeof data === 'object' ? (data.weight || 20) : (typeof data === 'number' ? data : 20);
              const lessonId = typeof data === 'object' ? data.lessonId : null;
              const moduleId = typeof data === 'object' ? data.moduleId : null;
              const linkHref = lessonId && moduleId 
                ? `/learn/verbal-ability/${moduleId}/${lessonId}` 
                : `/verbal?search=${encodeURIComponent(topic)}`;

              return (
                <div key={topic} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">{topic}</span>
                      <Link 
                        href={linkHref}
                        className="text-xs text-indigo-400 hover:underline font-medium flex items-center gap-1"
                      >
                        Study Lesson &rarr;
                      </Link>
                    </div>
                    <span className="text-sm font-bold text-indigo-400">{weight}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${weight}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-gradient-to-r from-indigo-950/40 to-zinc-900 border border-indigo-500/30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to conquer {company.name} Verbal Ability?</h3>
            <p className="text-zinc-400 text-sm max-w-md">Start a targeted practice session containing only high-weightage verbal questions asked in previous {company.name} recruitment drives.</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Link href={`/verbal/mock-tests?company=${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors">
              Take {company.name} Mock
            </Link>
            <Link href={`/verbal/practice/company/${company.id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors border border-zinc-700">
              Practice Questions
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
