import { AptitudeFormula } from "@/models/aptitude";

export class FormulaEngine {
  public static parseMetadata(formula: AptitudeFormula): any {
    const rawText = (formula?.formula_text || (formula as any)?.text || "").toLowerCase();
    const topicId = (formula?.topic_id || "").toLowerCase();

    // 1. Percentages
    if (topicId.includes("percent") || rawText.includes("percent") || rawText.includes("%")) {
      return {
        ...formula,
        explanation: "Percentage measures proportional change relative to a baseline of 100. It forms the foundational building block for Profit & Loss, Data Interpretation, and Interest calculations.",
        derivation_steps: [
          "Calculate absolute change: ΔV = V_final - V_initial.",
          "Express ΔV as a fraction of the baseline: Fraction = ΔV / V_initial.",
          "Multiply by 100 to convert to percentage: % Change = (ΔV / V_initial) × 100.",
          "Apply inverse rule: If A is X% more than B, B is [X / (100 + X)] × 100% less than A."
        ],
        shortcut_method: "Memorize fractional equivalents: 1/6 = 16.67%, 1/7 = 14.28%, 1/8 = 12.5%, 1/9 = 11.11%, 1/11 = 9.09% for instant mental calculations.",
        common_mistake: "Using V_final in the denominator instead of V_initial when computing percentage decrease."
      };
    }

    // 2. Profit & Loss
    if (topicId.includes("profit") || topicId.includes("loss") || rawText.includes("selling price") || rawText.includes("cost price")) {
      return {
        ...formula,
        explanation: "Profit & Loss evaluates financial gain or loss by comparing Selling Price (SP) and Cost Price (CP), with discounts always calculated on Marked Price (MP).",
        derivation_steps: [
          "Set Cost Price (CP) as the 100% reference baseline.",
          "Determine Marked Price (MP) via markup: MP = CP × (1 + Markup%).",
          "Apply discount on Marked Price: SP = MP × (1 - Discount%).",
          "Calculate net profit margin: Profit% = ((SP - CP) / CP) × 100."
        ],
        shortcut_method: "If two items are sold at the same price—one at x% profit and another at x% loss—the overall transaction ALWAYS results in a loss of (x / 10)² %.",
        common_mistake: "Calculating discount percentage on Cost Price instead of Marked Price."
      };
    }

    // 3. Time & Work
    if (topicId.includes("work") || rawText.includes("time & work") || rawText.includes("efficiency") || rawText.includes("pipes")) {
      return {
        ...formula,
        explanation: "Time & Work is based on the inverse relationship between time and rate of work. Efficiency measures the fraction of total work completed per unit time.",
        derivation_steps: [
          "Assume Total Work W = LCM of individual completion times (T_A, T_B, T_C).",
          "Calculate individual daily work rates (efficiencies): E_A = W / T_A and E_B = W / T_B.",
          "Sum daily efficiencies for combined effort: E_total = E_A + E_B.",
          "Compute combined completion time: T_together = Total Work W / E_total."
        ],
        shortcut_method: "If A takes 'a' days and B takes 'b' days individually, together they take (a × b) / (a + b) days.",
        common_mistake: "Adding time values directly (a + b) instead of adding reciprocal work rates (1/a + 1/b)."
      };
    }

    // 4. Speed, Distance & Time
    if (topicId.includes("speed") || topicId.includes("distance") || topicId.includes("train") || rawText.includes("km/h") || rawText.includes("m/s")) {
      return {
        ...formula,
        explanation: "Speed, Distance, and Time relate velocity to displacement. Harmonic mean applies when equal distances are covered at different speeds.",
        derivation_steps: [
          "Set up fundamental relation: Distance D = Speed S × Time T.",
          "For two equal distance halves D at S1 and S2: T1 = D / S1 and T2 = D / S2.",
          "Total Time T_total = D(1/S1 + 1/S2) = D(S1 + S2) / (S1 × S2).",
          "Average Speed = 2D / T_total = (2 × S1 × S2) / (S1 + S2)."
        ],
        shortcut_method: "To convert km/h to m/s, multiply by 5/18. To convert m/s to km/h, multiply by 18/5.",
        common_mistake: "Taking the arithmetic mean (S1 + S2) / 2 when distances traveled at both speeds are equal."
      };
    }

    // 5. Ratio & Proportion
    if (topicId.includes("ratio") || topicId.includes("proportion") || topicId.includes("mixture") || rawText.includes("a:b")) {
      return {
        ...formula,
        explanation: "Ratio compares relative magnitudes of quantities, while Proportion equates two ratios. Equalizing common terms allows combining multi-variable ratios.",
        derivation_steps: [
          "Identify the common term B in ratios A:B = c:d and B:C = e:f.",
          "Find LCM of B's values (d and e) to scale both ratios to a common baseline.",
          "Multiply A:B by e to get A' = c×e and B' = d×e.",
          "Multiply B:C by d to get B' = d×e and C' = d×f, yielding A:B:C = (c×e) : (d×e) : (d×f)."
        ],
        shortcut_method: "For compound ratio A:C from A:B and B:C, multiply fractions directly: (A / B) × (B / C) = A / C.",
        common_mistake: "Adding ratio parts directly without multiplying by a common proportionality constant k."
      };
    }

    // 6. Permutations & Combinations / Probability
    if (topicId.includes("permu") || topicId.includes("combi") || topicId.includes("probab") || rawText.includes("ncr") || rawText.includes("npr")) {
      return {
        ...formula,
        explanation: "Permutations measure ordered arrangements, Combinations measure unordered selections, and Probability evaluates the ratio of favorable to total outcomes.",
        derivation_steps: [
          "For ordered selection of r items from n (Permutation): nPr = n! / (n - r)!.",
          "For unordered selection (Combination), divide by r! to remove duplicate groupings: nCr = n! / (r! × (n - r)!).",
          "Calculate sample space N(S) and favorable outcomes N(E).",
          "Compute probability: P(E) = N(E) / N(S)."
        ],
        shortcut_method: "Complementary Probability Rule: P(At least one success) = 1 - P(Zero successes).",
        common_mistake: "Using Permutations (nPr) when order of selection does not matter (e.g. forming a committee)."
      };
    }

    // 7. Seating Arrangement & Puzzles (Logical Reasoning)
    if (topicId.includes("seat") || topicId.includes("puzzle") || topicId.includes("arrangement") || rawText.includes("circular") || rawText.includes("facing")) {
      return {
        ...formula,
        explanation: "Logical seating arrangements evaluate positional constraints along lines, circles, or grids by establishing fixed anchor points first.",
        derivation_steps: [
          "Fix 1 reference person in a circular table of n seats to eliminate rotational symmetry.",
          "Arrange the remaining (n - 1) individuals in (n - 1)! distinct ways.",
          "If clockwise and counter-clockwise arrangements are non-distinct (e.g., a bead necklace), divide by 2: (n - 1)! / 2.",
          "For linear grids, determine facing directions (North = Left/Right matches viewer, South = Inverted)."
        ],
        shortcut_method: "Draw a fixed 8-point cardinal direction grid (N, NE, E, SE, S, SW, W, NW) before placing conditional clues.",
        common_mistake: "Confusing 'Immediate Left' (adjacent seat) with 'Left' (any position to the left)."
      };
    }

    // 8. Syllogisms & Deductive Logic
    if (topicId.includes("syllogism") || topicId.includes("deduction") || topicId.includes("logic") || rawText.includes("all a are b") || rawText.includes("some")) {
      return {
        ...formula,
        explanation: "Syllogism relies on Venn diagram set theory to deduce definite or possible conclusions from premises without making outside assumptions.",
        derivation_steps: [
          "Convert statements into set relationships: 'All A are B' => A ⊆ B; 'No A is B' => A ∩ B = ∅.",
          "Draw the Minimal Overlap Venn Diagram representing all given statements.",
          "Test conclusions against ALL possible valid Venn configurations.",
          "Check Either-Or Complementary Pairs: (Some A + No A) or (Some A are B + Some A are not B)."
        ],
        shortcut_method: "AEIO Rules: A (All) + I (Some) => I (Some); A (All) + A (All) => A (All); E (No) + I (Some) => O* (Some not).",
        common_mistake: "Assuming 'Some A are B' implies 'Some A are NOT B' (in formal logic, 'Some' means 'at least one')."
      };
    }

    // 9. Data Interpretation (Tables, Bar Graphs, Pie Charts)
    if (topicId.includes("data") || topicId.includes("table") || topicId.includes("chart") || rawText.includes("graph")) {
      return {
        ...formula,
        explanation: "Data Interpretation extracts structured quantitative trends from tables and charts using rapid ratio approximations and percentage calculations.",
        derivation_steps: [
          "Extract baseline values from chart axes or table cells for the specified time periods.",
          "Calculate growth rate: Growth% = (Value_t - Value_t-1) / Value_t-1 × 100%.",
          "Convert pie chart degree angles to percentage shares: Share% = (Angle° / 360°) × 100%.",
          "Compute weighted averages across categories: X_avg = Σ(w_i × x_i) / Σw_i."
        ],
        shortcut_method: "Use Deviation Method for fast averages: Pick an assumed mean A, compute Σ(x_i - A) / N, and add result to A.",
        common_mistake: "Miscalculating pie chart angles by treating 100° as 100% instead of applying 3.6° per 1%."
      };
    }

    // 10. Default Topic-Aware Fallback
    return {
      ...formula,
      explanation: (formula as any).explanation || `Core principles and shortcut equations for ${topicId.replace(/-/g, " ")}. Master these formulas to solve placement questions in under 45 seconds.`,
      derivation_steps: [
        `Define variables and initial conditions for ${topicId.replace(/-/g, " ")}.`,
        `Formulate the governing ratio or algebraic relationship.`,
        `Apply inverse scaling and unit normalization.`,
        `Simplify the expression to derive the instant shortcut formula.`
      ],
      shortcut_method: (formula as any).shortcut_method || "Eliminate impossible options using unit digit check and dimensional analysis before calculating.",
      common_mistake: (formula as any).common_mistake || "Failing to check unit compatibility (e.g. seconds vs minutes, meters vs kilometers) before applying the formula."
    };
  }
}
