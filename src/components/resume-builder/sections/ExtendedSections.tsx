import React from "react";
import { ResumeSection } from "../types";
import { SectionPlugin } from "../registries/SectionRegistry";
import { Plus, Trash2 } from "lucide-react";

function DummyRenderer() {
  return null;
}

// ---------------------------------------------------------
// 1. CERTIFICATIONS SECTION
// ---------------------------------------------------------
function CertificationsEditor({ section, updateSection }: { section: ResumeSection; updateSection: (data: any) => void }) {
  const items = section.data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-300">Certifications & Licenses</label>
        <button
          type="button"
          onClick={() =>
            updateSection({
              ...section.data,
              items: [...items, { id: Date.now().toString(), name: "", issuer: "", date: "", url: "" }],
            })
          }
          className="text-xs text-brand-blue flex items-center gap-1 font-semibold hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add Certification
        </button>
      </div>

      {items.map((item: any, idx: number) => (
        <div key={item.id || idx} className="bg-[#151515] p-4 rounded-xl border border-white/10 space-y-3 relative group">
          <button
            type="button"
            onClick={() => updateSection({ ...section.data, items: items.filter((_: any, i: number) => i !== idx) })}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div>
              <label className="text-[11px] text-gray-400">Certification Name</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="AWS Certified Developer / Oracle Java"
                value={item.name || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].name = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Issuing Organization</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="Amazon Web Services / Coursera"
                value={item.issuer || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].issuer = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Issue Date / Year</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="2025"
                value={item.date || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].date = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Credential URL (Optional)</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="https://aws.amazon.com/verify/..."
                value={item.url || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].url = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const CertificationsSectionPlugin: SectionPlugin = {
  id: "certifications",
  name: "Certifications",
  icon: "award",
  description: "Licenses and professional certificates",
  defaultData: { items: [] },
  editorComponent: CertificationsEditor,
  renderComponent: DummyRenderer,
};

// ---------------------------------------------------------
// 2. PUBLICATIONS SECTION
// ---------------------------------------------------------
function PublicationsEditor({ section, updateSection }: { section: ResumeSection; updateSection: (data: any) => void }) {
  const items = section.data?.items || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-300">Publications & Research Papers</label>
        <button
          type="button"
          onClick={() =>
            updateSection({
              ...section.data,
              items: [...items, { id: Date.now().toString(), title: "", publisher: "", date: "", url: "" }],
            })
          }
          className="text-xs text-brand-blue flex items-center gap-1 font-semibold hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add Publication
        </button>
      </div>

      {items.map((item: any, idx: number) => (
        <div key={item.id || idx} className="bg-[#151515] p-4 rounded-xl border border-white/10 space-y-3 relative group">
          <button
            type="button"
            onClick={() => updateSection({ ...section.data, items: items.filter((_: any, i: number) => i !== idx) })}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div className="col-span-2">
              <label className="text-[11px] text-gray-400">Paper / Book Title</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="Real-Time LLM Optimization using Quantization"
                value={item.title || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].title = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Publisher / Conference / Journal</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="IEEE / Springer / ArXiv"
                value={item.publisher || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].publisher = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Publication Date</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="May 2025"
                value={item.date || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].date = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const PublicationsSectionPlugin: SectionPlugin = {
  id: "publications",
  name: "Publications",
  icon: "book-open",
  description: "Research papers and published works",
  defaultData: { items: [] },
  editorComponent: PublicationsEditor,
  renderComponent: DummyRenderer,
};

// ---------------------------------------------------------
// 3. ACHIEVEMENTS SECTION
// ---------------------------------------------------------
function AchievementsEditor({ section, updateSection }: { section: ResumeSection; updateSection: (data: any) => void }) {
  const items = section.data?.items || [];
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-300">Honors, Awards & Achievements</label>
        <button
          type="button"
          onClick={() =>
            updateSection({
              ...section.data,
              items: [...items, { id: Date.now().toString(), title: "", issuer: "", date: "" }],
            })
          }
          className="text-xs text-brand-blue flex items-center gap-1 font-semibold hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Add Achievement
        </button>
      </div>

      {items.map((item: any, idx: number) => (
        <div key={item.id || idx} className="bg-[#151515] p-4 rounded-xl border border-white/10 space-y-3 relative group">
          <button
            type="button"
            onClick={() => updateSection({ ...section.data, items: items.filter((_: any, i: number) => i !== idx) })}
            className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="grid grid-cols-2 gap-3 pr-6">
            <div>
              <label className="text-[11px] text-gray-400">Achievement / Award Name</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="1st Rank in Smart India Hackathon"
                value={item.title || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].title = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400">Issuer / Organization</label>
              <input
                className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-brand-blue mt-0.5"
                placeholder="Govt. of India / College Dean"
                value={item.issuer || ""}
                onChange={(e) => {
                  const newItems = [...items];
                  newItems[idx].issuer = e.target.value;
                  updateSection({ ...section.data, items: newItems });
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const AchievementsSectionPlugin: SectionPlugin = {
  id: "achievements",
  name: "Achievements",
  icon: "trophy",
  description: "Honors, hackathon wins & awards",
  defaultData: { items: [] },
  editorComponent: AchievementsEditor,
  renderComponent: DummyRenderer,
};
