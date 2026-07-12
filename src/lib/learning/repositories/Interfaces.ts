import { LearningContentType } from "../domain/LearningContentType";

export interface ITransactionSupport {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface ILessonRepository extends ITransactionSupport {
  getById(id: string): Promise<any>;
  getByModule(moduleId: string): Promise<any[]>;
  getAll(): Promise<any[]>;
  save(lesson: any): Promise<void>;
}

export interface IQuestionRepository extends ITransactionSupport {
  getById(id: string): Promise<any>;
  getByLesson(lessonId: string, limit: number): Promise<any[]>;
  getByCompany(companyName: string, limit: number): Promise<any[]>;
  getRandomSet(limit: number, lessonId?: string): Promise<any[]>;
  save(question: any): Promise<void>;
}

export interface IMockRepository extends ITransactionSupport {
  getById(id: string): Promise<any>;
  getUserSessions(userId: string, limit: number): Promise<any[]>;
  createSession(session: any): Promise<void>;
  updateSession(id: string, updates: any): Promise<void>;
}

export interface IMasteryRepository extends ITransactionSupport {
  getUserMastery(userId: string): Promise<any[]>;
  getTopicMastery(userId: string, topicId: string): Promise<any | null>;
  saveMastery(mastery: any): Promise<void>;
}

export interface ICompanyRepository extends ITransactionSupport {
  getById(id: string): Promise<any>;
  getAll(): Promise<any[]>;
  save(company: any): Promise<void>;
}
