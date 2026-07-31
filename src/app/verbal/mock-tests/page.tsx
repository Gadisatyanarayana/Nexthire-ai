"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, PlayCircle, Building2, Clock, CheckCircle, ArrowLeft, Filter } from "lucide-react";
import { CompanyLogo } from "@/components/common/CompanyLogo";

function VerbalMockTestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetCompany = searchParams.get("company") || searchParams.get("company_id");

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/v1/verbal/company");
        const data = await res.json();
        if (data.success) setCompanies(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const startMock = async (companyId?: string) => {
    setStarting(true);
    try {
      const res = await fetch("/api/v1/verbal/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/verbal/mock-tests/${data.data.session_id}`);
      }
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Filter if specific company requested
  const filteredCompanies = targetCompany
    ? companies.filter(c => c.id.toLowerCase() === targetCompany.toLowerCase() || c.name.toLowerCase().includes(targetCompany.toLowerCase()))
    : companies;

  const activeCompanyObj = filteredCompanies[0];

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto mb-10">
        <Link href="/verbal" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-indigo-400 transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Verbal Hub
        </Link>

        {targetCompany && activeCompanyObj ? (
          <div className="p-8 bg-gradient-to-r from-indigo-950/80 to-zinc-900 border border-indigo-500/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl mb-10">
            <div className="flex items-center gap-5">
              <CompanyLogo logoUrl={activeCompanyObj.logo_url} name={activeCompanyObj.name} size={64} />
              <div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs rounded-md uppercase tracking-widest font-bold">
                  Targeted Company Assessment
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">{activeCompanyObj.name} Verbal Placement Mock</h1>
                <p className="text-zinc-400 text-sm mt-1">20 Questions • 30 Minutes • Pattern-Specific Questions</p>
              </div>
            </div>
            <button
              onClick={() => startMock(activeCompanyObj.id)}
              disabled={starting}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              Start {activeCompanyObj.name} Test Now
            </button>
          </div>
        ) : (
          <div className="p-8 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-mono text-xs rounded-md uppercase tracking-widest font-bold">
                Full-Length Assessment
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Verbal Ability Diagnostic Test</h1>
              <p className="text-zinc-400 text-sm mt-1">20 Questions • 30 Minutes • TCS NQT, Infosys, Wipro, Accenture Patterns</p>
            </div>
            <button
              onClick={() => startMock()}
              disabled={starting}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl shadow-lg transition flex items-center gap-2 shrink-0"
            >
              {starting ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              Start Full Verbal Mock
            </button>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-500" />
            {targetCompany ? `Filtered Company Tests (${filteredCompanies.length})` : "All Company Tests"}
          </h2>
          {targetCompany && (
            <Link href="/verbal/mock-tests" className="text-xs text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Show All Companies
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredCompanies.length > 0 ? filteredCompanies : companies).map((c) => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-indigo-500/50 transition flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <CompanyLogo logoUrl={c.logo_url} name={c.name} size={48} />
                  <div>
                    <h3 className="font-bold text-white text-lg">{c.name}</h3>
                    <span className="text-xs text-zinc-400">Verbal Practice Suite</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {Array.isArray(c.sections) && c.sections.map((sec: any, idx: number) => {
                    const secName = typeof sec === "string" ? sec : sec?.name || sec?.title || "Verbal Section";
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{secName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => startMock(c.id)}
                disabled={starting}
                className="w-full py-2.5 bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-200 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                Start Test <Clock className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VerbalMockTestsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}>
      <VerbalMockTestsContent />
    </Suspense>
  );
}
