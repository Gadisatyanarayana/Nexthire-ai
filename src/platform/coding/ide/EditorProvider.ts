/**
 * Editor Configuration Profile
 * Agnostic of Monaco. Allows us to swap IDE cores later without rebuilding the frontend state.
 */
export interface EditorProfile {
  theme: 'dark' | 'light' | 'high-contrast';
  keybindings: 'standard' | 'vim' | 'emacs';
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autocomplete: boolean;
  formatOnSave: boolean;
  snippetsEnabled: boolean;
}

export interface EditorAdapter {
  mount(containerId: string, initialCode: string, language: string, profile: EditorProfile): void;
  getValue(): string;
  setValue(code: string): void;
  setLanguage(language: string): void;
  applyTheme(theme: string): void;
  dispose(): void;
}
