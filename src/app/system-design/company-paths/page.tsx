"use client";

import Link from "next/link";
import { ChevronRight, Building2 } from "lucide-react";

export default function CompanyPathsListPage() {
  const companies = [
    { id: "google", name: "Google", difficulty: "Extreme", focus: "Scalability, Consistency, Novel Data Structures" },
    { id: "amazon", name: "Amazon", difficulty: "High", focus: "OOD, Microservices, Scalable AWS Architecture" },
    { id: "meta", name: "Meta", difficulty: "High", focus: "High Throughput, Low Latency, Social Graphs" },
    { id: "netflix", name: "Netflix", difficulty: "High", focus: "CDN, Global Replication, Fault Tolerance" },
    { id: "uber", name: "Uber", difficulty: "High", focus: "Geospatial Data, Pub/Sub, Real-time matching" },
    { id: "tcs-digital", name: "TCS Digital", difficulty: "Medium", focus: "Standard Architecture, SQL vs NoSQL, Caching" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <section>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Building2 className="h-8 w-8 text-blue-500" />
          Company Interview Database
        </h1>
        <p className="text-sm opacity-70 mt-2">
          Tailored curriculums prioritizing topics based on historical interview trends for specific MNCs.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map(company => (
          <Link
            key={company.id}
            href={`/system-design/company-paths/${company.id}`}
            className="p-6 rounded-2xl border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 transition-colors flex flex-col h-full"
          >
            <h2 className="text-xl font-bold mb-1">{company.name}</h2>
            <p className="text-xs font-semibold px-2 py-1 bg-foreground/10 rounded w-fit mb-3">
              Difficulty: {company.difficulty}
            </p>
            <p className="text-sm opacity-80 mb-4 flex-1">
              <strong>Focus:</strong> {company.focus}
            </p>
            <div className="pt-4 border-t border-foreground/10 flex items-center justify-between text-sm font-semibold opacity-70">
              <span className="flex items-center gap-1">View Blueprint</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
