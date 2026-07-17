import { QuestionRepository } from './QuestionRepository';
import { QuestionVersionService } from './QuestionVersionService';
import { Result, success, failure } from '../../../packages/result';
import { BaseError } from '../../../packages/errors';
import { Question } from '../../../packages/contracts/question';

export class QuestionService {
  constructor(
    private repository: QuestionRepository,
    private versionService: QuestionVersionService
  ) {}

  async createQuestion(payload: Partial<Question>, createdBy: string): Promise<Result<Question, BaseError>> {
    try {
      // 1. Validation (Omitted for brevity, would call QuestionValidator)
      
      // 2. Insert Base Question
      const question = await this.repository.create({
        ...payload,
        status: 'Draft'
      });

      // 3. Create initial immutable version
      const versionId = await this.versionService.createVersion(
        question.id, 
        payload, // Store full state
        createdBy
      );

      // 4. Update base question with version pointer
      const finalized = await this.repository.update(question.id, {
        current_version_id: versionId
      });

      // 5. Emit Event (QuestionCreatedEvent) to Event Bus

      return success(finalized);
    } catch (e: any) {
      return failure(new BaseError(`Failed to create question: ${e.message}`));
    }
  }
}
