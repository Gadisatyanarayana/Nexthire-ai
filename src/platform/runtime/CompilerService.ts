import { Compiler, CompilationResult } from '../contracts/runtime';
import { LanguageCapability } from '../contracts/language';
import { SandboxManager } from '../coding/sandbox/SandboxManager';
import { ExecutionPolicy } from '../contracts/execution';

export class CompilerService implements Compiler {
  constructor(
    private languageRegistry: Map<string, LanguageCapability>,
    private sandboxManager: SandboxManager
  ) {}

  public async compile(sourceCodeUri: string, languageId: string): Promise<CompilationResult> {
    const lang = this.languageRegistry.get(languageId);
    
    if (!lang) {
      return { success: false, error: `Language ${languageId} not supported.` };
    }

    if (!lang.supportsCompile) {
      // Interpreted languages (Python, JS) bypass compilation
      return { success: true, executableUri: sourceCodeUri };
    }

    const compileCommand = lang.getCompilationCommand('/sandbox/source');
    
    // Generous policy for compilation
    const compilePolicy: ExecutionPolicy = {
      cpuCores: 2,
      wallClockTimeMs: 15000,
      cpuTimeMs: 10000,
      memoryLimitKb: 512000,
      maxProcesses: 50,
      maxThreads: 50,
      maxFileSizeKb: 50000,
      networkEnabled: false,
      allowedEnvVars: []
    };

    const result = await this.sandboxManager.executeInSandbox(
      'default', // Provider
      compilePolicy,
      compileCommand,
      [sourceCodeUri]
    );

    if (result.exitCode === 0) {
      return { 
        success: true, 
        executableUri: 's3://artifacts/compiled_blob',
        compilerLogUri: result.stderrUri
      };
    } else {
      return {
        success: false,
        compilerLogUri: result.stderrUri,
        error: 'Compilation Failed'
      };
    }
  }
}
