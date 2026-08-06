import React from 'react';
import { ResumeData } from '../types';
import TemplateRenderer from '../TemplateRenderer';
import { getTemplateConfig } from '../registries/TemplateRegistry';
import { getThemeConfig } from '../registries/ThemeRegistry';
import { getTypographyConfig } from '../registries/TypographyRegistry';
import { ResumeTemplateConfig } from '../templates/JakesResume';

interface PreviewProps {
  form: ResumeData;
}

export default function ResumePreview({ form }: PreviewProps) {
  const templateConfig = getTemplateConfig(form.templateId);
  const themeConfig = getThemeConfig(form.themeId);
  
  // Create a deeply merged dynamic config
  const dynamicConfig: ResumeTemplateConfig = {
    ...templateConfig,
    styles: {
      ...templateConfig.styles,
      fontFamily: form.typography?.fontFamily || templateConfig.styles.fontFamily,
      colors: {
        text: themeConfig.colors.text,
        primary: themeConfig.colors.primary,
      }
    }
  };

  return (
    <aside className="flex-1 bg-[#0c0c0c] border-l border-white/10 p-8 overflow-y-auto print:block print:w-full print:p-0 print:border-none print:bg-white flex justify-center items-start">
      <div className="sticky top-4 flex flex-col items-center">
        <div 
          className="bg-white shadow-2xl print:shadow-none transition-all duration-300 ease-in-out"
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: 'scale(0.85)',
            transformOrigin: 'top center',
            marginBottom: '-1.5in', // offset for scale
            backgroundColor: themeConfig.colors.background // Apply paper background from theme
          }}
        >
          <TemplateRenderer form={form} config={dynamicConfig} className="w-full h-full" />
        </div>
      </div>
    </aside>
  );
}
