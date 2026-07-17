export interface Compiler {
  compile(sourceCodeUri: string, language: string): Promise<CompilationResult>;
}

export interface CompilationResult {
  success: boolean;
  executableUri?: string;
  compilerLogUri?: string;
  error?: string;
}

export interface Runner {
  run(executableUri: string, inputUri: string, policy: any): Promise<any>;
}
