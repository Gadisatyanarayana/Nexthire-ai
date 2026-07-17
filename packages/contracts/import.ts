export type ImportJobStatus = 'Queued' | 'Processing' | 'ValidationFailed' | 'AwaitingApproval' | 'Publishing' | 'Completed' | 'RolledBack';

export interface ImportJob {
  id: string;
  filename: string;
  uploaded_by: string;
  status: ImportJobStatus;
  total_rows: number;
  inserted_rows: number;
  skipped_rows: number;
  failed_rows: number;
  created_at: string;
  updated_at: string;
}

export interface ImportValidationWarning {
  row_index: number;
  column: string;
  message: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface ImportValidationError {
  row_index: number;
  column: string;
  message: string;
}

export interface ImportPreviewResult {
  job_id: string;
  valid_count: number;
  duplicate_count: number;
  error_count: number;
  warnings: ImportValidationWarning[];
  errors: ImportValidationError[];
}
