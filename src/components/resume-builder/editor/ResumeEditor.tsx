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
    <section className="flex-1 bg-[#161616] overflow-y-auto p-8 print:hidden">
      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        {form.sections.map((section, index) => {
          try {
            const plugin = getSectionPlugin(section.type);
            const EditorComponent = plugin.editorComponent;
            
            return (
              <div key={section.id} className={`bg-black/40 border ${section.visible ? 'border-white/10' : 'border-white/5 opacity-50'} rounded-xl overflow-hidden transition-all duration-300 shadow-xl`}>
                
                {/* Section Header (Drag Handle & Controls) */}
                <div className="bg-[#1a1a1a] px-4 py-3 border-b border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <button className="text-gray-600 hover:text-white transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <h3 className="font-semibold text-gray-200 uppercase tracking-wider text-xs">
                      {plugin.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleToggleVisibility(section.id)}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title={section.visible ? "Hide Section" : "Show Section"}
                    >
                      {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    {section.type !== 'personal' && (
                      <button 
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Editor Payload */}
                {section.visible && (
                  <div className="p-5">
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
              <div key={section.id} className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400 text-sm">
                Failed to load editor for section type: {section.type}
              </div>
            );
          }
        })}
      </div>
    </section>
  );
}
