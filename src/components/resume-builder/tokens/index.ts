import { ThemeSettings, TypographySettings } from "../types";

export interface DesignTokens {
  colors: {
    primary: string;
    accent: string;
    background: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSize: string;
    bodySize: string;
    lineHeight: number;
    letterSpacing: string;
    paragraphGap: string;
    sectionGap: string;
    columns: number;
  };
  layout: {
    headerStyle: string;
    sectionDivider: string;
    bulletStyle: string;
    borderRadius: string;
    iconPack: string;
    shadow: string;
    pageMargins: string;
  };
}

export function generateTokens(theme: ThemeSettings, typography: TypographySettings): DesignTokens {
  return {
    colors: {
      primary: theme.primaryColor,
      accent: theme.accentColor,
      background: theme.backgroundColor,
    },
    typography: {
      ...typography
    },
    layout: {
      headerStyle: theme.headerStyle,
      sectionDivider: theme.sectionDivider,
      bulletStyle: theme.bulletStyle,
      borderRadius: theme.borderRadius,
      iconPack: theme.iconPack,
      shadow: theme.shadow,
      pageMargins: typography.pageMargins,
    }
  };
}
