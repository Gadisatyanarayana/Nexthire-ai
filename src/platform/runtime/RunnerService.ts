import { Runner } from '../contracts/runtime';
import { SandboxManager } from '../coding/sandbox/SandboxManager';
import { LanguageCapability } from '../contracts/language';
import { ExecutionPolicy } from '../contracts/execution';
import { ExecutionResult } from '../contracts/sandbox';

export class RunnerService implements Runner {
  constructor(
    private languageRegistry: Map<string, LanguageCapability>,
    private sandboxManager: SandboxManager
  ) {}

  public async run(
    executableUri: string, 
    inputUri: string, 
    policy: ExecutionPolicy,
    languageId: string
  ): Promise<ExecutionResult> {
    
    const lang = this.languageRegistry.get(languageId);
    if (!lang) {
      throw new Error(`Language ${languageId} not supported.`);
    }

    const execCommand = lang.getExecutionCommand('/sandbox/executable');
    
    // Inject input into the runner (e.g. via stdin pipe in the sandbox adapter)
    const result = await this.sandboxManager.executeInSandbox(
      'default',
      policy,
      execCommand,
      [executableUri, inputUri]
    );

    return result;
  }
}
