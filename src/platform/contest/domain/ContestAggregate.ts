import { Contest, ContestSchedule } from '../../contracts/contest/contest';
import { RegistrationPolicy } from '../../contracts/contest/contest-registration';
import { ScoringPolicy } from '../../contracts/contest/contest-scoring';
import { RatingPolicy } from '../../contracts/contest/contest-rating';
import { AnnouncementPolicy } from '../../contracts/contest/contest-announcement';

/**
 * The Contest Aggregate Root.
 * Maintains the consistency of policies, scheduling, and state transitions.
 * Does not emit side-effects directly; returns state for the repository to persist.
 */
export class ContestAggregate {
  private constructor(
    private _contest: Contest,
    private _registrationPolicy: RegistrationPolicy,
    private _scoringPolicy: ScoringPolicy,
    private _ratingPolicy: RatingPolicy,
    private _announcementPolicy: AnnouncementPolicy
  ) {}

  public static hydrate(
    contest: Contest,
    registrationPolicy: RegistrationPolicy,
    scoringPolicy: ScoringPolicy,
    ratingPolicy: RatingPolicy,
    announcementPolicy: AnnouncementPolicy
  ): ContestAggregate {
    return new ContestAggregate(contest, registrationPolicy, scoringPolicy, ratingPolicy, announcementPolicy);
  }

  public get id(): string { return this._contest.id; }
  public get state(): string { return this._contest.state; }

  /**
   * Only allows edits in DRAFT state. Once scheduled, a new version must be created.
   */
  public updateSchedule(schedule: ContestSchedule): void {
    if (this._contest.state !== 'DRAFT') {
      throw new Error(`Cannot modify schedule in state: ${this._contest.state}. Must be DRAFT.`);
    }
    this._contest.schedule = schedule;
    this.validateSchedule();
  }

  /**
   * Publishes the contest. Transitions to SCHEDULED.
   */
  public publish(): void {
    if (this._contest.state !== 'DRAFT') {
      throw new Error('Can only publish DRAFT contests.');
    }
    this.validateSchedule();
    this._contest.state = 'SCHEDULED';
  }

  /**
   * Pauses an ACTIVE contest. Used in Incident Management.
   */
  public pause(): void {
    if (this._contest.state !== 'ACTIVE') {
      throw new Error('Can only pause an ACTIVE contest.');
    }
    this._contest.state = 'PAUSED';
  }

  /**
   * Resumes a PAUSED contest.
   */
  public resume(): void {
    if (this._contest.state !== 'PAUSED') {
      throw new Error('Can only resume a PAUSED contest.');
    }
    this._contest.state = 'ACTIVE';
  }

  private validateSchedule(): void {
    if (this._contest.schedule.endTime.getTime() <= this._contest.schedule.startTime.getTime()) {
      throw new Error('End time must be strictly after start time.');
    }
  }
}
