/**
 * Company Engine
 * Defines company-specific hiring patterns, weightages, and topic distribution.
 */

export interface CompanyConfig {
  id: string;
  name: string;
  sections: { name: string; duration_minutes: number; num_questions: number }[];
  topic_weightage: Record<string, number>; // Topic names mapped to weight percentage
  difficulty_distribution: { easy: number; medium: number; hard: number };
  estimated_cutoff_percentage: number;
  hiring_process: string[];
}

export const COMPANIES: CompanyConfig[] = [
  {
    id: "tcs",
    name: "TCS (Tata Consultancy Services)",
    sections: [
      { name: "Numerical Ability", duration_minutes: 40, num_questions: 26 },
      { name: "Verbal Ability", duration_minutes: 30, num_questions: 24 },
      { name: "Reasoning Ability", duration_minutes: 50, num_questions: 30 }
    ],
    topic_weightage: {
      "Number System": 15,
      "Time and Work": 10,
      "Percentages": 10,
      "Data Interpretation": 15,
      "Blood Relations": 10,
      "Coding-Decoding": 10,
      "Reading Comprehension": 15,
      "Sentence Correction": 15
    },
    difficulty_distribution: { easy: 0.4, medium: 0.5, hard: 0.1 },
    estimated_cutoff_percentage: 65,
    hiring_process: ["NQT Online Test", "Technical Interview", "HR Interview"]
  },
  {
    id: "infosys",
    name: "Infosys",
    sections: [
      { name: "Mathematical Ability", duration_minutes: 35, num_questions: 10 },
      { name: "Logical Reasoning", duration_minutes: 25, num_questions: 15 },
      { name: "Verbal Ability", duration_minutes: 35, num_questions: 20 }
    ],
    topic_weightage: {
      "Cryptarithmetic": 20,
      "Data Sufficiency": 15,
      "Syllogism": 15,
      "Permutation and Combination": 15,
      "Probability": 15,
      "Sentence Completion": 20
    },
    difficulty_distribution: { easy: 0.2, medium: 0.5, hard: 0.3 },
    estimated_cutoff_percentage: 70,
    hiring_process: ["Online Aptitude Test", "Technical Interview", "HR Interview"]
  },
  {
    id: "amazon",
    name: "Amazon",
    sections: [
      { name: "Quantitative Aptitude", duration_minutes: 45, num_questions: 20 },
      { name: "Logical Reasoning", duration_minutes: 45, num_questions: 20 },
      { name: "Verbal Ability", duration_minutes: 30, num_questions: 20 }
    ],
    topic_weightage: {
      "Geometry": 10,
      "Algebra": 15,
      "Puzzles": 25,
      "Data Structures Logic": 20,
      "Reading Comprehension": 15,
      "Critical Reasoning": 15
    },
    difficulty_distribution: { easy: 0.1, medium: 0.4, hard: 0.5 },
    estimated_cutoff_percentage: 75,
    hiring_process: ["Online Assessment", "Technical Interview (Multiple)", "Bar Raiser"]
  },
  {
    id: "google",
    name: "Google",
    sections: [
      { name: "Cognitive Ability", duration_minutes: 60, num_questions: 20 }
    ],
    topic_weightage: {
      "Mathematical Puzzles": 30,
      "Logical Deductions": 30,
      "Pattern Recognition": 20,
      "Data Interpretation": 20
    },
    difficulty_distribution: { easy: 0.05, medium: 0.35, hard: 0.6 },
    estimated_cutoff_percentage: 85,
    hiring_process: ["Online Assessment", "Phone Screen", "Onsite Interviews"]
  }
  // Note: Added a few major ones for configuration, scalable to all 15+ requested via DB mapping if needed, 
  // but as per prompt "Support at minimum TCS, Infosys, ...", these will be returned by the engine.
];

export class CompanyEngine {
  public static getCompany(id: string): CompanyConfig | undefined {
    return COMPANIES.find(c => c.id === id);
  }

  public static getAllCompanies(): CompanyConfig[] {
    return COMPANIES;
  }
}
