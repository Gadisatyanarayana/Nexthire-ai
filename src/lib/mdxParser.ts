import matter from 'gray-matter';

// MDX parsing utility for the Content Management System.
// Converts standard MDX strings into the structured 23-step JSON format.

export interface ParsedLessonContent {
  metadata: {
    title: string;
    difficulty: string;
    reading_time: string;
    module_id: string;
    version: number;
    author: string;
  };
  content: {
    introduction?: string;
    problemStatement?: string;
    theory?: string;
    diagramId?: string;
    advantages?: string[];
    disadvantages?: string[];
    tradeoffs?: string;
    mistakes?: string[];
    bestPractices?: string[];
    interviewQuestions?: Array<{ q: string; a: string; expectations: string }>;
    summary?: string;
    [key: string]: Record<string, unknown> | unknown[] | string | number | boolean | null | undefined; // Extensible for all 23 steps
  };
  rawBody: string;
}

import { validateLesson } from './lessonValidator';

export function parseMDXContent(rawMDX: string) {
  const { data, content } = matter(rawMDX);
  
  // A robust CMS would parse the AST (e.g. using unified/remark) to extract 
  // specific sections based on Markdown headers (## 1. Introduction, etc.)
  // For Phase 2, we simulate this extraction by structuring the frontmatter and body.
  
  const payload = {
    metadata: {
      title: data.title || 'Untitled Lesson',
      difficulty: data.difficulty || 'Beginner',
      reading_time: data.reading_time || '5 min',
      module_id: data.module_id || 'unknown-module',
      version: data.version || 1,
      author: data.author || 'System',
    },
    content: {
      ...data.content, // Fallback if content sections are defined in frontmatter
      theory: content, // The raw markdown body serves as the theory/overview initially
    },
    rawBody: content,
  };

  return payload;
}
