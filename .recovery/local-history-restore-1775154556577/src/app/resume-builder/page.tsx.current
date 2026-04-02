"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Download, Loader2, Save, Sparkles, UploadCloud } from "lucide-react";
import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import { saveUserData, supabase } from "@/lib/supabase";

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
      className={`rounded-2xl ${
        isDark ? "bg-white/5" : "bg-white/90"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function fieldClass(isDark: boolean): string {
  return `w-full rounded-xl px-3 py-2.5 outline-none transition ${
    isDark
      ? "bg-white/10 text-white placeholder:text-gray-500"
      : "bg-black/5 text-black placeholder:text-gray-500"
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
        const data = (await res.json()) as ImproveResponse;
        if (!res.ok) throw new Error(data.error || "Failed to improve text");
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
        const data = (await res.json()) as AutofillResponse;
        if (!res.ok) throw new Error(data.error || "Failed to autofill");

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
        const data = (await res.json()) as { generated?: Record<string, string>; missingFields?: string[]; error?: string };
        if (!res.ok) throw new Error(data.error || "Failed to fill missing fields");

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
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 48;
    const right = 48;
    const maxWidth = pageWidth - left - right;

    const bodyFont = pdfTemplateStyle === "ats" || atsFriendly ? "courier" : "helvetica";
    const headingSize = pdfTemplateStyle === "modern" ? 12 : 11;
    const bodySize = pdfTemplateStyle === "modern" ? 10.5 : 10;
    const nameSize = pdfTemplateStyle === "modern" ? 21 : 18;

    let y = 56;

    const writeLine = (text: string, isHeading = false) => {
      const line = text.trim();
      if (!line) return;
      const size = isHeading ? headingSize : bodySize;
      pdf.setFont(bodyFont, isHeading ? "bold" : "normal");
      pdf.setFontSize(size);

      const lines = pdf.splitTextToSize(line, maxWidth) as string[];
      const neededHeight = lines.length * (isHeading ? 15 : 14);

      if (y + neededHeight > pageHeight - 48) {
        pdf.addPage();
        y = 56;
      }

      lines.forEach((item) => {
        pdf.text(item, left, y);
        y += isHeading ? 15 : 14;
      });
    };

    const writeSection = (title: string, lines: string[]) => {
      if (!lines.some((line) => line.trim().length > 0)) return;
      y += 8;
      writeLine(title, true);
      if (pdfTemplateStyle === "modern" && !atsFriendly) {
        pdf.setDrawColor(80);
        pdf.line(left, y + 2, pageWidth - right, y + 2);
        y += 8;
      }
      lines.forEach((line) => writeLine(line));
    };

    pdf.setFont(bodyFont, "bold");
    pdf.setFontSize(nameSize);
    pdf.text(form.fullName || "Candidate Name", left, y);
    y += 20;

    pdf.setFont(bodyFont, "normal");
    pdf.setFontSize(bodySize);
    const contactLine = [form.email, form.phone, form.location].filter(Boolean).join(" | ");
    writeLine(contactLine || "Email | Phone | Location");
    writeLine([form.dateOfBirth ? `DOB: ${form.dateOfBirth}` : "", form.currentSemester ? `Semester: ${form.currentSemester}` : ""].filter(Boolean).join(" | "));
    writeLine([form.linkedin, form.github, form.portfolio].filter(Boolean).join(" | "));

    writeSection("TARGET ROLE", [form.targetRole]);
    writeSection("PROFESSIONAL SUMMARY", [form.summary]);
    writeSection("TECHNICAL SKILLS", [form.technicalSkills]);
    writeSection("SOFT SKILLS", [form.softSkills]);
    writeSection("PREFERRED LOCATIONS", [form.preferredLocations]);
    writeSection("EXPECTED CTC", [form.expectedCtc]);
    writeSection("COURSEWORK", [form.coursework]);
    writeSection("PROJECT", [form.projectTitle, form.projectTech, form.projectDescription]);
    writeSection("EXPERIENCE", [
      `${form.internshipRole}${form.internshipCompany ? ` - ${form.internshipCompany}` : ""}${form.internshipDuration ? ` (${form.internshipDuration})` : ""}`,
      form.internshipAchievements,
    ]);
    writeSection("OPEN SOURCE", [form.openSource]);
    writeSection("LEADERSHIP", [form.leadership]);
    writeSection("HACKATHONS", [form.hackathons]);
    writeSection("ACHIEVEMENTS", [form.achievements]);
    writeSection("EDUCATION", [`${form.degree}${form.college ? ` - ${form.college}` : ""}${form.graduationYear ? ` (${form.graduationYear})` : ""}`, form.cgpa ? `CGPA: ${form.cgpa}` : ""]);
    writeSection("LANGUAGES", [form.languages]);
    writeSection("CERTIFICATIONS", [form.certifications]);

    const fileSafeName = (form.fullName || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    pdf.save(`${fileSafeName}-${selectedTemplate.id}.pdf`);
  };

  const improveButton = (key: keyof FormState, section: string) => (
    <button
      onClick={() => improveField(key, section)}
      disabled={loadingImprove[key] || !form[key].trim()}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
        isDark 
          ? "bg-white/20 text-white hover:bg-white/30 disabled:opacity-50" 
          : "bg-black/15 text-black hover:bg-black/25 disabled:opacity-50"
      }`}
    >
      {loadingImprove[key] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {loadingImprove[key] ? "Improving..." : "AI"}
    </button>
  );

  return (
    <main className={`min-h-screen px-4 pb-8 pt-2 md:px-6 md:pb-10 md:pt-3 ${isDark ? "bg-black" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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

        <Glass isDark={isDark} className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Professional Resume Builder</h1>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Step-by-step builder for student information, professional profile, and experience detail.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                  isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                }`}
              >
                {loadingAuto ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Auto-fill From Resume Or Photo
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
              <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white" : "bg-black/10 text-black"}`}>
                Template: {selectedTemplate.name}
              </div>
            </div>
          </div>
        </Glass>

        {autofillMeta && (
          <Glass isDark={isDark} className="p-4">
            <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
              Autofill Source: {autofillMeta.source} | Extracted Text: {autofillMeta.extractedChars} chars
            </p>
            {autofillMeta.hint && (
              <p className={`mt-1 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>{autofillMeta.hint}</p>
            )}
          </Glass>
        )}

        <Glass isDark={isDark} className="p-5">
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

        <Glass isDark={isDark} className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
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

        <Glass isDark={isDark} className="p-4">
          <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{STEP_GUIDANCE[step]}</p>
        </Glass>

        {missingFields.length > 0 && (
          <Glass isDark={isDark} className="p-4">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
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

          <div className="lg:col-span-5">
            <Glass isDark={isDark} className="sticky top-28 p-6">
              <h2 className={`mb-4 text-lg font-bold tracking-wide ${isDark ? "text-white" : "text-black"}`}>Live Preview</h2>
              <div className={`space-y-4 text-sm ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                {/* Header */}
                <div className="pb-3 border-b border-gray-300/20">
                  <p className={`text-xl font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>{form.fullName || "Your Name"}</p>
                  <p className={`text-xs tracking-wide mt-1.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {[form.email, form.phone, form.location].filter(Boolean).join(" • ") || "Email • Phone • Location"}
                  </p>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-600"}`}>
                    {[form.linkedin, form.github, form.portfolio].filter(Boolean).join(" • ") || "Links"}
                  </p>
                </div>

                {/* Target Role */}
                {form.targetRole && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Target Role</p>
                    <p className={`mt-1.5 font-semibold ${isDark ? "text-white" : "text-black"}`}>{form.targetRole}</p>
                  </div>
                )}

                {/* Summary */}
                {form.summary && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Summary</p>
                    <p className="mt-1.5 leading-relaxed">{form.summary}</p>
                  </div>
                )}

                {/* Skills */}
                {form.technicalSkills && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Technical Skills</p>
                    <p className="mt-1.5">{form.technicalSkills}</p>
                  </div>
                )}

                {form.softSkills && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Soft Skills</p>
                    <p className="mt-1.5">{form.softSkills}</p>
                  </div>
                )}

                {/* Secondary Info */}
                {(form.preferredLocations || form.expectedCtc) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {form.preferredLocations && (
                      <div>
                        <p className={`font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Locations</p>
                        <p className="mt-1">{form.preferredLocations}</p>
                      </div>
                    )}
                    {form.expectedCtc && (
                      <div>
                        <p className={`font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Expected CTC</p>
                        <p className="mt-1">{form.expectedCtc}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Experience */}
                {form.internshipRole && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Experience</p>
                    <p className={`mt-1.5 font-semibold ${isDark ? "text-white" : "text-black"}`}>{form.internshipRole} {form.internshipCompany && `• ${form.internshipCompany}`}</p>
                    {form.internshipDuration && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>{form.internshipDuration}</p>}
                    {form.internshipAchievements && <p className="mt-1 leading-relaxed">{form.internshipAchievements}</p>}
                  </div>
                )}

                {/* Project */}
                {form.projectTitle && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Project</p>
                    <p className={`mt-1.5 font-semibold ${isDark ? "text-white" : "text-black"}`}>{form.projectTitle}</p>
                    {form.projectTech && <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-600"}`}>{form.projectTech}</p>}
                    {form.projectDescription && <p className="mt-1 leading-relaxed">{form.projectDescription}</p>}
                  </div>
                )}

                {/* Education */}
                {(form.degree || form.college) && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Education</p>
                    <p className={`mt-1.5 font-semibold ${isDark ? "text-white" : "text-black"}`}>
                      {form.degree} {form.college && `• ${form.college}`}
                    </p>
                    {form.graduationYear && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>{form.graduationYear}</p>}
                    {form.cgpa && <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>CGPA: {form.cgpa}</p>}
                  </div>
                )}

                {/* Other sections */}
                {form.leadership && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Leadership</p>
                    <p className="mt-1.5">{form.leadership}</p>
                  </div>
                )}

                {form.openSource && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Open Source</p>
                    <p className="mt-1.5">{form.openSource}</p>
                  </div>
                )}

                {form.achievements && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-600"}`}>Achievements</p>
                    <p className="mt-1.5">{form.achievements}</p>
                  </div>
                )}
              </div>
            </Glass>
          </div>
        </div>

        <Glass isDark={isDark} className="p-6">
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

        {error && <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{error}</p>}
      </div>
    </main>
  );
}
