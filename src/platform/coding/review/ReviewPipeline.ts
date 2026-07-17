import { CodingSubmission } from '../../contracts/submission';
import { Editorial } from '../../contracts/editorial';

export interface ReviewGraphPoint {
  percentile: number;
  value: number;
}

export interface ReviewSnapshot {
  submission: CodingSubmission;
  failedTestCases: any[];
  runtimeGraph: ReviewGraphPoint[];
  memoryGraph: ReviewGraphPoint[];
  editorial: Editorial | null;
  aiTutorAvailable: boolean;
}

/**
 * Reusable Review Pipeline orchestrating the post-execution experience.
 */
export class ReviewPipeline {
  public async buildReview(submissionId: string): Promise<ReviewSnapshot> {
    
    // 1. Fetch Submission Data
    const submission = await this.fetchSubmission(submissionId);
    
    // 2. Aggregate Graphs (CQRS)
    const runtimeGraph = await this.fetchPercentileGraph(submission.problemId, 'runtimeMs');
    const memoryGraph = await this.fetchPercentileGraph(submission.problemId, 'memoryKb');
    
    // 3. Fetch Failed Cases
    const failedTests = await this.fetchFailedTests(submissionId);

    // 4. Fetch Editorial
    const editorial = await this.fetchEditorial(submission.problemId);

    return {
      submission,
      failedTestCases: failedTests,
      runtimeGraph,
      memoryGraph,
      editorial,
      aiTutorAvailable: editorial?.aiTutorEnabled ?? false
    };
  }

  // --- Stubs ---
  private async fetchSubmission(id: string): Promise<CodingSubmission> { return {} as any; }
  private async fetchPercentileGraph(probId: string, metric: string): Promise<ReviewGraphPoint[]> { return []; }
  private async fetchFailedTests(subId: string): Promise<any[]> { return []; }
  private async fetchEditorial(probId: string): Promise<Editorial | null> { return null; }
}
