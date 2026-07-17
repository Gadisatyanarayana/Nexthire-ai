import { Question } from './question';

export interface AssessmentSection {
  id: string;
  title: string;
  domain_id: string;
  module_ids: string[];
  question_count: number;
  time_limit_minutes: number;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  company_id?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Adaptive';
  sections: AssessmentSection[];
}

export interface AssessmentAttempt {
  id: string;
  user_id: string;
  template_id: string;
  status: 'InProgress' | 'Submitted' | 'Evaluated';
  started_at: string;
  completed_at?: string;
  score?: number;
}

export interface AssessmentQuestion {
  attempt_id: string;
  question_id: string;
  order_index: number;
  user_answer?: any;
  is_correct?: boolean;
  time_spent_seconds?: number;
  marked_for_review: boolean;
}
