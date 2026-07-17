export interface ContestMetadata {
  title: string;
  descriptionMd: string;
  coverImageUri?: string;
  tags: string[];
}

export interface ContestSchedule {
  startTime: Date;
  endTime: Date;
  freezeDurationMs: number;
}

export interface ContestSnapshot {
  id: string;
  contestVersionId: string;
  problemVersionIds: string[];
  integrityHash: string;
}

export interface Contest {
  id: string;
  tenantId: string;
  blueprintId: string;
  currentVersion: number;
  state: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  metadata: ContestMetadata;
  schedule: ContestSchedule;
  createdAt: Date;
}
