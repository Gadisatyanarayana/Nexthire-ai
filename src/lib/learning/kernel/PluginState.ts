export enum PluginState {
  REGISTERED,
  INITIALIZING,
  READY,
  DEGRADED,
  FAILED,
  DISABLED
}

export interface PluginCapabilities {
  hasLearning: boolean;
  hasPractice: boolean;
  hasMockTests: boolean;
  hasCompanyPrep: boolean;
  hasAIIntegration: boolean;
  hasCertificates: boolean;
  hasGamification: boolean;
  hasAnalytics: boolean;
  hasRevision: boolean;
  hasRoadmap: boolean;
  hasSearch: boolean;
}

export interface PluginManifest {
  id: string;
  version: string;
  schemaVersion: string;
  contentVersion: string;
  displayName: string;
  capabilities: PluginCapabilities;
  dependencies: string[];
  minimumKernelVersion: string;
  minimumDatabaseVersion: string;
  apiVersion: string;
}
export interface IPlugin {
  getManifest(): PluginManifest;
  initialize(): Promise<void>;
  getState(): PluginState;
  shutdown(): Promise<void>;
}
