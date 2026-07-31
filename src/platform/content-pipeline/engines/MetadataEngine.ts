import { BaseEngine } from "./BaseEngine";

export interface MetadataInput {
  title: string;
  description: string;
  constraints: string;
  currentMetadata: any;
}

export interface MetadataOutput {
  title: string;
  category: string;
  pattern: string;
  difficulty: "Easy" | "Medium" | "Hard";
  confidence: number;
}

export class MetadataEngine extends BaseEngine {
  async execute(payload: MetadataInput): Promise<MetadataOutput> {
    const prompt = `
      You are an expert DSA metadata classifier.
      Analyze the following problem and assign the correct Title, Category, Sub-Pattern, and Difficulty.
      Problem: ${payload.title}
      Description: ${payload.description}
      Constraints: ${payload.constraints}
    `;
    
    // In production, this schema will enforce the master_dsa_categories and patterns.
    const schema = {
      type: "object",
      properties: {
        title: { type: "string" },
        category: { type: "string" },
        pattern: { type: "string" },
        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
        confidence: { type: "number" }
      },
      required: ["title", "category", "pattern", "difficulty", "confidence"]
    };

    return this.llm.generateStructuredOutput<MetadataOutput>(prompt, schema);
  }
}
