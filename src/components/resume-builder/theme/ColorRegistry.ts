export interface ResumeColorPalette {
  id: string;
  name: string;
  category: "Professional" | "Corporate" | "Creative" | "Warm";
  colors: {
    name: string;        // Main full name
    primary: string;     // Headings (H1, H2)
    body: string;        // Body text
    accent: string;       // Subtitles, dates, tech stack pills
    divider: string;      // Section line dividers
    bullets: string;      // Bullet dots
    background: string;   // Paper background (#ffffff)
    sidebarBg?: string;   // 2-column sidebar background
  };
}

export const ColorPaletteRegistry: Record<string, ResumeColorPalette> = {
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    category: "Professional",
    colors: {
      name: "#09090b",
      primary: "#18181b",
      body: "#27272a",
      accent: "#52525b",
      divider: "#e4e4e7",
      bullets: "#18181b",
      background: "#ffffff",
      sidebarBg: "#f4f4f5",
    },
  },
  navy: {
    id: "navy",
    name: "Classic Navy",
    category: "Corporate",
    colors: {
      name: "#0f172a",
      primary: "#1e3a8a",
      body: "#334155",
      accent: "#2563eb",
      divider: "#cbd5e1",
      bullets: "#1e3a8a",
      background: "#ffffff",
      sidebarBg: "#f8fafc",
    },
  },
  "royal-blue": {
    id: "royal-blue",
    name: "Royal Blue",
    category: "Corporate",
    colors: {
      name: "#1e1b4b",
      primary: "#1d4ed8",
      body: "#1f2937",
      accent: "#3b82f6",
      divider: "#dbeafe",
      bullets: "#1d4ed8",
      background: "#ffffff",
      sidebarBg: "#eff6ff",
    },
  },
  forest: {
    id: "forest",
    name: "Forest Green",
    category: "Corporate",
    colors: {
      name: "#064e3b",
      primary: "#047857",
      body: "#1f2937",
      accent: "#059669",
      divider: "#d1fae5",
      bullets: "#047857",
      background: "#ffffff",
      sidebarBg: "#ecfdf5",
    },
  },
  burgundy: {
    id: "burgundy",
    name: "Deep Burgundy",
    category: "Creative",
    colors: {
      name: "#4c0519",
      primary: "#881337",
      body: "#27272a",
      accent: "#be123c",
      divider: "#ffe4e6",
      bullets: "#881337",
      background: "#ffffff",
      sidebarBg: "#fff1f2",
    },
  },
  teal: {
    id: "teal",
    name: "Slate Teal",
    category: "Corporate",
    colors: {
      name: "#134e4a",
      primary: "#0f766e",
      body: "#1f2937",
      accent: "#0d9488",
      divider: "#ccfbf1",
      bullets: "#0f766e",
      background: "#ffffff",
      sidebarBg: "#f0fdfa",
    },
  },
  indigo: {
    id: "indigo",
    name: "Modern Indigo",
    category: "Professional",
    colors: {
      name: "#1e1b4b",
      primary: "#4338ca",
      body: "#1f2937",
      accent: "#6366f1",
      divider: "#e0e7ff",
      bullets: "#4338ca",
      background: "#ffffff",
      sidebarBg: "#eef2ff",
    },
  },
  warm: {
    id: "warm",
    name: "Warm Charcoal",
    category: "Warm",
    colors: {
      name: "#1c1917",
      primary: "#44403c",
      body: "#292524",
      accent: "#78716c",
      divider: "#e7e5e4",
      bullets: "#44403c",
      background: "#ffffff",
      sidebarBg: "#fafaf9",
    },
  },
};

export function getColorPalette(paletteId?: string): ResumeColorPalette {
  return ColorPaletteRegistry[paletteId || "navy"] || ColorPaletteRegistry["navy"];
}
