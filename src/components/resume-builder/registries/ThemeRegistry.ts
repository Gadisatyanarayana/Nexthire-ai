export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string; // Used for names, main headings
    text: string;    // Main body text
    accent: string;  // Subtle dividers, dates
    background: string; // Paper background
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
      primary: "text-black",
      text: "text-gray-900",
      accent: "text-gray-600",
      background: "bg-white"
    }
  },
  "corporate-blue": {
    id: "corporate-blue",
    name: "Corporate Blue",
    colors: {
      primary: "text-blue-900",
      text: "text-gray-900",
      accent: "text-blue-700",
      background: "bg-white"
    }
  },
  "google": {
    id: "google",
    name: "Google (Grey/Blue)",
    colors: {
      primary: "text-[#1a73e8]",
      text: "text-[#202124]",
      accent: "text-[#5f6368]",
      background: "bg-white"
    }
  },
  "dark": {
    id: "dark",
    name: "Dark Mode Minimal",
    colors: {
      primary: "text-white",
      text: "text-gray-300",
      accent: "text-gray-400",
      background: "bg-[#121212]"
    }
  }
};

export function getThemeConfig(themeId: string): ThemeConfig {
  return ThemeRegistry[themeId] || ThemeRegistry["classic"];
}
