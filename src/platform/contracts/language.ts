export interface LanguageCapability {
  id: string;             
  name: string;           
  
  supportsCompile: boolean;
  supportsFormatting: boolean;
  supportsLinting: boolean;
  supportsInteractive: boolean; 
  supportsSQL: boolean;
  
  getCompilationCommand(filePath: string): string[]; 
  getExecutionCommand(artifactPath: string): string[];
}
