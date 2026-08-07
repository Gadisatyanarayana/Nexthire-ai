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
    <aside className="flex-1 bg-transparent border-l border-white/5 p-10 overflow-y-auto print:block print:w-full print:p-0 print:border-none print:bg-white flex justify-center items-start custom-scrollbar relative z-10">
      <div className="sticky top-8 flex flex-col items-center pb-20">
        <div 
          className="bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] ring-1 ring-white/10 print:shadow-none print:ring-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative"
          style={{
            width: '8.5in',
            minHeight: '11in',
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            marginBottom: `calc(11in * ${zoom - 1})`,
            backgroundColor: themeConfig.colors.background || '#ffffff'
          }}
        >
          {/* Subtle paper texture overlay (optional) */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-multiply print:hidden"></div>
          
          <div className="w-full h-full relative z-10" style={{ overflow: 'hidden' }}>
            <LayoutEngine form={form} />
          </div>
        </div>
      </div>
    </aside>
  );
}
