import { BaseLLMProvider } from "../llm/BaseLLMProvider";

export interface SandboxExecutionResult {
  compiled: boolean;
  compileError?: string;
  passedAllTests: boolean;
  failedTestsCount: number;
  runtimeComplexity?: string;
  memoryComplexity?: string;
  executionLogs: string[];
}

export interface VerificationOptions {
  maxRetries?: number;
  language?: string;
}

export class VerificationLoop {
  private llm: BaseLLMProvider;
  private maxRetries: number;

  constructor(llm: BaseLLMProvider, options: VerificationOptions = {}) {
    this.llm = llm;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Generates a solution, compiles it, and tests it.
   * If it fails, it feeds the compilation/test errors back to the LLM for regeneration.
   */
  async generateAndVerifySolution(
    problemPrompt: string, 
    testCases: any[], 
    language: string
  ): Promise<{ success: boolean; finalCode?: string; error?: string }> {
    
    let attempts = 0;
    let currentPrompt = problemPrompt;

    while (attempts < this.maxRetries) {
      console.log(`Verification Loop: Attempt ${attempts + 1} for ${language}...`);
      
      // 1. Generate Solution
      const generatedCode = await this.llm.generateText(currentPrompt);

      // 2. Compile & Run Tests in Sandbox
      const execResult = await this.executeInSandbox(generatedCode, testCases, language);

      if (execResult.compiled && execResult.passedAllTests) {
        console.log(`Verification Loop: Success on attempt ${attempts + 1}!`);
        return { success: true, finalCode: generatedCode };
      }

      // 3. Construct Feedback Prompt for Regeneration
      attempts++;
      currentPrompt = `
        Your previous solution failed.
        Code:
        ${generatedCode}
        
        Compile Error: ${execResult.compileError || "None"}
        Tests Failed: ${execResult.failedTestsCount}
        Logs: ${execResult.executionLogs.join("\\n")}
        
        Please provide a corrected optimal solution.
      `;
    }

    return { success: false, error: `Failed after ${this.maxRetries} attempts.` };
  }

  /**
   * Wraps the local Node child_process or external Judge0/Piston API.
   */
  private async executeInSandbox(code: string, testCases: any[], language: string): Promise<SandboxExecutionResult> {
    // In production, this connects to the isolated Sandbox Executor.
    // For scaffolding, we mock a successful execution.
    return {
      compiled: true,
      passedAllTests: true,
      failedTestsCount: 0,
      executionLogs: ["Mock successful execution."]
    };
  }
}
