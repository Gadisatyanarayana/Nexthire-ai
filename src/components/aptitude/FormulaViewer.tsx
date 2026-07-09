import React from "react";
import { AptitudeFormula } from "@/models/aptitude";
import { Calculator, Lightbulb, AlertTriangle, BookOpen } from "lucide-react";
import { FormulaVisualizer } from "./FormulaVisualizer";

export function FormulaViewer({ formulas }: { formulas: AptitudeFormula[] }) {
  if (!formulas || formulas.length === 0) return null;

  return (
    <div className="space-y-8 mt-12">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-4">
        <Calculator className="w-5 h-5 text-emerald-500" />
        Key Formulas
      </h3>

      {formulas.map((formula, idx) => {
        const f = formula as any;
        return (
        <div key={formula.id} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 space-y-4">
              {/* Formula text */}
              <div className="bg-zinc-950 p-6 rounded-lg border border-emerald-500/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Calculator className="w-16 h-16 text-emerald-500" />
                </div>
                <div className="font-mono text-xl md:text-2xl text-emerald-400 relative z-10">
                  {formula.formula_text}
                </div>
              </div>

              {/* Explanation */}
              {f.explanation && (
                <div className="prose prose-invert prose-emerald max-w-none text-zinc-300">
                  <p>{f.explanation}</p>
                </div>
              )}

              {/* Derivation Steps */}
              {f.derivation_steps && f.derivation_steps.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-zinc-800/50 text-sm">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" /> Derivation
                  </h4>
                  <ul className="list-decimal pl-5 space-y-1 text-zinc-400">
                    {f.derivation_steps.map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Shortcut & Mistake side-by-side */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                {f.shortcut_method && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-emerald-400 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> Pro Tip / Shortcut
                    </h4>
                    <p className="text-zinc-300 text-sm">{f.shortcut_method}</p>
                  </div>
                )}
                {f.common_mistake && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h4 className="text-red-400 font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Common Mistake
                    </h4>
                    <p className="text-zinc-300 text-sm">{f.common_mistake}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Example */}
          {(formula.example_q || formula.example_a) && (
            <div className="mt-6 border-t border-zinc-800 pt-6">
              <h4 className="text-white font-semibold mb-3">Worked Example</h4>
              <div className="bg-zinc-950 rounded-lg p-4 text-sm">
                <p className="text-zinc-300 mb-3 font-medium">Q: {formula.example_q}</p>
                <div className="pl-4 border-l-2 border-emerald-500 text-zinc-400">
                  A: {formula.example_a}
                </div>
              </div>
            </div>
          )}

          {/* Visualizer (if steps provided) */}
          {f.derivation_steps && f.derivation_steps.length > 0 && (
            <FormulaVisualizer steps={f.derivation_steps} title="Visualized Derivation" />
          )}
        </div>
        );
      })}
    </div>
  );
}
