export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type BloomLevel = 
  | 'Remember' 
  | 'Understand' 
  | 'Apply' 
  | 'Analyze' 
  | 'Evaluate' 
  | 'Create';

export type QuestionStatus = 
  | 'Draft' 
  | 'ReadyForReview' 
  | 'ReviewerApproved' 
  | 'Published' 
  | 'Deprecated' 
  | 'Archived';

export interface CompanyTag {
  company_id: string;
  name: string;
  frequency_score: number; // 0 to 1
  recent_year: number;
}

export interface QuestionVersion {
  id: string;
  question_id: string;
  version_number: number;
  content: string; // Markdown or Rich Text
  options: any[]; // Depending on question type
  correct_answer: any;
  explanation: string;
  hints: string[];
  created_at: string;
  created_by: string;
}

export interface Question {
  id: string;
  domain_id: string;
  module_id: string;
  lesson_id: string;
  concept_id?: string;
  title: string;
  difficulty: DifficultyLevel;
  bloom_level: BloomLevel;
  company_tags: CompanyTag[];
  status: QuestionStatus;
  current_version_id: string;
  import_batch_id?: string;
  created_at: string;
  updated_at: string;
}
