import { JudgeVerdict, OutputComparator, TestCaseResult } from '../../contracts/judge';
import { RunnerService } from '../../runtime/RunnerService';
import { ExecutionPolicy } from '../../contracts/execution';
import { CodingTestCase } from '../../contracts/testcase';

export class VerdictAssembler {
  constructor(
    private runner: RunnerService,
    private comparator: OutputComparator
  ) {}

  public async evaluateSubmission(
    executableUri: string,
    testCases: CodingTestCase[],
    policy: ExecutionPolicy,
    languageId: string
  ): Promise<JudgeVerdict> {
    
    let overallVerdict: JudgeVerdict['status'] = 'AC';
    const results: TestCaseResult[] = [];
    let maxRuntime = 0;
    let maxMemory = 0;
    let passedEdgeCases = true;

    for (const test of testCases) {
      const execResult = await this.runner.run(executableUri, test.inputData, policy, languageId);

      maxRuntime = Math.max(maxRuntime, execResult.cpuTimeMs);
      maxMemory = Math.max(maxMemory, execResult.memoryPeakKb);

      // Check Resource Judge
      if (execResult.cpuTimeMs > policy.cpuTimeMs || execResult.cpuTimeMs > policy.wallClockTimeMs) {
        overallVerdict = 'TLE';
        results.push(this.failTest(test.id, 'TLE', execResult));
        passedEdgeCases = false;
        continue;
      }
      if (execResult.memoryPeakKb > policy.memoryLimitKb) {
        overallVerdict = 'MLE';
        results.push(this.failTest(test.id, 'MLE', execResult));
        passedEdgeCases = false;
        continue;
      }
      if (execResult.exitCode !== 0) {
        overallVerdict = 'RE';
        results.push(this.failTest(test.id, 'RE', execResult));
        passedEdgeCases = false;
        continue;
      }

      // Check Output Comparator
      const match = await this.comparator.compare(test.expectedOutput, execResult.stdoutUri!);
      
      if (!match) {
        overallVerdict = 'WA';
        results.push(this.failTest(test.id, 'WA', execResult));
        passedEdgeCases = false;
        continue;
      }

      // AC for this test case
      results.push({
        testCaseId: test.id,
        passed: true,
        actualOutputUri: execResult.stdoutUri,
        runtimeMs: execResult.cpuTimeMs,
        memoryKb: execResult.memoryPeakKb
      });
    }

    return {
      status: overallVerdict,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      passedEdgeCases,
      testCaseResults: results
    };
  }

  private failTest(testId: string, error: string, execResult: any): TestCaseResult {
    return {
      testCaseId: testId,
      passed: false,
      actualOutputUri: execResult.stdoutUri,
      runtimeMs: execResult.cpuTimeMs,
      memoryKb: execResult.memoryPeakKb,
      error
    };
  }
}
