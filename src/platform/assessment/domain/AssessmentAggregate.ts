import { AssessmentState } from '../lifecycle/AssessmentStateMachine';
import { AssessmentBlueprint } from '../builder/AssessmentBlueprint';
import { AssessmentPolicy } from './AssessmentPolicy';

/**
 * Assessment Aggregate Root
 * Enforces internal consistency invariants for an Assessment.
 */
export class AssessmentAggregate {
  private constructor(
    public readonly id: string,
    public readonly tenantId: string,
    private state: AssessmentState,
    public readonly blueprint: AssessmentBlueprint,
    public readonly policies: AssessmentPolicy[],
    public readonly currentVersion: number,
    private readonly snapshotIds: string[]
  ) {}

  /**
   * Factory method to hydrate from persistence
   */
  static hydrate(data: any): AssessmentAggregate {
    return new AssessmentAggregate(
      data.id,
      data.tenantId,
      data.state,
      data.blueprint,
      data.policies,
      data.currentVersion,
      data.snapshotIds
    );
  }

  /**
   * INVARIANT: A published assessment cannot have its underlying blueprint structurally modified 
   * without creating a new Version and transitioning back through the approval lifecycle.
   */
  public updateBlueprint(newBlueprint: AssessmentBlueprint): AssessmentAggregate {
    if (this.state === AssessmentState.PUBLISHED || this.state === AssessmentState.LIVE) {
      throw new Error('Invariant Violation: Cannot modify a Published/Live blueprint. Create a new version.');
    }
    
    // Create new version logically
    return new AssessmentAggregate(
      this.id,
      this.tenantId,
      AssessmentState.DRAFT,
      newBlueprint,
      this.policies,
      this.currentVersion + 1,
      this.snapshotIds
    );
  }

  public publish(snapshotId: string): void {
    if (this.state !== AssessmentState.APPROVED) {
      throw new Error(`Invariant Violation: Assessment must be APPROVED to publish, currently ${this.state}`);
    }
    this.snapshotIds.push(snapshotId);
    this.state = AssessmentState.PUBLISHED;
  }

  public getState(): AssessmentState {
    return this.state;
  }
}
