import React from 'react';
import { ResumeDocument, ResumeSection } from '../types';
import { getSectionPlugin } from '../registries/SectionRegistry';
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react';

interface EditorProps {
  form: ResumeDocument;
  updateField: (field: keyof ResumeDocument, value: any) => void;
}

export default function ResumeEditor({ form, updateField }: EditorProps) {
  
  const handleUpdateSection = (sectionId: string, newData: any) => {
    const newSections = form.sections.map(s => s.id === sectionId ? { ...s, data: newData } : s);
    updateField("sections", newSections);
  };

  const handleToggleVisibility = (sectionId: string) => {
    const newSections = form.sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s);
    updateField("sections", newSections);
  };

  const handleDeleteSection = (sectionId: string) => {
    const newSections = form.sections.filter(s => s.id !== sectionId);
    updateField("sections", newSections);
  };

  return (
    <section className="flex-1 bg-transparent overflow-y-auto p-8 md:p-12 print:hidden custom-scrollbar relative z-10">
      <div className="max-w-3xl mx-auto space-y-6 pb-32">
        {form.sections.map((section, index) => {
          try {
            const plugin = getSectionPlugin(section.type);
            const EditorComponent = plugin.editorComponent;
            
            return (
              <div key={section.id} className={`bg-[var(--studio-surface)] border ${section.visible ? 'border-[var(--studio-border)] hover:border-gray-300 dark:hover:border-white/20 shadow-sm hover:shadow' : 'border-[var(--studio-border)] opacity-50 hover:opacity-75'} rounded-xl overflow-hidden transition-all duration-300 relative group/card`}>
                
                {/* Section Header (Drag Handle & Controls) */}
                <div className="bg-gray-50/80 dark:bg-black/20 px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-grab active:cursor-grabbing p-1 -ml-1">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                      {plugin.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => handleToggleVisibility(section.id)}
                      className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                      title={section.visible ? "Hide Section" : "Show Section"}
                    >
                      {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    {section.type !== 'personal' && (
                      <button 
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Editor Payload */}
                {section.visible && (
                  <div className="p-6">
                    <EditorComponent 
                      section={section} 
                      updateSection={(data) => handleUpdateSection(section.id, data)} 
                    />
                  </div>
                )}
              </div>
            );
          } catch (e) {
            return (
              <div key={section.id} className="p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">
                Failed to load editor for section type: {section.type}
              </div>
            );
          }
        })}
      </div>
    </section>
  );
}
