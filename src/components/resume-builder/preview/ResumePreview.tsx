import React from 'react';
import { ResumeDocument } from '../types';
import LayoutEngine from '../engine/LayoutEngine';
import { getThemeConfig } from '../registries/ThemeRegistry';

interface PreviewProps {
  form: ResumeDocument;
  zoom?: number;
}

export default function ResumePreview({ form, zoom = 0.85 }: PreviewProps) {
  // We still fetch the background color for the outer sheet boundary
  const themeConfig = getThemeConfig(form.theme?.id || 'classic');
  
  return (
    <aside className="flex-1 bg-[#0c0c0c] border-l border-white/10 p-8 overflow-y-auto print:block print:w-full print:p-0 print:border-none print:bg-white flex justify-center items-start">
      <div className="sticky top-4 flex flex-col items-center">
        <div 
          className="bg-white shadow-2xl print:shadow-none transition-all duration-300 ease-in-out relative"
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            marginBottom: `calc(11in * ${zoom - 1})`,
            backgroundColor: themeConfig.colors.background || '#ffffff'
          }}
        >
          <div className="w-full h-full" style={{ overflow: 'hidden' }}>
            <LayoutEngine form={form} />
          </div>
        </div>
      </div>
    </aside>
  );
}
