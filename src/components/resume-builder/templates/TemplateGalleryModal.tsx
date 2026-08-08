import React, { useState } from "react";
import { ProductionTemplates, FullTemplateConfig } from "./config/TemplateDefinitions";
import { ResumeDocument } from "../types";
import TemplateCard from "./TemplateCard";
import { X, Search, Sparkles, Filter } from "lucide-react";

interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
  document: ResumeDocument;
  onSelectTemplate: (templateId: string) => void;
}

type FilterCategory = "ALL" | "STUDENT" | "WITH_PHOTO" | "NO_PHOTO" | "ATS_FRIENDLY" | "TECHNICAL" | "CORPORATE" | "ACADEMIC" | "CREATIVE" | "EXECUTIVE";

export default function TemplateGalleryModal({ isOpen, onClose, document, onSelectTemplate }: GalleryProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const templatesList = Object.values(ProductionTemplates);

  const filteredTemplates = templatesList.filter((template) => {
    // Search query filter
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.recommendedRoles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Category filter
    if (activeCategory === "ALL") return true;
    if (activeCategory === "WITH_PHOTO") return template.supportsPhoto === true;
    if (activeCategory === "NO_PHOTO") return template.supportsPhoto === false;
    if (activeCategory === "ATS_FRIENDLY") return template.columns === 1;
    if (activeCategory === "TECHNICAL") return template.category === "TECHNICAL";
    if (activeCategory === "STUDENT") return template.category === "STUDENT";
    if (activeCategory === "CORPORATE") return template.category === "CORPORATE";
    if (activeCategory === "ACADEMIC") return template.category === "ACADEMIC";
    if (activeCategory === "CREATIVE") return template.category === "CREATIVE";
    if (activeCategory === "EXECUTIVE") return template.category === "EXECUTIVE";

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-[#0D0D0D] border border-white/10 w-full max-w-6xl h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#111111]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-blue" /> Production Resume Templates
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Choose from 12+ production templates engineered for students, campus placements, and software engineers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Filters & Search */}
        <div className="p-4 bg-[#141414] border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scrollbar">
            {[
              { id: "ALL", label: "All Templates" },
              { id: "STUDENT", label: "🎓 Campus & Student" },
              { id: "WITH_PHOTO", label: "🖼️ With Photo" },
              { id: "NO_PHOTO", label: "📄 No Photo (ATS)" },
              { id: "TECHNICAL", label: "💻 Software Engineer" },
              { id: "CORPORATE", label: "🏢 Corporate" },
              { id: "ACADEMIC", label: "📚 Academic / Research" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as FilterCategory)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  activeCategory === tab.id
                    ? "bg-brand-blue text-white shadow-md"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles or templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        {/* Templates Grid Container */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#0A0A0A]">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Filter className="w-10 h-10 text-gray-600 mb-3" />
              <h3 className="text-sm font-semibold text-gray-300">No templates found</h3>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tmpl) => (
                <TemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  document={document}
                  isSelected={document.metadata?.templateId === tmpl.id}
                  onSelect={(id) => {
                    onSelectTemplate(id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#111111] border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span>Active Template: <strong className="text-white">{document.metadata?.templateId}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-brand-blue/90 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
