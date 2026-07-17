export class ImportNormalizer {
  /**
   * Normalizes raw parsed data to standardize keys and values before strict validation.
   */
  static normalize(rawRows: Record<string, any>[]): Record<string, any>[] {
    return rawRows.map(row => {
      const normalizedRow: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(row)) {
        // Standardize keys: lowercased and snake_case or trim
        const cleanKey = key.trim().toLowerCase().replace(/\\s+/g, '_');
        
        // Trim strings
        let cleanValue = value;
        if (typeof value === 'string') {
          cleanValue = value.trim();
        }

        normalizedRow[cleanKey] = cleanValue;
      }
      
      // Specifically normalize enums if present
      if (typeof normalizedRow.difficulty === 'string') {
        const d = normalizedRow.difficulty.toLowerCase();
        if (d === 'easy') normalizedRow.difficulty = 'Easy';
        if (d === 'medium') normalizedRow.difficulty = 'Medium';
        if (d === 'hard') normalizedRow.difficulty = 'Hard';
      }

      if (typeof normalizedRow.bloom_level === 'string') {
        const b = normalizedRow.bloom_level.toLowerCase();
        if (b === 'remember') normalizedRow.bloom_level = 'Remember';
        if (b === 'understand') normalizedRow.bloom_level = 'Understand';
        if (b === 'apply') normalizedRow.bloom_level = 'Apply';
        if (b === 'analyze') normalizedRow.bloom_level = 'Analyze';
        if (b === 'evaluate') normalizedRow.bloom_level = 'Evaluate';
        if (b === 'create') normalizedRow.bloom_level = 'Create';
      }

      return normalizedRow;
    });
  }
}
