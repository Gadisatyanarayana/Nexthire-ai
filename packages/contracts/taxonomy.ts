export interface Domain {
  id: string;
  title: string;
  description?: string;
  display_order: number;
}

export interface Module {
  id: string;
  domain_id: string;
  title: string;
  description?: string;
  display_order: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  display_order: number;
}

export interface Concept {
  id: string;
  lesson_id: string;
  title: string;
  display_order: number;
}
