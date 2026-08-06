"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2, Save, Sparkles, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { saveUserData, supabase } from "@/lib/supabase";
import TemplateRenderer from "@/components/resume-builder/TemplateRenderer";
import { jakesResumeConfig } from "@/components/resume-builder/templates/JakesResume";

type TemplateSection = "professional" | "friendly" | "ats";
type TemplateStyle = "minimal" | "modern" | "ats";

type ResumeTemplate = {
  id: string;
  name: string;
  category: TemplateSection;
  style: TemplateStyle;
  tone: string;
  summarySeed: string;
};

type StepKey = "student" | "professional" | "experience";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  dateOfBirth: string;
  currentSemester: string;
  linkedin: string;
  github: string;
  portfolio: string;
  degree: string;
  college: string;
  graduationYear: string;
  cgpa: string;
  targetRole: string;
  summary: string;
  technicalSkills: string;
  softSkills: string;
  certifications: string;
  preferredLocations: string;
  expectedCtc: string;
  internshipCompany: string;
  internshipRole: string;
  internshipDuration: string;
  internshipAchievements: string;
  projectTitle: string;
  projectTech: string;
  projectDescription: string;
  leadership: string;
  coursework: string;
  achievements: string;
  hackathons: string;
  openSource: string;
  languages: string;
};

type ImproveResponse = {
  improvedText?: string;
  error?: string;
};

type AutofillResponse = {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  degree?: string;
  college?: string;
  graduationYear?: string;
  summary?: string;
  technicalSkills?: string;
  projectDescription?: string;
  internshipAchievements?: string;
  missingFields?: string[];
  extractionSource?: string;
  extractedChars?: number;
  qualityHint?: string;
  error?: string;
};

const TEMPLATE_LIBRARY: Record<TemplateSection, ResumeTemplate[]> = {
  professional: [
    { id: "pro-1", name: "Executive Slate", category: "professional", style: "modern", tone: "corporate", summarySeed: "Results-driven engineer focused on scalable systems and measurable delivery outcomes." },
    { id: "pro-2", name: "Consulting Edge", category: "professional", style: "minimal", tone: "strategy", summarySeed: "Analytical candidate with strong execution discipline, stakeholder communication, and delivery rigor." },
    { id: "pro-3", name: "Product Ops", category: "professional", style: "modern", tone: "product", summarySeed: "Product-focused builder blending user empathy, experimentation, and technical execution." },
    { id: "pro-4", name: "Data Vertical", category: "professional", style: "ats", tone: "data", summarySeed: "Data-oriented engineer skilled in pipelines, metrics, and evidence-based decision making." },
    { id: "pro-5", name: "Enterprise Prime", category: "professional", style: "ats", tone: "enterprise", summarySeed: "Enterprise-ready profile emphasizing reliability, ownership, and systems thinking." },
    { id: "pro-6", name: "Fintech Grid", category: "professional", style: "minimal", tone: "fintech", summarySeed: "Detail-oriented technologist with secure architecture and high-accuracy delivery mindset." },
    { id: "pro-7", name: "Cloud Authority", category: "professional", style: "ats", tone: "cloud", summarySeed: "Cloud-first engineer experienced in deployment automation, observability, and optimization." },
    { id: "pro-8", name: "Growth Architect", category: "professional", style: "modern", tone: "growth", summarySeed: "Impact-led engineer improving adoption, retention, and feature quality through iterative delivery." },
    { id: "pro-9", name: "Systems Brief", category: "professional", style: "minimal", tone: "systems", summarySeed: "Systems-minded developer focused on performance, maintainability, and production quality." },
    { id: "pro-10", name: "Leadership Deck", category: "professional", style: "modern", tone: "leadership", summarySeed: "Collaborative builder known for ownership, mentoring, and high-trust execution." },
  ],
  friendly: [
    { id: "fr-1", name: "Warm Starter", category: "friendly", style: "modern", tone: "human", summarySeed: "Curious and collaborative engineer who enjoys building practical solutions for real users." },
    { id: "fr-2", name: "Campus Story", category: "friendly", style: "minimal", tone: "student", summarySeed: "Final-year student passionate about coding, teamwork, and solving real-world product problems." },
    { id: "fr-3", name: "Creative Intro", category: "friendly", style: "modern", tone: "creative", summarySeed: "Creative developer balancing strong fundamentals with thoughtful user-first implementation." },
    { id: "fr-4", name: "Mentor Mode", category: "friendly", style: "minimal", tone: "community", summarySeed: "Community-oriented technologist who contributes through collaboration, mentoring, and clean code." },
    { id: "fr-5", name: "Builder Buddy", category: "friendly", style: "modern", tone: "builder", summarySeed: "Hands-on builder eager to ship useful features and continuously improve through feedback." },
    { id: "fr-6", name: "Simple Narrative", category: "friendly", style: "ats", tone: "clear", summarySeed: "Clear communicator with consistent project execution and an outcomes-first engineering approach." },
    { id: "fr-7", name: "Portfolio Light", category: "friendly", style: "modern", tone: "portfolio", summarySeed: "Portfolio-driven candidate with practical projects and strong implementation discipline." },
    { id: "fr-8", name: "Internship Ready", category: "friendly", style: "ats", tone: "intern", summarySeed: "Internship-ready profile with strong fundamentals, project depth, and communication strengths." },
    { id: "fr-9", name: "People + Product", category: "friendly", style: "minimal", tone: "product", summarySeed: "People-first engineer focused on usability, clean architecture, and dependable delivery." },
    { id: "fr-10", name: "Open Source Voice", category: "friendly", style: "modern", tone: "open-source", summarySeed: "Open-source minded contributor who values readability, maintainability, and team collaboration." },
  ],
  ats: [
    { id: "ats-1", name: "ATS Core", category: "ats", style: "ats", tone: "keyword-dense", summarySeed: "Software engineer with strong DSA, API development, and full-stack implementation experience." },
    { id: "ats-2", name: "ATS Tech Stack", category: "ats", style: "ats", tone: "stack", summarySeed: "Full-stack developer skilled in React, Node.js, SQL, testing, and production deployment pipelines." },
    { id: "ats-3", name: "ATS Product", category: "ats", style: "ats", tone: "product", summarySeed: "Product engineering profile focused on performant features, analytics, and business impact metrics." },
    { id: "ats-4", name: "ATS Backend", category: "ats", style: "ats", tone: "backend", summarySeed: "Backend-focused engineer building resilient APIs, optimized queries, and scalable services." },
    { id: "ats-5", name: "ATS Frontend", category: "ats", style: "ats", tone: "frontend", summarySeed: "Frontend engineer specializing in modern UI architecture, accessibility, and performance optimization." },
    { id: "ats-6", name: "ATS Data", category: "ats", style: "ats", tone: "data", summarySeed: "Data-informed developer experienced in analytics workflows, reporting, and decision support tools." },
    { id: "ats-7", name: "ATS Security", category: "ats", style: "ats", tone: "security", summarySeed: "Security-aware developer with practical understanding of auth, validation, and safe deployment practices." },
    { id: "ats-8", name: "ATS DevOps", category: "ats", style: "ats", tone: "devops", summarySeed: "DevOps-capable engineer with CI/CD automation, containerization, and cloud deployment experience." },
    { id: "ats-9", name: "ATS Fresher", category: "ats", style: "ats", tone: "fresher", summarySeed: "Entry-level software engineer with strong fundamentals, project execution, and rapid learning ability." },
    { id: "ats-10", name: "ATS Internship", category: "ats", style: "ats", tone: "internship", summarySeed: "Internship-focused profile with practical projects, clear impact statements, and role keyword alignment." },
  ],
};

const STEP_GUIDANCE: Record<StepKey, string> = {
  student: "Add accurate contact and education details. Recruiters and ATS use this to shortlist quickly.",
  professional: "Keep summary role-focused and skill-heavy. Mention tools, impact, and job intent clearly.",
  experience: "Each bullet should include action + tech + measurable result (percent, time, users, cost).",
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  dateOfBirth: "",
  currentSemester: "",
  linkedin: "",
  github: "",
  portfolio: "",
  degree: "",
  college: "",
  graduationYear: "",
  cgpa: "",
  targetRole: "",
  summary: "",
  technicalSkills: "",
  softSkills: "",
  certifications: "",
  preferredLocations: "",
  expectedCtc: "",
  internshipCompany: "",
  internshipRole: "",
  internshipDuration: "",
  internshipAchievements: "",
  projectTitle: "",
  projectTech: "",
  projectDescription: "",
  leadership: "",
  coursework: "",
  achievements: "",
  hackathons: "",
  openSource: "",
  languages: "",
};

function readStoredForm(): FormState {
  if (typeof window === "undefined") return INITIAL_FORM;
  const saved = localStorage.getItem("nexthire-builder-v2");
  if (!saved) return INITIAL_FORM;
  try {
    const parsed = JSON.parse(saved) as Partial<FormState>;
    return { ...INITIAL_FORM, ...parsed };
  } catch {
    return INITIAL_FORM;
  }
}

function Glass({ children, isDark, className }: { children: React.ReactNode; isDark: boolean; className?: string }) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
        isDark 
          ? "bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/[0.05]" 
          : "bg-white/70 border-black/5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:bg-white/90"
      } ${className ?? ""}`}
    >
      {/* Subtle top glare effect */}
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${isDark ? 'from-transparent via-white/20 to-transparent' : 'from-transparent via-white/80 to-transparent'}`} />
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

function fieldClass(isDark: boolean): string {
  return `w-full rounded-xl px-4 py-3 outline-none transition-all duration-300 border ${
    isDark
      ? "bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/5 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 shadow-inner"
      : "bg-white border-black/10 text-black placeholder:text-gray-400 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 shadow-sm shadow-black/5"
  }`;
}

export default function ResumeBuilderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [templateSection, setTemplateSection] = useState<TemplateSection>("professional");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_LIBRARY.professional[0].id);
  const [atsFriendly, setAtsFriendly] = useState(true);
  const [step, setStep] = useState<StepKey>("student");
  const [form, setForm] = useState<FormState>(() => readStoredForm());
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [autofillMeta, setAutofillMeta] = useState<{ source: string; extractedChars: number; hint: string } | null>(null);

  const [loadingAuto, setLoadingAuto] = useState(false);
  const [loadingFillMissing, setLoadingFillMissing] = useState(false);
  const [loadingImprove, setLoadingImprove] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredFields: Array<keyof FormState> = [
    "fullName",
    "email",
    "phone",
    "degree",
    "college",
    "targetRole",
    "summary",
    "technicalSkills",
    "projectTitle",
    "projectDescription",
  ];

  const completedRequired = requiredFields.filter((field) => form[field].trim().length > 0).length;
  const completionScore = Math.round((completedRequired / requiredFields.length) * 100);
  const selectedTemplate = TEMPLATE_LIBRARY[templateSection].find((t) => t.id === selectedTemplateId) || TEMPLATE_LIBRARY.professional[0];
  const pdfTemplateStyle: TemplateStyle = selectedTemplate.style;

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (status !== "authenticated" || !email) return;

    let active = true;

    const restoreBuilder = async () => {
      await saveUserData({ name: session.user?.name ?? null, email });
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!userRow?.id || !active) return;

      const { data: latest } = await supabase
        .from("submissions")
        .select("code")
        .eq("user_id", userRow.id)
        .eq("language", "resume-builder")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest?.code || !active) return;

      try {
        const parsed = JSON.parse(String(latest.code)) as Partial<FormState>;
        setForm((prev) => ({ ...prev, ...parsed }));
      } catch {
        // Ignore malformed saved builder state.
      }
    };

    void restoreBuilder();
    return () => {
      active = false;
    };
  }, [session, status]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const improveField = (key: keyof FormState, section: string) => {
    const text = form[key];
    if (!text.trim()) return;

    setError(null);
    setLoadingImprove((prev) => ({ ...prev, [key]: true }));

    fetch("/api/resume-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "improve", section, text }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          try {
            const err = JSON.parse(text);
            throw new Error(err.error || "Failed to improve text");
          } catch {
            throw new Error("Failed to improve text");
          }
        }
        const data = (await res.json()) as ImproveResponse;
        updateField(key, data.improvedText ?? text);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to improve section"))
      .finally(() => {
        setLoadingImprove((prev) => ({ ...prev, [key]: false }));
      });
  };

  const autoFillFromResume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoadingAuto(true);

    const formData = new FormData();
    formData.append("mode", "autofill");
    formData.append("resumeFile", file);

    fetch("/api/resume-builder", { method: "POST", body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          try {
            const err = JSON.parse(text);
            throw new Error(err.error || `Upload failed (${res.status})`);
          } catch {
            throw new Error(text || `Upload failed (${res.status})`);
          }
        }
        const data = (await res.json()) as AutofillResponse;

        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || data.fullName || "",
          email: prev.email || data.email || "",
          phone: prev.phone || data.phone || "",
          location: prev.location || data.location || "",
          linkedin: prev.linkedin || data.linkedin || "",
          github: prev.github || data.github || "",
          portfolio: prev.portfolio || data.portfolio || "",
          degree: prev.degree || data.degree || "",
          college: prev.college || data.college || "",
          graduationYear: prev.graduationYear || data.graduationYear || "",
          technicalSkills: prev.technicalSkills || data.technicalSkills || "",
          projectDescription: prev.projectDescription || data.projectDescription || "",
          internshipAchievements: prev.internshipAchievements || data.internshipAchievements || "",
          summary: prev.summary || data.summary || "",
        }));
        setMissingFields(data.missingFields || []);
        setAutofillMeta({
          source: String(data.extractionSource || "unknown"),
          extractedChars: Number(data.extractedChars || 0),
          hint: String(data.qualityHint || ""),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to autofill"))
      .finally(() => setLoadingAuto(false));
  };

  const fillMissingFields = () => {
    if (missingFields.length === 0) return;
    setLoadingFillMissing(true);
    setError(null);

    fetch("/api/resume-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "fill-missing",
        missingFields,
        formData: form,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => "Unknown error");
          try {
            const err = JSON.parse(text);
            throw new Error(err.error || "Failed to fill missing fields");
          } catch {
            throw new Error("Failed to fill missing fields");
          }
        }
        const data = (await res.json()) as { generated?: Record<string, string>; missingFields?: string[]; error?: string };

        const generated = data.generated || {};
        setForm((prev) => {
          const next = { ...prev };
          for (const [key, value] of Object.entries(generated)) {
            const k = key as keyof FormState;
            if (!String(next[k] || "").trim()) next[k] = String(value || "");
          }
          return next;
        });
        setMissingFields(data.missingFields || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fill missing fields"))
      .finally(() => setLoadingFillMissing(false));
  };

  const saveDraft = () => {
    setSaving(true);
    localStorage.setItem("nexthire-builder-v2", JSON.stringify(form));

    const email = session?.user?.email;
    if (status === "authenticated" && email) {
      void (async () => {
        await saveUserData({ name: session.user?.name ?? null, email });
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (!userRow?.id) {
          setSaving(false);
          return;
        }

        await supabase.from("submissions").insert({
          user_id: userRow.id,
          language: "resume-builder",
          code: JSON.stringify(form),
          output: `Template:${selectedTemplate.id} Category:${templateSection} ATS:${atsFriendly ? "on" : "off"}`,
          feedback: "Draft saved from resume builder",
          difficulty: "easy",
          result: "Saved",
        });
        setSaving(false);
      })();
      return;
    }

    setTimeout(() => setSaving(false), 400);
  };

  const applyTemplatePreset = (category: TemplateSection, templateId: string) => {
    setTemplateSection(category);
    setSelectedTemplateId(templateId);
    const picked = TEMPLATE_LIBRARY[category].find((t) => t.id === templateId);
    if (picked?.style === "ats") {
      setAtsFriendly(true);
    }
    setForm((prev) => ({
      ...prev,
      summary: prev.summary || picked?.summarySeed || prev.summary,
    }));
  };

  const downloadText = () => {
    const content = [
      `${form.fullName}`,
      `${form.email} | ${form.phone} | ${form.location}`,
      `${form.dateOfBirth ? `DOB: ${form.dateOfBirth}` : ""}${form.currentSemester ? ` | Semester: ${form.currentSemester}` : ""}`,
      `${form.linkedin} | ${form.github} | ${form.portfolio}`,
      "",
      "PROFESSIONAL SUMMARY",
      form.summary,
      "",
      "TARGET ROLE",
      form.targetRole,
      "",
      "TECHNICAL SKILLS",
      form.technicalSkills,
      "",
      "SOFT SKILLS",
      form.softSkills,
      "",
      "PREFERRED LOCATIONS",
      form.preferredLocations,
      "",
      "EXPECTED CTC",
      form.expectedCtc,
      "",
      "COURSEWORK",
      form.coursework,
      "",
      "PROJECT",
      `${form.projectTitle}`,
      `${form.projectTech}`,
      `${form.projectDescription}`,
      "",
      "EXPERIENCE",
      `${form.internshipRole} - ${form.internshipCompany} (${form.internshipDuration})`,
      `${form.internshipAchievements}`,
      "",
      "LEADERSHIP",
      form.leadership,
      "",
      "OPEN SOURCE",
      form.openSource,
      "",
      "HACKATHONS",
      form.hackathons,
      "",
      "EDUCATION",
      `${form.degree} - ${form.college} (${form.graduationYear})`,
      `CGPA: ${form.cgpa}`,
      "",
      "ACHIEVEMENTS",
      form.achievements,
      "",
      "LANGUAGES",
      form.languages,
      "",
      "CERTIFICATIONS",
      form.certifications,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    window.print();
  };

  const improveButton = (key: keyof FormState, section: string) => (
    <button
      onClick={() => improveField(key, section)}
      disabled={loadingImprove[key] || !form[key].trim()}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 relative overflow-hidden group ${
        isDark 
          ? "bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 border border-brand-purple/40 shadow-[0_0_15px_rgba(138,43,226,0.25)] hover:shadow-[0_0_20px_rgba(138,43,226,0.4)] disabled:opacity-50" 
          : "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 border border-brand-purple/30 shadow-sm disabled:opacity-50"
      }`}
    >
      {loadingImprove[key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_5px_rgba(138,43,226,0.8)]" />}
      <span className="relative z-10">{loadingImprove[key] ? "Improving..." : "AI Enhance"}</span>
    </button>
  );

  return (
    <main className={`min-h-screen px-4 pb-8 pt-2 md:px-6 md:pb-10 md:pt-3 ${isDark ? "bg-black" : "bg-slate-50"} print:bg-white print:p-0 print:m-0`}>
      <div className="mx-auto max-w-7xl space-y-6 print:space-y-0 print:max-w-none print:w-full">
        {/* Navigation - hidden on print */}
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link
            href="/my-resume"
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
            }`}
          >
            My Resume Workspace
          </Link>
        </div>

        <Glass isDark={isDark} className="p-4 sm:p-6 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Professional Resume Builder</h1>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Step-by-step builder for student information, professional profile, and experience detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 ${
                  isDark 
                    ? "bg-gradient-to-r from-brand-blue/20 to-brand-purple/20 text-white hover:from-brand-blue/40 hover:to-brand-purple/40 border border-brand-blue/30 shadow-[0_0_15px_rgba(var(--brand-blue-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--brand-blue-rgb),0.5)]" 
                    : "bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 text-brand-blue hover:from-brand-blue/20 hover:to-brand-purple/20 border border-brand-blue/30 shadow-sm hover:shadow-md"
                }`}
              >
                {loadingAuto ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                {loadingAuto ? "Scanning Document..." : "Auto-fill From Resume"}
                <input type="file" accept=".pdf,.doc,.docx,.txt,image/*" capture="environment" className="hidden" onChange={autoFillFromResume} />
              </label>
              <button
                type="button"
                onClick={() => setAtsFriendly((prev) => !prev)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  atsFriendly
                    ? isDark
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-black/10 text-black hover:bg-black/20"
                }`}
              >
                ATS Friendly: {atsFriendly ? "On" : "Off"}
              </button>
              <details className={`rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer group ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}>
                <summary className="select-none list-none">
                  Template: <span className="font-bold">{selectedTemplate.name}</span> ▼
                </summary>
                <div className={`absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border ${
                  isDark ? "border-white/20 bg-black/95" : "border-black/20 bg-white/95"
                } shadow-lg`}>
                  {(["professional", "friendly", "ats"] as TemplateSection[]).map((section) => (
                    <div key={section} className={`border-b last:border-b-0 ${isDark ? "border-white/10" : "border-black/10"}`}>
                      <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wide ${isDark ? "text-white/60" : "text-black/60"}`}>
                        {section.toUpperCase()} TEMPLATES
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {TEMPLATE_LIBRARY[section].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setTemplateSection(section);
                              applyTemplatePreset(section, t.id);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition ${
                              selectedTemplateId === t.id
                                ? isDark ? "bg-white/20 text-white font-semibold" : "bg-black/10 text-black font-semibold"
                                : isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{t.name}</span>
                              {selectedTemplateId === t.id && <span>✓</span>}
                            </div>
                            <div className={`text-xs mt-0.5 ${isDark ? "text-white/50" : "text-black/50"}`}>{t.tone}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </Glass>

        {autofillMeta && (
          <Glass isDark={isDark} className="p-4 print:hidden">
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Autofill Source: {autofillMeta.source} | Extracted Text: {autofillMeta.extractedChars} chars
            </p>
            {autofillMeta.hint && (
              <p className={`mt-1 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>{autofillMeta.hint}</p>
            )}
          </Glass>
        )}

        <Glass isDark={isDark} className="p-5 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {(["professional", "friendly", "ats"] as TemplateSection[]).map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => {
                  setTemplateSection(section);
                  if (!TEMPLATE_LIBRARY[section].some((t) => t.id === selectedTemplateId)) {
                    applyTemplatePreset(section, TEMPLATE_LIBRARY[section][0].id);
                  }
                }}
                className={`rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  templateSection === section
                    ? isDark
                      ? "bg-white text-black"
                      : "bg-black text-white"
                    : isDark
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-black/10 text-black hover:bg-black/20"
                }`}
              >
                {section} Templates ({TEMPLATE_LIBRARY[section].length})
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {TEMPLATE_LIBRARY[templateSection].map((item) => {
              const isActive = item.id === selectedTemplateId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplatePreset(item.category, item.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? isDark
                        ? "border-white bg-white/15"
                        : "border-black bg-black/5"
                      : isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-black/10 bg-white hover:bg-black/5"
                  }`}
                >
                  <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>{item.name}</p>
                  <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>{item.tone}</p>
                  <div className={`mt-2 rounded-lg p-2 ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                    <p className={`text-[10px] uppercase tracking-[0.18em] ${isDark ? "text-gray-400" : "text-gray-600"}`}>Preview Layout</p>
                    <div className="mt-1 space-y-1">
                      <div className={`h-1.5 w-2/3 rounded ${isDark ? "bg-white/60" : "bg-black/60"}`} />
                      <div className={`h-1.5 w-5/6 rounded ${isDark ? "bg-white/35" : "bg-black/35"}`} />
                      <div className={`h-1.5 w-4/6 rounded ${isDark ? "bg-white/25" : "bg-black/25"}`} />
                    </div>
                  </div>
                  <p className={`mt-2 line-clamp-3 text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{item.summarySeed}</p>
                </button>
              );
            })}
          </div>
        </Glass>

        <Glass isDark={isDark} className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'} print:hidden`}>
          <div className="flex flex-wrap gap-1 mb-4">
            {([
              ["student", "1. Student Info"],
              ["professional", "2. Professional Info"],
              ["experience", "3. Experience & Projects"],
            ] as Array<[StepKey, string]>).map(([value, labelText]) => (
              <button
                key={value}
                onClick={() => setStep(value)}
                className={`tab-indicator relative rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  step === value
                    ? isDark
                      ? "bg-white text-black shadow-lg"
                      : "bg-black text-white shadow-lg"
                    : isDark
                    ? "text-gray-300 hover:text-white hover:bg-white/5"
                    : "text-gray-600 hover:text-black hover:bg-black/5"
                }`}
              >
                {labelText}
                {step === value && (
                  <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Placement Profile Completion</span>
              <span className={isDark ? "text-gray-300" : "text-gray-700"}>{completionScore}%</span>
            </div>
            <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
              <div className={`h-2 rounded-full transition-all duration-500 ${isDark ? "bg-white" : "bg-black"}`} style={{ width: `${completionScore}%` }} />
            </div>
          </div>
        </Glass>

        <Glass isDark={isDark} className="p-4 print:hidden">
          <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{STEP_GUIDANCE[step]}</p>
        </Glass>

        {missingFields.length > 0 && (
          <Glass isDark={isDark} className="p-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>Auto-fill complete. Remaining empty fields:</p>
                <p className={`mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{missingFields.join(", ")}</p>
              </div>
              <button
                type="button"
                onClick={fillMissingFields}
                disabled={loadingFillMissing}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  isDark ? "bg-white text-black hover:bg-gray-200 disabled:opacity-60" : "bg-black text-white hover:bg-black/90 disabled:opacity-60"
                }`}
              >
                {loadingFillMissing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loadingFillMissing ? "Filling..." : "AI Fill Missing Fields"}
              </button>
            </div>
          </Glass>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 print:block print:gap-0">
          <div className="space-y-4 lg:col-span-7 print:hidden">
            {step === "student" && (
              <Glass isDark={isDark} className="p-5 space-y-4">
                <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Student Information</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Tip: Use the same contact details as your internship/job applications.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={fieldClass(isDark)} placeholder="Full Name" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Location" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Date of Birth" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Current Semester" value={form.currentSemester} onChange={(e) => updateField("currentSemester", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="LinkedIn URL" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="GitHub URL" value={form.github} onChange={(e) => updateField("github", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Portfolio URL" value={form.portfolio} onChange={(e) => updateField("portfolio", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Degree" value={form.degree} onChange={(e) => updateField("degree", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="College / University" value={form.college} onChange={(e) => updateField("college", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Graduation Year" value={form.graduationYear} onChange={(e) => updateField("graduationYear", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="CGPA / GPA" value={form.cgpa} onChange={(e) => updateField("cgpa", e.target.value)} />
                </div>
              </Glass>
            )}

            {step === "professional" && (
              <Glass isDark={isDark} className="p-5 space-y-4">
                <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Professional Information</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Tip: Keep summary between 3 to 5 lines and tailored to your target role.</p>
                <input className={fieldClass(isDark)} placeholder="Target Role (e.g., Frontend Developer Intern)" value={form.targetRole} onChange={(e) => updateField("targetRole", e.target.value)} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Professional Summary</label>
                    {improveButton("summary", "summary")}
                  </div>
                  <textarea className={fieldClass(isDark)} rows={4} placeholder="Write your summary..." value={form.summary} onChange={(e) => updateField("summary", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Technical Skills</label>
                    {improveButton("technicalSkills", "skills")}
                  </div>
                  <textarea className={fieldClass(isDark)} rows={3} placeholder="React, Node.js, SQL..." value={form.technicalSkills} onChange={(e) => updateField("technicalSkills", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Soft Skills</label>
                  <textarea className={fieldClass(isDark)} rows={2} placeholder="Communication, teamwork..." value={form.softSkills} onChange={(e) => updateField("softSkills", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Certifications</label>
                  <textarea className={fieldClass(isDark)} rows={2} placeholder="Certifications and achievements" value={form.certifications} onChange={(e) => updateField("certifications", e.target.value)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={fieldClass(isDark)} placeholder="Preferred Job Locations" value={form.preferredLocations} onChange={(e) => updateField("preferredLocations", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Expected CTC" value={form.expectedCtc} onChange={(e) => updateField("expectedCtc", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Relevant Coursework</label>
                  <textarea className={fieldClass(isDark)} rows={2} placeholder="DSA, DBMS, OS, CN..." value={form.coursework} onChange={(e) => updateField("coursework", e.target.value)} />
                </div>
              </Glass>
            )}

            {step === "experience" && (
              <Glass isDark={isDark} className="p-5 space-y-4">
                <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Experience & Projects</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Tip: Write impact bullets like Built X using Y, improved Z by 30%.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={fieldClass(isDark)} placeholder="Internship Company" value={form.internshipCompany} onChange={(e) => updateField("internshipCompany", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Internship Role" value={form.internshipRole} onChange={(e) => updateField("internshipRole", e.target.value)} />
                </div>
                <input className={fieldClass(isDark)} placeholder="Duration (e.g., Jan 2025 - Apr 2025)" value={form.internshipDuration} onChange={(e) => updateField("internshipDuration", e.target.value)} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Internship Achievements</label>
                    {improveButton("internshipAchievements", "experience")}
                  </div>
                  <textarea className={fieldClass(isDark)} rows={4} placeholder="What did you build and improve?" value={form.internshipAchievements} onChange={(e) => updateField("internshipAchievements", e.target.value)} />
                </div>
                <input className={fieldClass(isDark)} placeholder="Project Title" value={form.projectTitle} onChange={(e) => updateField("projectTitle", e.target.value)} />
                <input className={fieldClass(isDark)} placeholder="Project Technologies" value={form.projectTech} onChange={(e) => updateField("projectTech", e.target.value)} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Project Description</label>
                    {improveButton("projectDescription", "projects")}
                  </div>
                  <textarea className={fieldClass(isDark)} rows={4} placeholder="Project details and impact metrics" value={form.projectDescription} onChange={(e) => updateField("projectDescription", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Leadership / Activities</label>
                  <textarea className={fieldClass(isDark)} rows={3} placeholder="Positions of responsibility, clubs, volunteering" value={form.leadership} onChange={(e) => updateField("leadership", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Open Source Contributions</label>
                  <textarea className={fieldClass(isDark)} rows={3} placeholder="PRs, issues resolved, community work" value={form.openSource} onChange={(e) => updateField("openSource", e.target.value)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={fieldClass(isDark)} placeholder="Hackathons / Competitions" value={form.hackathons} onChange={(e) => updateField("hackathons", e.target.value)} />
                  <input className={fieldClass(isDark)} placeholder="Languages (English, Hindi...)" value={form.languages} onChange={(e) => updateField("languages", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>Achievements</label>
                  <textarea className={fieldClass(isDark)} rows={3} placeholder="Top rankings, awards, scholarships" value={form.achievements} onChange={(e) => updateField("achievements", e.target.value)} />
                </div>
              </Glass>
            )}
          </div>

          <div className="lg:col-span-5 print:block print:w-full">
            <Glass isDark={isDark} className="sticky top-28 p-6 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4 print:hidden">
                <h2 className={`text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-black"}`}>Live A4 Preview</h2>
                <span className={`text-xs px-2 py-1 rounded bg-brand-blue/20 text-brand-blue font-semibold`}>Jake's ATS Standard</span>
              </div>
              
              {/* Real A4 Paper Container */}
              <div className="w-full bg-gray-200/50 dark:bg-black/50 p-4 rounded-xl print:p-0 print:bg-transparent overflow-x-auto flex justify-center">
                <div 
                  className="bg-white shadow-2xl print:shadow-none origin-top mx-auto"
                  style={{
                    width: '8.5in',
                    minHeight: '11in',
                    transform: 'scale(0.8)',
                    transformOrigin: 'top center',
                    marginBottom: '-2.2in' // offset the scaled height
                  }}
                >
                  <TemplateRenderer form={form as any} config={jakesResumeConfig} />
                </div>
              </div>
            </Glass>
          </div>
        </div>

        <Glass isDark={isDark} className="p-6 print:hidden">
          <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Download / Save</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveDraft}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saved Successfully" : "Save / Update Resume"}
            </button>
            <button
              onClick={downloadText}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              <Download className="h-4 w-4" />
              Download Text
            </button>
            <button
              onClick={downloadPdf}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </Glass>

        {error && <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} print:hidden`}>{error}</p>}
      </div>
    </main>
  );
}
