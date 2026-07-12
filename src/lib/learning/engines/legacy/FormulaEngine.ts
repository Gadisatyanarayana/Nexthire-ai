import { AptitudeFormula } from "@/models/aptitude";

export class FormulaEngine {
  public static parseMetadata(formula: AptitudeFormula): any {
    // Extend the formula with metadata expected by FormulaViewer
    // If the database had a metadata column, we would parse it here.
    // For now, provide default placeholder metadata for rendering.
    
    return {
      ...formula,
      explanation: (formula as any).explanation || "This is a fundamental formula used in quantitative aptitude to quickly solve related problems without manual calculation.",
      derivation_steps: (formula as any).derivation_steps || [
        "Identify the known variables.",
        "Substitute them into the base equation.",
        "Simplify to reach the final formula."
      ],
      shortcut_method: (formula as any).shortcut_method || "Remember the ratio directly to save time.",
      common_mistake: (formula as any).common_mistake || "Failing to normalize units (e.g., km/h to m/s) before applying the formula."
    };
  }
}
