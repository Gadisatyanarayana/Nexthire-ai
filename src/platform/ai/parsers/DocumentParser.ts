import * as mammoth from 'mammoth';
import { AILogger } from '../observability/AILogger';

export class DocumentParser {
  /**
   * Extracts raw text from a document buffer.
   * Supports PDF and DOCX.
   */
  static async extractRawText(buffer: Buffer, mimeType: string, requestId: string): Promise<{ text: string, pages: number, parser: string }> {
    const startTime = Date.now();

    try {
      if (mimeType === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        
        AILogger.info('PDF successfully parsed', {
          requestId,
          provider: 'pdf-parse',
          model: 'local',
          latency: Date.now() - startTime,
          pages: data.numpages,
          characters: data.text.length,
          parserVersion: 'v1'
        });

        return {
          text: data.text,
          pages: data.numpages,
          parser: 'pdf-parse'
        };
      } 
      
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer });
        
        AILogger.info('DOCX successfully parsed', {
          requestId,
          provider: 'mammoth',
          model: 'local',
          latency: Date.now() - startTime,
          pages: 1, // Mammoth doesn't give page counts easily
          characters: result.value.length,
          parserVersion: 'v1'
        });

        return {
          text: result.value,
          pages: 1,
          parser: 'mammoth'
        };
      }

      if (mimeType === 'text/plain') {
        const text = buffer.toString('utf-8');
        return {
          text,
          pages: 1,
          parser: 'utf8-buffer'
        };
      }

      throw new Error(`Unsupported document type: ${mimeType}`);

    } catch (error) {
      AILogger.error('Failed to parse document', error, {
        requestId,
        provider: 'system',
        model: 'local',
        latency: Date.now() - startTime
      });
      throw error;
    }
  }
}
