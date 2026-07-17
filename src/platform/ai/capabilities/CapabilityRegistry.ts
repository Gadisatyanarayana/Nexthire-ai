import { Capability } from '../contracts/capability';

export class CapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();

  public register(capability: Capability) {
    this.capabilities.set(capability.name, capability);
  }

  public getCapability(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  public resolveAgents(capabilityName: string): string[] {
    const cap = this.getCapability(capabilityName);
    if (!cap) throw new Error(`Capability ${capabilityName} not found`);
    return cap.requiredAgents;
  }
}
