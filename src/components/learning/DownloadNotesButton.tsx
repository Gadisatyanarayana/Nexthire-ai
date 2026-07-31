"use client";

import React, { useState } from "react";
import { Download, FileText, CheckCircle, Sparkles } from "lucide-react";

interface DownloadNotesButtonProps {
  lessonTitle: string;
  moduleTitle: string;
  domainTitle: string;
  concepts: any[];
  formulas: any[];
  questions: any[];
}

export function DownloadNotesButton({
  lessonTitle,
  moduleTitle,
  domainTitle,
  concepts,
  formulas,
  questions
}: DownloadNotesButtonProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadNotes = () => {
    let content = `================================================================================\n`;
    content += `         NEXTHIRE AI — COMPREHENSIVE HANDWRITTEN PLACEMENT NOTES\n`;
    content += `================================================================================\n`;
    content += `Category / Domain: ${domainTitle}\n`;
    content += `Module: ${moduleTitle}\n`;
    content += `Lesson Topic: ${lessonTitle}\n`;
    content += `Target Companies: TCS NQT, Infosys, Wipro NLTH, Accenture, Deloitte, EY, PwC, Amazon, Google\n`;
    content += `Date Generated: ${new Date().toLocaleDateString()}\n`;
    content += `================================================================================\n\n`;

    content += `📖 SECTION 1: MASTER THEORY, CORE PRINCIPLES & CONCEPTUAL DEEP-DIVE\n`;
    content += `--------------------------------------------------------------------------------\n`;
    if (concepts && concepts.length > 0) {
      concepts.forEach((c, idx) => {
        content += `\n[Concept #${idx + 1}: ${c.title || "Core Principle"}]\n`;
        content += `${c.description || c.content || c.explanation || "Mastering this concept is essential for clearing MNC elimination rounds."}\n`;
        content += `\n✦ Key Takeaway & Placement Insight:\n`;
        content += `  - Understand the structural mechanics before attempting calculation or option elimination.\n`;
        content += `  - Examiners frequently test edge cases and trap options designed to catch hasty candidates.\n`;
      });
    } else {
      content += `• Fundamental Definition: ${lessonTitle} forms the bedrock of standardized placement assessment tests.\n`;
      content += `• Core Logic: Always break down complex problem statements into elemental components.\n`;
    }

    content += `\n\n⚡ SECTION 2: HANDWRITTEN FORMULA SHEET, SHORTCUT TRICKS & MEMORY MNEMONICS\n`;
    content += `--------------------------------------------------------------------------------\n`;
    if (formulas && formulas.length > 0) {
      formulas.forEach((f, idx) => {
        const text = typeof f === "string" ? f : f.formula_text || f.text || "";
        content += `\nRule / Formula #${idx + 1}: ${text}\n`;
        if (f.shortcut_method) content += `  ★ Mental Math Shortcut: ${f.shortcut_method}\n`;
        if (f.common_mistake) content += `  ⚠ Examiner Trap & Common Error: ${f.common_mistake}\n`;
      });
    } else {
      content += `• Rule 1: Subject-Verb Agreement / Ratio Mechanics — Ensure singular subjects take singular verbs and ratio terms are reduced to primitive coprime values.\n`;
      content += `• Rule 2: Elimination Technique — In 4-choice MCQs, cross out 2 obviously wrong options immediately by checking unit digits or sentence tone.\n`;
    }

    content += `\n\n🎯 SECTION 3: REAL-WORLD PLACEMENT BITS & STEP-BY-STEP SOLVED EXAMPLES\n`;
    content += `--------------------------------------------------------------------------------\n`;
    if (questions && questions.length > 0) {
      questions.forEach((q, idx) => {
        content += `\nPlacement Bit #${idx + 1} [Asked in ${Array.isArray(q.companies) && q.companies.length > 0 ? q.companies.join(", ") : "TCS NQT / Infosys"}]:\n`;
        content += `Question: ${q.question}\n`;
        if (Array.isArray(q.options)) {
          q.options.forEach((opt: string, oIdx: number) => {
            const isCorrect = oIdx === q.correct_index ? "  <-- [CORRECT OPTION]" : "";
            content += `  ${String.fromCharCode(65 + oIdx)}. ${opt}${isCorrect}\n`;
          });
        }
        if (q.explanation) {
          content += `\nStep-by-Step Hand-Written Solution:\n${q.explanation}\n`;
        }
        content += `................................................................................\n`;
      });
    }

    content += `\n\n================================================================================\n`;
    content += `         © NextHire AI Placement Preparation Platform • Certified Study Guide\n`;
    content += `================================================================================\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedName = lessonTitle.replace(/[^a-zA-Z0-9]/g, "_");
    a.download = `${sanitizedName}_Handwritten_Placement_Notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <button
      onClick={handleDownloadNotes}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {downloaded ? (
        <>
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          Placement Notes Downloaded!
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-emerald-200" />
          Download Comprehensive Placement Notes
        </>
      )}
    </button>
  );
}
