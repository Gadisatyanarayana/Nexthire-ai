import { AssessmentAggregate } from '../../src/platform/assessment/domain/AssessmentAggregate';
import { AssessmentState } from '../../src/platform/assessment/lifecycle/AssessmentStateMachine';

describe('AssessmentAggregate', () => {
  it('should explicitly throw an error when mutating a PUBLISHED blueprint', () => {
    // Arrange
    const aggregate = AssessmentAggregate.hydrate({
      id: 'assessment-123',
      tenantId: 'tenant-1',
      state: AssessmentState.PUBLISHED,
      blueprint: { id: 'blueprint-1', title: 'Original' },
      policies: [],
      currentVersion: 1,
      snapshotIds: ['snap-1']
    });

    const newBlueprint = { id: 'blueprint-1', title: 'Modified' };

    // Act & Assert
    expect(() => {
      aggregate.updateBlueprint(newBlueprint as any);
    }).toThrow('Invariant Violation: Cannot modify a Published/Live blueprint. Create a new version.');
  });

  it('should successfully create a new version logically if state is DRAFT', () => {
    // Arrange
    const aggregate = AssessmentAggregate.hydrate({
      id: 'assessment-123',
      tenantId: 'tenant-1',
      state: AssessmentState.DRAFT,
      blueprint: { id: 'blueprint-1', title: 'Original' },
      policies: [],
      currentVersion: 1,
      snapshotIds: []
    });

    const newBlueprint = { id: 'blueprint-1', title: 'Modified' };

    // Act
    const updatedAggregate = aggregate.updateBlueprint(newBlueprint as any);

    // Assert
    expect(updatedAggregate.blueprint.title).toBe('Modified');
    expect(updatedAggregate.currentVersion).toBe(2);
    expect(updatedAggregate.getState()).toBe(AssessmentState.DRAFT);
  });
});
