export interface AISession {
  id: string;
  userId: string;
  tenantId: string;
  state: 'ACTIVE' | 'ARCHIVED';
  contextId?: string; // Optional reference to a specific contest, mock, etc.
  createdAt: Date;
  updatedAt: Date;
}
