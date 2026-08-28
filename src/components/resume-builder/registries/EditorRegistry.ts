export interface EditorSectionPlugin {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  defaultData: any;
  icon?: string;
}

export const EditorRegistry: Record<string, EditorSectionPlugin> = {};
