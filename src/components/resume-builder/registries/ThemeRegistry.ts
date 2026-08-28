export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string; // Used for names, main headings (e.g. #000000)
    text: string;    // Main body text (e.g. #333333)
    accent: string;  // Subtle dividers, dates (e.g. #666666)
    background: string; // Paper background (e.g. #ffffff)
  };
  style?: {
    headerStyle?: "minimal" | "block" | "underline";
    dividerStyle?: "none" | "thin" | "thick" | "dashed";
    bulletStyle?: "disc" | "circle" | "square" | "none";
    borderRadius?: string;
  };
}

export const ThemeRegistry: Record<string, ThemeConfig> = {
  "classic": {
    id: "classic",
    name: "Classic Black",
    colors: {
      primary: "#000000",
      text: "#111827",
      accent: "#4B5563",
      background: "#ffffff"
    }
  },
  "corporate-blue": {
    id: "corporate-blue",
    name: "Corporate Blue",
    colors: {
      primary: "#1E3A8A",
      text: "#111827",
      accent: "#1D4ED8",
      background: "#ffffff"
    }
  },
  "google": {
    id: "google",
    name: "Google (Grey/Blue)",
    colors: {
      primary: "#1a73e8",
      text: "#202124",
      accent: "#5f6368",
      background: "#ffffff"
    }
  },
  "dark": {
    id: "dark",
    name: "Dark Mode Minimal",
    colors: {
      primary: "#ffffff",
      text: "#d1d5db",
      accent: "#9ca3af",
      background: "#121212"
    }
  }
};

export function getThemeConfig(themeId: string): ThemeConfig {
  return ThemeRegistry[themeId] || ThemeRegistry["classic"];
}
