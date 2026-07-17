import { SandboxProvider, ExecutionResult } from '../../contracts/sandbox';
import { ExecutionPolicy } from '../../contracts/execution';

/**
 * SandboxManager
 * Orchestrates SandboxProviders. The business logic never knows if we're using Docker, gVisor, or Firecracker.
 */
export class SandboxManager {
  private providers: Map<string, SandboxProvider> = new Map();

  public registerProvider(provider: SandboxProvider) {
    this.providers.set(provider.providerName, provider);
  }

  public async executeInSandbox(
    providerName: string, 
    policy: ExecutionPolicy, 
    command: string[],
    artifactUris: string[]
  ): Promise<ExecutionResult> {
    
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`SandboxProvider ${providerName} not registered.`);
    }

    // 1. Initialize Isolation
    const containerId = await provider.initializeContainer(policy);

    try {
      // 2. Mount Artifacts (e.g. source code, inputs)
      for (const uri of artifactUris) {
        await provider.copyArtifactToSandbox(containerId, uri);
      }

      // 3. Execute
      const result = await provider.executeCommand(containerId, command);
      return result;

    } finally {
      // 4. Destroy (Guaranteed cleanup)
      await provider.destroyContainer(containerId);
    }
  }
}
