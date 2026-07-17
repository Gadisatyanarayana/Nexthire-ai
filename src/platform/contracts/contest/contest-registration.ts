export interface RegistrationPolicy {
  eligibilityRules: {
    requiresInstitution?: string;
    requiresDepartment?: string;
    requiresBatch?: string;
    whitelistedUserIds?: string[];
    isInviteOnly: boolean;
  };
  capacityLimit: number;
  accessCode?: string;
  registrationWindowStart: Date;
  registrationWindowEnd: Date;
  teamSizeMin: number;
  teamSizeMax: number;
}

export interface ContestRegistration {
  id: string;
  contestId: string;
  userId: string;
  teamId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registeredAt: Date;
}
