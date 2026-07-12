import { IPlugin, PluginState } from "../learning/kernel/PluginState";

export class PluginManager {
  private static plugins: Map<string, IPlugin> = new Map();

  public static registerPlugin(plugin: IPlugin): void {
    const manifest = plugin.getManifest();
    if (this.plugins.has(manifest.id)) {
      console.warn(`[PluginManager] Plugin ${manifest.id} is already registered.`);
      return;
    }
    this.plugins.set(manifest.id, plugin);
    console.log(`[PluginManager] Registered plugin: ${manifest.displayName} (${manifest.id})`);
  }

  public static async initializeAll(): Promise<void> {
    for (const [id, plugin] of this.plugins.entries()) {
      if (plugin.getState() === PluginState.REGISTERED) {
        console.log(`[PluginManager] Initializing plugin: ${id}`);
        await plugin.initialize();
      }
    }
  }

  public static getPlugin(id: string): IPlugin | undefined {
    return this.plugins.get(id);
  }

  public static async shutdownAll(): Promise<void> {
    for (const [id, plugin] of this.plugins.entries()) {
      console.log(`[PluginManager] Shutting down plugin: ${id}`);
      await plugin.shutdown();
    }
  }
}
