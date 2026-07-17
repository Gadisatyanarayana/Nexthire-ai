import { BaseDomainEvent } from '../../kernel/events/DomainEvent';

export class CodingSubmittedEvent extends BaseDomainEvent {
  constructor(payload: {
    submissionId: string;
    problemId: string;
    userId: string;
    language: string;
    timestamp: string;
  }) {
    super('CodingSubmitted.v1', 'coding-engine', payload);
  }
}

export class CodingJudgedEvent extends BaseDomainEvent {
  constructor(payload: {
    submissionId: string;
    problemId: string;
    userId: string;
    verdict: string;
    runtimeMs: number;
    memoryKb: number;
    passedEdgeCases: boolean;
    timestamp: string;
  }) {
    super('CodingJudged.v1', 'coding-engine', payload);
  }
}
