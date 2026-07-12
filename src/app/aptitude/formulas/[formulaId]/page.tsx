import React from "react";
import { notFound } from "next/navigation";
import { getFormula } from "@/lib/api/aptitudeV2";
import { FormulaViewer } from "@/components/aptitude/FormulaViewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

export default async function FormulaPage({ params }: { params: Promise<{ formulaId: string }> }) {
  const { formulaId } = await params;
  const formula = await getFormula(formulaId);

  if (!formula) notFound();

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-12 md:px-8">
        <Link href={`/aptitude/learn/${formula.topic_id}`} className="text-zinc-400 hover:text-white flex items-center gap-2 mb-8 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Lesson
        </Link>
        <FormulaViewer formulas={[formula as any]} />
      </div>
    </div>
  );
}
