import { BaseEngine } from "./BaseEngine";

export interface PatternInput {
  title: string;
  description: string;
  tags: string[];
}

export interface PatternOutput {
  master_category: string;
  sub_pattern: string;
  algorithms: string[];
  data_structures: string[];
  confidence: number;
}

export class PatternEngine extends BaseEngine {
  /**
   * Deterministic mapping to master_dsa_patterns.
   * Uses LLM fallback if deterministic checks fail.
   */
  async execute(payload: PatternInput): Promise<PatternOutput> {
    // Phase 2: Deterministic Regex/Rule Check
    const text = (payload.title + " " + payload.description + " " + payload.tags.join(" ")).toLowerCase();
    
    if (text.includes("sliding window") || text.includes("longest substring")) {
      return {
        master_category: "Sliding Window",
        sub_pattern: "Variable Window",
        algorithms: ["Sliding Window"],
        data_structures: ["String", "Hash Table"],
        confidence: 0.95
      };
    }
    
    if (text.includes("two sum") || text.includes("sorted array") && text.includes("pointers")) {
      return {
        master_category: "Two Pointers",
        sub_pattern: "Opposite Direction",
        algorithms: ["Two Pointers"],
        data_structures: ["Array"],
        confidence: 0.90
      };
    }

    // LLM Fallback (Phase 3)
    const prompt = `
      Classify this problem into a Master Category and Sub Pattern based on the known DSA master list.
      Title: ${payload.title}
      Description: ${payload.description}
      Tags: ${payload.tags.join(", ")}
    `;

    const schema = {
      type: "object",
      properties: {
        master_category: { type: "string" },
        sub_pattern: { type: "string" },
        algorithms: { type: "array", items: { type: "string" } },
        data_structures: { type: "array", items: { type: "string" } },
        confidence: { type: "number" }
      },
      required: ["master_category", "sub_pattern", "algorithms", "data_structures", "confidence"]
    };

    return this.llm.generateStructuredOutput<PatternOutput>(prompt, schema);
  }
}
