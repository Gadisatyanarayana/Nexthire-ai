export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  active: boolean;
  tier: 'ServiceBased' | 'ProductBased' | 'FAANG' | 'Startup';
}

export interface CompanyRound {
  id: string;
  company_id: string;
  name: string; // e.g., "Online Assessment", "Technical Interview"
  order_index: number;
}

export interface QuestionCompanyMapping {
  question_id: string;
  company_id: string;
  round_id?: string;
  frequency: number; // 0.0 to 1.0
  year_asked?: number;
  role_tags: string[]; // e.g., ["SDE1", "Data Analyst"]
}
