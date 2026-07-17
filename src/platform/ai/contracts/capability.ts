export interface Capability {
  id: string;
  name: string; // e.g. "Schedule Mock", "Explain Question"
  description: string;
  requiredAgents: string[];
}
