import { CompanyConfig } from "../companies/CompanyRegistry";
import { IQuestion } from "./QuestionEngine";

export interface MockTestConfig {
  id: string;
  title: string;
  description: string;
  type: "company" | "topic" | "sectional" | "full-length" | "custom" | "mixed" | "adaptive" | "previous-year";
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
  company_id?: string;
  topic_ids?: string[];
  difficulty_distribution?: { easy: number; medium: number; hard: number };
}

export class MockTestEngine {
  /**
   * Generates a mock test config dynamically based on a company.
   */
  public static generateCompanyMockConfig(company: CompanyConfig): MockTestConfig {
    const totalQuestions = company.sections.reduce((acc, sec) => acc + sec.num_questions, 0);
    const totalDuration = company.sections.reduce((acc, sec) => acc + sec.duration_minutes, 0);

    return {
      id: `mock-${company.id}-${Date.now()}`,
      title: `${company.name} Mock Assessment`,
      description: `Official pattern mock test for ${company.name}`,
      type: "company",
      duration_minutes: totalDuration,
      total_questions: totalQuestions,
      passing_score: company.estimated_cutoff_percentage,
      company_id: company.id,
      difficulty_distribution: company.difficulty_distribution
    };
  }

  /**
   * Builds the actual question list for the mock test using the QuestionEngine to bucket difficulties.
   */
  public static buildTestPaper(
    config: MockTestConfig, 
    allQuestions: IQuestion[]
  ): IQuestion[] {
    // If we have a specific difficulty distribution, we can bucket them.
    // Otherwise just return a random subset.
    const dist = config.difficulty_distribution || { easy: 0.33, medium: 0.34, hard: 0.33 };
    
    const easyCount = Math.floor(config.total_questions * dist.easy);
    const hardCount = Math.floor(config.total_questions * dist.hard);
    const medCount = config.total_questions - easyCount - hardCount;

    const easyQs = allQuestions.filter(q => q.difficulty === "easy");
    const medQs = allQuestions.filter(q => q.difficulty === "medium");
    const hardQs = allQuestions.filter(q => q.difficulty === "hard");

    const shuffle = (array: any[]) => {
      let currentIndex = array.length, randomIndex;
      while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
      }
      return array;
    };

    const selectRandom = (arr: IQuestion[], count: number) => {
      return shuffle([...arr]).slice(0, count);
    };

    let paper = [
      ...selectRandom(easyQs, easyCount),
      ...selectRandom(medQs, medCount),
      ...selectRandom(hardQs, hardCount)
    ];

    // Backfill if we didn't hit total_questions (due to bucket shortages)
    if (paper.length < config.total_questions) {
      const remainingNeeded = config.total_questions - paper.length;
      const unusedQs = allQuestions.filter(q => !paper.find(p => p.id === q.id));
      paper.push(...selectRandom(unusedQs, remainingNeeded));
    }

    // Shuffle the final paper
    return shuffle(paper);
  }
}
