export type DetectedFormat = 'csv' | 'json' | 'jsonl' | 'unknown';

export class ImportFileDetector {
  static detectFormat(filename: string, mimeType: string): DetectedFormat {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    if (ext === '.csv' || mimeType === 'text/csv') {
      return 'csv';
    }
    
    if (ext === '.json' || mimeType === 'application/json') {
      return 'json';
    }
    
    if (ext === '.jsonl' || mimeType === 'application/jsonl') {
      return 'jsonl';
    }

    return 'unknown';
  }
}
