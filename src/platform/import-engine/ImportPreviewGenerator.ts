import { ImportPreviewResult, ImportValidationError, ImportValidationWarning } from '../../../packages/contracts/import';

export class ImportPreviewGenerator {
  /**
   * Aggregates the results of the parsing, normalization, validation, and duplication phases 
   * into a single preview object for the Authoring CMS UI.
   */
  static generate(
    jobId: string, 
    validRows: any[], 
    duplicates: any[], 
    errors: ImportValidationError[], 
    warnings: ImportValidationWarning[]
  ): ImportPreviewResult {
    
    return {
      job_id: jobId,
      valid_count: validRows.length,
      duplicate_count: duplicates.length,
      error_count: errors.length,
      warnings,
      errors
    };
  }
}
