import { ImportConfig } from '../../../packages/config/import';
import { Result, success, failure } from '../../../packages/result';
import { ImportError } from '../../../packages/errors';

export interface FileMetadata {
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export class ImportPolicies {
  static validate(metadata: FileMetadata): Result<boolean, ImportError> {
    const sizeMB = metadata.sizeBytes / (1024 * 1024);
    
    if (sizeMB > ImportConfig.maxFileSizeMB) {
      return failure(new ImportError(`File size ${sizeMB.toFixed(2)}MB exceeds maximum allowed ${ImportConfig.maxFileSizeMB}MB`));
    }

    if (!ImportConfig.allowedMimeTypes.includes(metadata.mimeType)) {
      return failure(new ImportError(`Invalid mime type ${metadata.mimeType}. Allowed: ${ImportConfig.allowedMimeTypes.join(', ')}`));
    }

    const ext = metadata.filename.substring(metadata.filename.lastIndexOf('.')).toLowerCase();
    if (!ImportConfig.allowedExtensions.includes(ext)) {
      return failure(new ImportError(`Invalid extension ${ext}. Allowed: ${ImportConfig.allowedExtensions.join(', ')}`));
    }

    return success(true);
  }
}
