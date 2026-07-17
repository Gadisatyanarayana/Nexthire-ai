import { AssessmentTemplate, AssessmentQuestion } from '../../../packages/contracts/assessment';

export class QuestionSelector {
  static async select(template: AssessmentTemplate): Promise<string[]> {
    // Queries DB for candidate questions based on domain/module
    return ['q1', 'q2', 'q3']; // mock IDs
  }
}

export class DifficultyBalancer {
  static balance(questionIds: string[], targetDifficulty: string): string[] {
    // Filters and balances the mix (e.g. 30% Easy, 50% Med, 20% Hard)
    return questionIds;
  }
}

export class CompanyWeighting {
  static apply(questionIds: string[], companyId?: string): string[] {
    // Prioritizes questions with high frequency tags for the company
    return questionIds;
  }
}

export class QuestionShuffler {
  static shuffle(questionIds: string[]): string[] {
    // In-memory Fisher-Yates shuffle instead of ORDER BY RANDOM()
    const array = [...questionIds];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export class AssessmentBuilder {
  static build(attemptId: string, questionIds: string[]): AssessmentQuestion[] {
    return questionIds.map((qId, index) => ({
      attempt_id: attemptId,
      question_id: qId,
      order_index: index,
      marked_for_review: false
    }));
  }
}

export class AssessmentGenerator {
  /**
   * The Composition Pipeline for creating an Assessment
   */
  static async generate(attemptId: string, template: AssessmentTemplate): Promise<AssessmentQuestion[]> {
    let pool = await QuestionSelector.select(template);
    pool = DifficultyBalancer.balance(pool, template.difficulty);
    pool = CompanyWeighting.apply(pool, template.company_id);
    pool = QuestionShuffler.shuffle(pool);
    
    return AssessmentBuilder.build(attemptId, pool);
  }
}
