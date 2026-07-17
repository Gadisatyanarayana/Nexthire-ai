export interface AnnouncementPolicy {
  allowTargeted: boolean;
  allowPinned: boolean;
}

export interface ContestAnnouncement {
  id: string;
  contestId: string;
  type: 'IMMEDIATE' | 'SCHEDULED' | 'PINNED' | 'TARGETED';
  messageMd: string;
  broadcastAt: Date;
  targetUserIds?: string[];
}
