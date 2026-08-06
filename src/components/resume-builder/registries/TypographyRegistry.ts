export interface TypographyConfig {
  id: string;
  name: string;
  fontFamily: string;
}

export const TypographyRegistry: Record<string, TypographyConfig> = {
  "times": { id: "times", name: "Times New Roman", fontFamily: "'Times New Roman', Times, serif" },
  "garamond": { id: "garamond", name: "Garamond", fontFamily: "Garamond, serif" },
  "georgia": { id: "georgia", name: "Georgia", fontFamily: "Georgia, serif" },
  "inter": { id: "inter", name: "Inter", fontFamily: "'Inter', sans-serif" },
  "roboto": { id: "roboto", name: "Roboto", fontFamily: "'Roboto', sans-serif" },
  "helvetica": { id: "helvetica", name: "Helvetica", fontFamily: "Helvetica, Arial, sans-serif" },
  "arial": { id: "arial", name: "Arial", fontFamily: "Arial, sans-serif" },
  "calibri": { id: "calibri", name: "Calibri", fontFamily: "Calibri, sans-serif" },
  "poppins": { id: "poppins", name: "Poppins", fontFamily: "'Poppins', sans-serif" },
  "lato": { id: "lato", name: "Lato", fontFamily: "'Lato', sans-serif" },
};

export function getTypographyConfig(typographyId: string): TypographyConfig {
  return TypographyRegistry[typographyId] || TypographyRegistry["times"];
}
