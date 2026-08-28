export interface ResumeFontConfig {
  id: string;
  name: string;
  category: "Professional Sans" | "Elegant Serif" | "Academic" | "Creative" | "Developer";
  fontFamily: string;
  headingFontFamily?: string;
  recommendedFor: string[];
}

export const TypographyRegistry: Record<string, ResumeFontConfig> = {
  inter: {
    id: "inter",
    name: "Inter",
    category: "Professional Sans",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    recommendedFor: ["Software Engineer", "Product Management", "Tech Startups"],
  },
  roboto: {
    id: "roboto",
    name: "Roboto",
    category: "Professional Sans",
    fontFamily: "Roboto, Arial, sans-serif",
    recommendedFor: ["General Tech", "Engineering", "Data Science"],
  },
  arial: {
    id: "arial",
    name: "Arial / Helvetica",
    category: "Professional Sans",
    fontFamily: "Arial, Helvetica, sans-serif",
    recommendedFor: ["Traditional Corporate", "Finance", "Standard ATS"],
  },
  georgia: {
    id: "georgia",
    name: "Georgia",
    category: "Elegant Serif",
    fontFamily: "Georgia, serif",
    recommendedFor: ["Consulting", "Executive", "Legal"],
  },
  garamond: {
    id: "garamond",
    name: "Garamond",
    category: "Elegant Serif",
    fontFamily: "Garamond, 'Times New Roman', serif",
    recommendedFor: ["Publishing", "Literature", "Executive"],
  },
  merriweather: {
    id: "merriweather",
    name: "Merriweather",
    category: "Academic",
    fontFamily: "Merriweather, Georgia, serif",
    recommendedFor: ["Research", "Academia", "Ph.D. Candidates"],
  },
  playfair: {
    id: "playfair",
    name: "Playfair Display",
    category: "Creative",
    fontFamily: "'Playfair Display', Georgia, serif",
    recommendedFor: ["Design", "Marketing", "Portfolio Roles"],
  },
  jetbrains: {
    id: "jetbrains",
    name: "JetBrains Mono (Technical)",
    category: "Developer",
    fontFamily: "'JetBrains Mono', monospace",
    recommendedFor: ["Systems Engineering", "DevOps", "Backend Specialist"],
  },
};

export function getFontConfig(fontId?: string): ResumeFontConfig {
  return TypographyRegistry[fontId || "inter"] || TypographyRegistry["inter"];
}
