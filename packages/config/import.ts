export const ImportConfig = {
  maxFileSizeMB: 50,
  maxRowsPerBatch: 100000,
  maxImagesPerBatch: 500,
  allowedMimeTypes: ['text/csv', 'application/json', 'application/jsonl', 'application/zip'],
  allowedExtensions: ['.csv', '.json', '.jsonl', '.zip'],
  enforceUtf8: true,
};
