import { AssessmentSnapshot } from '../../src/platform/assessment/generator/SnapshotBuilder';
import { AssessmentGeneratorPipeline } from '../../src/platform/assessment/generator/SnapshotBuilder';

describe('AssessmentGeneratorPipeline', () => {
  it('should inject a SHA-256 Checksum guaranteeing historical immutability', () => {
    // Arrange
    const questions = [{ id: 'q1' }, { id: 'q2' }];
    const blueprintId = 'bp-123';

    // Act
    const snapshot: AssessmentSnapshot = AssessmentGeneratorPipeline.buildFrozenSnapshot(questions, blueprintId);

    // Assert
    expect(snapshot.checksumHash).toBeDefined();
    expect(snapshot.checksumHash).toMatch(/^sha256_/);
    expect(snapshot.generatorVersion).toBe('v1.0.0');
    expect(snapshot.blueprintId).toBe(blueprintId);
  });
});
