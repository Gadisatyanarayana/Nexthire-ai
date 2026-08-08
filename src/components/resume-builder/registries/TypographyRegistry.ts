export interface TypographyConfig {
  id: string;
  name: string;
  fontFamily: string;
  category: "Professional" | "Modern" | "Creative" | "Specialty";
  overrides?: {
    headingSize?: string;
    bodySize?: string;
    lineHeight?: string;
    letterSpacing?: string;
    paragraphSpacing?: string;
    sectionSpacing?: string;
    pageMargin?: string;
  };
}

export const TypographyRegistry: Record<string, TypographyConfig> = {
  // Professional
  "times": { id: "times", name: "Times New Roman", fontFamily: "'Times New Roman', Times, serif", category: "Professional" },
  "garamond": { id: "garamond", name: "Garamond", fontFamily: "Garamond, serif", category: "Professional" },
  "georgia": { id: "georgia", name: "Georgia", fontFamily: "Georgia, serif", category: "Professional" },
  "helvetica": { id: "helvetica", name: "Helvetica", fontFamily: "Helvetica, Arial, sans-serif", category: "Professional" },
  "arial": { id: "arial", name: "Arial", fontFamily: "Arial, sans-serif", category: "Professional" },
  "inter": { id: "inter", name: "Inter", fontFamily: "'Inter', sans-serif", category: "Professional" },
  "roboto": { id: "roboto", name: "Roboto", fontFamily: "'Roboto', sans-serif", category: "Professional" },
  "lora": { id: "lora", name: "Lora", fontFamily: "'Lora', serif", category: "Professional" },
  
  // Modern
  "calibri": { id: "calibri", name: "Calibri", fontFamily: "Calibri, sans-serif", category: "Modern" },
  "poppins": { id: "poppins", name: "Poppins", fontFamily: "'Poppins', sans-serif", category: "Modern" },
  "lato": { id: "lato", name: "Lato", fontFamily: "'Lato', sans-serif", category: "Modern" },
  "nunito": { id: "nunito", name: "Nunito", fontFamily: "'Nunito', sans-serif", category: "Modern" },
  "source-sans": { id: "source-sans", name: "Source Sans 3", fontFamily: "'Source Sans 3', sans-serif", category: "Modern" },
  "dm-sans": { id: "dm-sans", name: "DM Sans", fontFamily: "'DM Sans', sans-serif", category: "Modern" },
  
  // Creative
  "playfair": { id: "playfair", name: "Playfair Display", fontFamily: "'Playfair Display', serif", category: "Creative" },
  
  // Specialty
  "fira-code": { id: "fira-code", name: "Fira Code", fontFamily: "'Fira Code', monospace", category: "Specialty" },
  "jetbrains": { id: "jetbrains", name: "JetBrains Mono", fontFamily: "'JetBrains Mono', monospace", category: "Specialty" },
};

export function getTypographyConfig(typographyId: string): TypographyConfig {
  return TypographyRegistry[typographyId] || TypographyRegistry["times"];
}
