import { z } from 'zod';
import { Result, success, failure } from '../../../packages/result';
import { ImportValidationError } from '../../../packages/contracts/import';

export const QuestionImportSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  domain: z.string().min(1, "Domain is required"),
  module: z.string().min(1, "Module is required"),
  lesson: z.string().min(1, "Lesson is required"),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], { errorMap: () => ({ message: "Difficulty must be Easy, Medium, or Hard" }) }),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'], { errorMap: () => ({ message: "Invalid Bloom Level" }) }),
});

export class ImportValidator {
  static validateBatch(normalizedRows: Record<string, any>[]): Result<{ valid: Record<string, any>[]; errors: ImportValidationError[] }> {
    const valid: Record<string, any>[] = [];
    const errors: ImportValidationError[] = [];

    normalizedRows.forEach((row, index) => {
      const parsed = QuestionImportSchema.safeParse(row);
      if (parsed.success) {
        valid.push(row);
      } else {
        parsed.error.issues.forEach(issue => {
          errors.push({
            row_index: index + 1, // 1-indexed for users
            column: issue.path.join('.'),
            message: issue.message
          });
        });
      }
    });

    // Even if there are errors, we return the split result so valid rows can proceed to DLQ architecture
    return success({ valid, errors });
  }
}
