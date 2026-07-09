import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, Target, BookOpen, Clock, Activity } from "lucide-react";

export const revalidate = 0; // Dynamic because it fetches user readiness

export default async function CompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  let company: any = null;
  let readiness: any = null;

  try {
    const [cRes, rRes] = await Promise.all([
      fetch(`${protocol}://${host}/api/v1/aptitude/company/${companyId}`),
      fetch(`${protocol}://${host}/api/v1/aptitude/company-readiness?company_id=${companyId}`, {
        headers: { cookie: headersList.get("cookie") || "" }
      })
    ]);
    
    const cData = await cRes.json();
    if (cData.success) company = cData.data;

    const rData = await rRes.json();
    if (rData.success) readiness = rData.data;
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
            {company.sections.map((sec: any, i: number) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex justify-between items-center">
                <span className="font-semibold text-lg">{sec.name}</span>
                <div className="text-right">
                  <div className="text-sm text-zinc-300">{sec.num_questions} Questions</div>
                  <div className="text-xs text-zinc-500 flex items-center justify-end gap-1"><Clock className="w-3 h-3"/> {sec.duration_minutes} mins</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Topic Weightage */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            High Weightage Topics
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(company.topic_weightage).map(([topic, weight]: any) => (
              <div key={topic} className="px-4 py-2 bg-zinc-800 rounded-full text-sm font-medium border border-zinc-700">
                {topic} <span className="text-emerald-400 ml-1">{weight}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
