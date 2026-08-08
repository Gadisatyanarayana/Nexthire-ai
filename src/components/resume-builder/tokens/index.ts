import { ThemeSettings, TypographySettings } from "../types";
import { getThemeConfig } from "../registries/ThemeRegistry";

export interface DesignTokens {
  colors: {
    primary: string;
    text: string;
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
  const actualTheme = getThemeConfig(theme.id || 'classic');
  
  return {
    colors: {
      primary: actualTheme.colors.primary,
      text: actualTheme.colors.text,
      accent: actualTheme.colors.accent,
      background: actualTheme.colors.background,
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
