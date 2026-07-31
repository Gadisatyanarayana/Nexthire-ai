import React from "react";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { LearningQueryService } from "@/lib/learning/services/LearningQueryService";

export const revalidate = 3600;

export default async function VerbalCompanyGridPage() {
  let companies: any[] = [];
  try {
    const supabase = LearningQueryService.getRawClient();
    const { data } = await supabase.from("platform_companies").select("*").order("name");
    companies = data || [];
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        <header className="mb-12">
          <Link href="/verbal" className="text-zinc-400 hover:text-white mb-4 block text-sm transition-colors">
            &larr; Back to Verbal Ability Hub
          </Link>
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <Building2 className="w-10 h-10 text-indigo-500" />
            Company Specific Verbal Preparation
          </h1>
          <p className="mt-4 text-zinc-400 max-w-2xl text-lg">
            Targeted grammar, reading comprehension, and vocabulary patterns asked by top tech companies.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-500">
              <p>No companies available in verbal preparation.</p>
            </div>
          ) : (
            companies.map(c => (
              <Link 
                key={c.id} 
                href={`/verbal/company/${c.id}`}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all hover:bg-zinc-800/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-lg text-white">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-full">
                      Placement Prep
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1 group-hover:text-indigo-400 transition-colors">{c.name}</h3>
                  <p className="text-sm text-zinc-400 line-clamp-2 mb-6">
                    Targeted verbal practice, grammar rules & vocabulary syllabus for {c.name} recruitment drives.
                  </p>
                  <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                    View Verbal Roadmap <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
