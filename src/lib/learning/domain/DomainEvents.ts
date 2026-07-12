export interface IDomainEvent {
  eventName: string;
  timestamp: Date;
}

export class LessonStartedEvent implements IDomainEvent {
  public eventName = "LESSON_STARTED";
  public timestamp = new Date();
  constructor(
    public userId: string,
    public lessonId: string,
    public moduleId: string
  ) {}
}

export class LessonCompletedEvent implements IDomainEvent {
  public eventName = "LESSON_COMPLETED";
  public timestamp = new Date();
  constructor(
    public userId: string,
    public lessonId: string,
    public moduleId: string
  ) {}
}

export class QuestionSolvedEvent implements IDomainEvent {
  public eventName = "QUESTION_SOLVED";
  public timestamp = new Date();
  constructor(
    public userId: string,
    public questionId: string,
    public isCorrect: boolean,
    public timeTakenMs: number,
    public difficulty: string
  ) {}
}

export class MockFinishedEvent implements IDomainEvent {
  public eventName = "MOCK_FINISHED";
  public timestamp = new Date();
  constructor(
    public userId: string,
    public sessionId: string,
    public score: number
  ) {}
}
