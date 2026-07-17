import { CodingProblem } from '../../contracts/problem';
import { CodingTestCase } from '../../contracts/testcase';
import { Editorial } from '../../contracts/editorial';

/**
 * Aggregate Root for the Problem Ecosystem.
 * Guarantees that a Published problem cannot be mutated.
 * Any edits require bumping the version.
 */
export class CodingProblemAggregate {
  private _problem: CodingProblem;
  private _testCases: CodingTestCase[];
  private _editorial: Editorial | null;

  private constructor(
    problem: CodingProblem, 
    testCases: CodingTestCase[],
    editorial: Editorial | null
  ) {
    this._problem = problem;
    this._testCases = testCases;
    this._editorial = editorial;
  }

  public static hydrate(
    problem: CodingProblem, 
    testCases: CodingTestCase[],
    editorial: Editorial | null
  ): CodingProblemAggregate {
    return new CodingProblemAggregate(problem, testCases, editorial);
  }

  public get problem(): CodingProblem {
    return this._problem;
  }

  public get testCases(): CodingTestCase[] {
    return this._testCases;
  }

  public get editorial(): Editorial | null {
    return this._editorial;
  }

  public isPublished(): boolean {
    return this._problem.published;
  }

  public createNewVersion(): CodingProblemAggregate {
    const newProblem = {
      ...this._problem,
      version: this._problem.version + 1,
      published: false, // Reverts to draft
      updatedAt: new Date()
    };
    return new CodingProblemAggregate(newProblem, [...this._testCases], this._editorial ? { ...this._editorial } : null);
  }

  public updateStatement(newStatement: string): void {
    if (this.isPublished()) {
      throw new Error('Invariant Violation: Cannot mutate a Published problem. Call createNewVersion() first.');
    }
    this._problem.statementMd = newStatement;
    this._problem.updatedAt = new Date();
  }

  public addTestCase(testCase: CodingTestCase): void {
    if (this.isPublished()) {
      throw new Error('Invariant Violation: Cannot mutate a Published problem. Call createNewVersion() first.');
    }
    this._testCases.push(testCase);
  }

  public publish(): void {
    if (this._testCases.length === 0) {
      throw new Error('Invariant Violation: Cannot publish a problem with zero test cases.');
    }
    this._problem.published = true;
    this._problem.updatedAt = new Date();
  }
}
