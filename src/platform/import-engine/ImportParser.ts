import { Result, success, failure } from '../../../packages/result';
import { ImportError } from '../../../packages/errors';
import { DetectedFormat } from './ImportFileDetector';

export class ImportParser {
  /**
   * Parses the raw file content into an array of unvalidated JavaScript objects.
   * In a real implementation, this would use a robust library like 'papaparse' for CSV 
   * to handle quoted fields and escaping correctly.
   */
  static async parse(content: string, format: DetectedFormat): Promise<Result<Record<string, any>[], ImportError>> {
    try {
      if (format === 'json') {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
          return failure(new ImportError('JSON root must be an array of objects'));
        }
        return success(data);
      }

      if (format === 'jsonl') {
        const lines = content.split('\\n').filter(l => l.trim().length > 0);
        const data = lines.map(line => JSON.parse(line));
        return success(data);
      }

      if (format === 'csv') {
        // A naive CSV parser (for the first pass, should be upgraded to papaparse)
        const lines = content.split('\\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return success([]);

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: Record<string, any> = {};
          headers.forEach((h, index) => {
            row[h] = values[index] || null;
          });
          data.push(row);
        }
        return success(data);
      }

      return failure(new ImportError(`Unsupported format: ${format}`));

    } catch (e: any) {
      return failure(new ImportError(`Parsing failed: ${e.message}`));
    }
  }
}
