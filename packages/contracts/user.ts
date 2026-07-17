export type UserRole = 
  | 'SuperAdmin' 
  | 'PlatformAdmin' 
  | 'ContentLead' 
  | 'ContentAuthor' 
  | 'Reviewer' 
  | 'Faculty' 
  | 'Student';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string;
  last_login_at?: string;
}

export interface UserPermissionContext {
  userId: string;
  role: UserRole;
  allowedDomains?: string[]; // Empty means all domains
}
