"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle, Building2, Clock, CheckCircle } from "lucide-react";

export default function MockTestsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [cRes, hRes] = await Promise.all([
          fetch("/api/v1/reasoning/company"),
          fetch("/api/v1/reasoning/mock-history")
        ]);
        const cData = await cRes.json();
        const hData = await hRes.json();
        if (cData.success) setCompanies(cData.data);
        if (hData.success) setHistory(hData.data);
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
      const res = await fetch("/api/v1/reasoning/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/reasoning/mock-tests/${data.data.session_id}`);
      }
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex justify-center items-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-6xl mx-auto px-4 py-12 md:px-8">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <Link href="/reasoning" className="text-zinc-400 hover:text-white mb-4 block text-sm transition-colors">
              &larr; Back to Logical Reasoning Hub
            </Link>
            <h1 className="text-4xl font-extrabold flex items-center gap-3">
              <PlayCircle className="w-10 h-10 text-emerald-500" />
              Mock Assessments
            </h1>
            <p className="mt-4 text-zinc-400 max-w-2xl text-lg">
              Full-length timed assessments mapping to real company patterns.
            </p>
          </div>
          <button 
            onClick={() => startMock()}
            disabled={starting}
            className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition flex items-center gap-2"
          >
            {starting ? <Loader2 className="w-5 h-5 animate-spin"/> : <PlayCircle className="w-5 h-5"/>}
            Custom Full Test
          </button>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Company Specific Mocks
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(c => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">{c.name} Pattern</h3>
                  <div className="flex gap-4 text-sm text-zinc-400 mb-6">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {(c.sections || []).reduce((a:any,s:any)=>a+s.duration_minutes,0)} mins</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> {(c.sections || []).reduce((a:any,s:any)=>a+s.num_questions,0)} Qs</span>
                  </div>
                </div>
                <button 
                  onClick={() => startMock(c.id)}
                  disabled={starting}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition"
                >
                  Start Mock
                </button>
              </div>
            ))}
          </div>
        </section>

        {history.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Recent Attempts</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-4 text-zinc-400 font-medium">Test</th>
                    <th className="px-6 py-4 text-zinc-400 font-medium">Date</th>
                    <th className="px-6 py-4 text-zinc-400 font-medium">Score / Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="px-6 py-4 font-medium">
                        <Link href={`/reasoning/mock-tests/${h.id}/results`} className="hover:text-emerald-400 hover:underline">
                          {h.session_data?.config?.title || "Mock Test"}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{new Date(h.end_time).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{Math.round(h.score)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
