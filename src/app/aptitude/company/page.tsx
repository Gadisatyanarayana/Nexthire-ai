import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { Building2, ArrowRight } from "lucide-react";

export const revalidate = 3600;

export default async function CompanyGridPage() {
  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  let companies: any[] = [];
  try {
    const res = await fetch(`${protocol}://${host}/api/v1/aptitude/company`);
    const data = await res.json();
    if (data.success) companies = data.data;
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
        <header className="mb-12">
          <Link href="/aptitude" className="text-zinc-400 hover:text-white mb-4 block text-sm transition-colors">
            &larr; Back to Aptitude Hub
          </Link>
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <Building2 className="w-10 h-10 text-emerald-500" />
            Company Specific Preparation
          </h1>
          <p className="mt-4 text-zinc-400 max-w-2xl text-lg">
            Targeted roadmaps, syllabus breakdowns, and mock tests for top tech companies.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(c => (
            <Link 
              key={c.id} 
              href={`/aptitude/company/${c.id}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all hover:bg-zinc-800/50 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">{c.name}</h3>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm text-zinc-400">{c.sections.length} Sections</span>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
