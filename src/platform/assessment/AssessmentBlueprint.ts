/**
 * Assessment Blueprint Engine
 * Frozen Architecture for 20+ Assessment Types
 */

export enum AssessmentType {
  TopicQuiz = 'TOPIC_QUIZ',
  LessonQuiz = 'LESSON_QUIZ',
  ModuleQuiz = 'MODULE_QUIZ',
  DomainQuiz = 'DOMAIN_QUIZ',
  CompanyAssessment = 'COMPANY_ASSESSMENT',
  AdaptiveAssessment = 'ADAPTIVE_ASSESSMENT',
  DailyChallenge = 'DAILY_CHALLENGE',
  WeeklyChallenge = 'WEEKLY_CHALLENGE',
  Contest = 'CONTEST',
  MockTest = 'MOCK_TEST',
  PreviousPapers = 'PREVIOUS_PAPERS',
  RevisionTest = 'REVISION_TEST',
  WeakTopicTest = 'WEAK_TOPIC_TEST',
  InterviewRound = 'INTERVIEW_ROUND',
  OASimulation = 'OA_SIMULATION',
  CodingContest = 'CODING_CONTEST',
  SQLContest = 'SQL_CONTEST',
  SystemDesignInterview = 'SYSTEM_DESIGN_INTERVIEW',
  AIMockInterview = 'AI_MOCK_INTERVIEW'
}

export interface AssessmentBlueprint {
  type: AssessmentType;
  configuration: {
    durationMinutes: number;
    questionCount: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
    allowBacktracking: boolean;
    proctoringEnabled: boolean;
  };
  selectionCriteria: {
    domains?: string[];
    companies?: string[];
    tags?: string[];
    bloomLevels?: string[];
  };
}

export interface IAssessmentFactory {
  generate(blueprint: AssessmentBlueprint, userId: string): Promise<string>; // Returns assessmentId
}
