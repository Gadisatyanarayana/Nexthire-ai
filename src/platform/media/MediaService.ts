/**
 * Media Service Abstraction
 * Prevents UI from interacting with Storage Buckets directly.
 */

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  CHEAT_SHEET = 'CHEAT_SHEET',
  FORMULA_SHEET = 'FORMULA_SHEET',
  DIAGRAM = 'DIAGRAM',
  RESUME = 'RESUME',
  CERTIFICATE = 'CERTIFICATE',
  COMPANY_PDF = 'COMPANY_PDF'
}

export interface MediaUploadRequest {
  fileStream: Buffer;
  mimeType: string;
  type: MediaType;
  tenantId: string;
  entityId: string; // e.g., questionId, userId
}

export interface MediaRecord {
  id: string;
  url: string;
  cdnUrl?: string;
  sizeBytes: number;
  type: MediaType;
}

export interface IMediaService {
  upload(request: MediaUploadRequest): Promise<MediaRecord>;
  generateSignedUrl(mediaId: string, ttlSeconds: number): Promise<string>;
  delete(mediaId: string): Promise<boolean>;
}
