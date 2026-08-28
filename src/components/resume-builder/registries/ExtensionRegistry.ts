export interface ExtensionPlugin {
  id: string;
  name: string;
  version: string;
  initialize: () => void;
}

export const ExtensionRegistry: Record<string, ExtensionPlugin> = {};
