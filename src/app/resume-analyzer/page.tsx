"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCcw,
  Target,
  TriangleAlert,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveUserData, supabase } from "@/lib/supabase";

type SectionScores = {
  skills: number;
  projects: number;
  experience: number;
  education: number;
};

type ResumeResponse = {
  atsScore?: number;
  label?: "Excellent" | "Good" | "Needs Improvement";
  aiSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestions?: string[];
  includedKeywords?: string[];
  missingKeywords?: string[];
  sectionScores?: SectionScores;
  error?: string;
};

type MatchResponse = {
  matchPercentage?: number;
  matchSummary?: string;
  matchedKeywords?: string[];
  jobMissingKeywords?: string[];
  jobSuggestions?: string[];
  error?: string;
};

type FixResponse = {
  improvedBullets?: string[];
  error?: string;
};

type AnalyzerWorkspaceSnapshot = {
  atsScore: number | null;
  label: "Excellent" | "Good" | "Needs Improvement" | null;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  includedKeywords: string[];
  missingKeywords: string[];
  sectionScores: SectionScores;
  matchPercentage: number | null;
  matchSummary: string;
  matchedKeywords: string[];
  jobMissing: string[];
  jobSuggestions: string[];
  improvedBullets: string[];
  originalBullets: string[];
  jobDescription: string;
  recruiterNotes: string;
  updatedAt: string;
};

function scoreClass(score: number, isDark: boolean): string {
  if (score < 50) return isDark ? "text-gray-300" : "text-gray-700";
  if (score <= 75) return isDark ? "text-white" : "text-black";
  return isDark ? "text-white" : "text-black";
}

function strokeColor(score: number): string {
  if (score < 50) return "#7a7a7a";
  if (score <= 75) return "#9a9a9a";
  return "#111111";
}

function Ring({ score, isDark }: { score: number; isDark: boolean }) {
  const size = 180;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor(progress)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-4xl font-bold ${scoreClass(progress, isDark)}`}>{progress}</div>
        <div className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>ATS</div>
      </div>
    </div>
  );
}

function Glass({ children, isDark, className }: { children: React.ReactNode; isDark: boolean; className?: string }) {
  return (
    <section
      className={`rounded-2xl border backdrop-blur-xl ${
        isDark
          ? "bg-white/5 border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
          : "bg-white/90 border-black/10 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function ScoreBar({ label, value, isDark }: { label: string; value: number; isDark: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className={isDark ? "text-gray-300" : "text-gray-700"}>{label}</span>
        <span className={scoreClass(value, isDark)}>{value}%</span>
      </div>
      <div className={`h-2 rounded-full ${isDark ? "bg-white/10" : "bg-black/10"}`}>
        <div className={`h-2 rounded-full ${isDark ? "bg-white" : "bg-black"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [label, setLabel] = useState<"Excellent" | "Good" | "Needs Improvement" | null>(null);
  const [summary, setSummary] = useState("Upload a resume and run analysis to get a complete recruiter-style assessment.");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [includedKeywords, setIncludedKeywords] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [sectionScores, setSectionScores] = useState<SectionScores>({ skills: 0, projects: 0, experience: 0, education: 0 });
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [matchSummary, setMatchSummary] = useState("Paste a job description to evaluate role fit.");
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [jobMissing, setJobMissing] = useState<string[]>([]);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);

  const [improvedBullets, setImprovedBullets] = useState<string[]>([]);
  const [originalBullets, setOriginalBullets] = useState<string[]>([]);

  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingFix, setLoadingFix] = useState(false);
  const [recruiterNotes, setRecruiterNotes] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const restoreAnalyzerWorkspace = async () => {
      await saveUserData({ name: session.user?.name ?? null, email });
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!userRow?.id || !active) return;

      const { data: latestWorkspace } = await supabase
        .from("submissions")
        .select("code")
        .eq("user_id", userRow.id)
        .eq("language", "resume-workspace")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestWorkspace?.code || !active) return;

      try {
        const parsed = JSON.parse(String(latestWorkspace.code)) as Partial<AnalyzerWorkspaceSnapshot>;
        setAtsScore(typeof parsed.atsScore === "number" ? parsed.atsScore : null);
        setLabel(parsed.label === "Excellent" || parsed.label === "Good" || parsed.label === "Needs Improvement" ? parsed.label : null);
        setSummary(typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary : "Upload a resume and run analysis to get a complete recruiter-style assessment.");
        setStrengths(Array.isArray(parsed.strengths) ? parsed.strengths : []);
        setWeaknesses(Array.isArray(parsed.weaknesses) ? parsed.weaknesses : []);
        setSuggestions(Array.isArray(parsed.suggestions) ? parsed.suggestions : []);
        setIncludedKeywords(Array.isArray(parsed.includedKeywords) ? parsed.includedKeywords : []);
        setMissingKeywords(Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : []);
        setSectionScores(parsed.sectionScores && typeof parsed.sectionScores === "object"
          ? {
              skills: Number(parsed.sectionScores.skills || 0),
              projects: Number(parsed.sectionScores.projects || 0),
              experience: Number(parsed.sectionScores.experience || 0),
              education: Number(parsed.sectionScores.education || 0),
            }
          : { skills: 0, projects: 0, experience: 0, education: 0 });
        setMatchPercentage(typeof parsed.matchPercentage === "number" ? parsed.matchPercentage : null);
        setMatchSummary(typeof parsed.matchSummary === "string" && parsed.matchSummary.trim() ? parsed.matchSummary : "Paste a job description to evaluate role fit.");
        setMatchedKeywords(Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : []);
        setJobMissing(Array.isArray(parsed.jobMissing) ? parsed.jobMissing : []);
        setJobSuggestions(Array.isArray(parsed.jobSuggestions) ? parsed.jobSuggestions : []);
        setImprovedBullets(Array.isArray(parsed.improvedBullets) ? parsed.improvedBullets : []);
        setOriginalBullets(Array.isArray(parsed.originalBullets) ? parsed.originalBullets : []);
        setJobDescription(typeof parsed.jobDescription === "string" ? parsed.jobDescription : "");
        setRecruiterNotes(typeof parsed.recruiterNotes === "string" ? parsed.recruiterNotes : "");
      } catch {
        // Ignore malformed persisted workspace snapshot.
      }
    };

    void restoreAnalyzerWorkspace();

    return () => {
      active = false;
    };
  }, [session, status]);

  const canAnalyze = useMemo(() => Boolean(resumeFile), [resumeFile]);

  const interviewReadiness = useMemo(() => {
    const sectionAvg = Math.round((sectionScores.skills + sectionScores.projects + sectionScores.experience + sectionScores.education) / 4);
    const match = typeof matchPercentage === "number" ? matchPercentage : 0;
    const blended = Math.round((atsScore ?? 0) * 0.5 + sectionAvg * 0.25 + match * 0.25);
    return Math.max(0, Math.min(100, blended));
  }, [atsScore, sectionScores, matchPercentage]);

  const persistWorkspace = useMemo(() => {
    return async (snapshot: AnalyzerWorkspaceSnapshot) => {
      const email = session?.user?.email;
      if (status !== "authenticated" || !email) return;

      await saveUserData({ name: session.user?.name ?? null, email });
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (!userRow?.id) return;

      await supabase.from("submissions").insert({
        user_id: userRow.id,
        language: "resume-workspace",
        code: JSON.stringify(snapshot),
        output: "Analyzer workspace synced",
        feedback: "Resume analyzer state saved",
        difficulty: "easy",
        result: "Saved",
      });
    };
  }, [session, status]);

  const interviewVerdict = useMemo(() => {
    if (interviewReadiness >= 80) return "Strong shortlist probability";
    if (interviewReadiness >= 65) return "Moderate shortlist probability";
    if (interviewReadiness >= 50) return "Needs focused improvements";
    return "High rejection risk";
  }, [interviewReadiness]);

  const priorityActions = useMemo(() => {
    const list: string[] = [];
    if (missingKeywords.length > 0) {
      list.push(`Add ${Math.min(5, missingKeywords.length)} high-impact missing keywords into skills/projects naturally.`);
    }
    if (sectionScores.experience < 70) {
      list.push("Rewrite experience bullets with action + metric + outcome format.");
    }
    if (sectionScores.projects < 70) {
      list.push("Strengthen projects using production scope, stack depth, and measurable impact.");
    }
    if (typeof matchPercentage === "number" && matchPercentage < 70) {
      list.push("Tailor summary and top skills to this role before every application.");
    }
    if (list.length === 0) {
      list.push("Maintain this resume baseline and create role-specific variants for each application track.");
    }
    return list.slice(0, 4);
  }, [missingKeywords, sectionScores, matchPercentage]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setError(null);
  };

  const analyzeAll = () => {
    if (!resumeFile) return;
    setLoadingAnalyze(true);
    setSuccess(null);
    setError(null);

    const resumeForm = new FormData();
    resumeForm.append("mode", "resume");
    resumeForm.append("resumeFile", resumeFile);

    const matchForm = new FormData();
    matchForm.append("mode", "job-match");
    matchForm.append("resumeFile", resumeFile);
    matchForm.append("jobDescription", jobDescription || "general software engineering internship role with react, api, communication and teamwork");

    Promise.all([
      fetch("/api/resume-analysis", { method: "POST", body: resumeForm }).then(async (res) => {
        const data = (await res.json()) as ResumeResponse;
        if (!res.ok) throw new Error(data.error || "Failed resume analysis");
        return data;
      }),
      fetch("/api/resume-analysis", { method: "POST", body: matchForm }).then(async (res) => {
        const data = (await res.json()) as MatchResponse;
        if (!res.ok) throw new Error(data.error || "Failed match analysis");
        return data;
      }),
    ])
      .then(([resumeData, matchData]) => {
        const score = typeof resumeData.atsScore === "number" ? resumeData.atsScore : null;
        setAtsScore(score);
        setLabel(resumeData.label ?? null);
        setSummary(resumeData.aiSummary ?? "Analysis completed.");
        setStrengths(resumeData.strengths ?? []);
        setWeaknesses(resumeData.weaknesses ?? []);
        setIncludedKeywords(resumeData.includedKeywords ?? []);
        setMissingKeywords(resumeData.missingKeywords ?? []);
        setSectionScores(resumeData.sectionScores ?? { skills: 0, projects: 0, experience: 0, education: 0 });
        setSuggestions(resumeData.suggestions ?? []);

        setMatchPercentage(typeof matchData.matchPercentage === "number" ? matchData.matchPercentage : null);
        setMatchSummary(matchData.matchSummary ?? "Match analysis completed.");
        setMatchedKeywords(matchData.matchedKeywords ?? []);
        setJobMissing(matchData.jobMissingKeywords ?? []);
        setJobSuggestions(matchData.jobSuggestions ?? []);
        setSuccess("Resume analyzed successfully.");

        const nextSnapshot: AnalyzerWorkspaceSnapshot = {
          atsScore: score,
          label: resumeData.label ?? null,
          summary: resumeData.aiSummary ?? "Analysis completed.",
          strengths: resumeData.strengths ?? [],
          weaknesses: resumeData.weaknesses ?? [],
          suggestions: resumeData.suggestions ?? [],
          includedKeywords: resumeData.includedKeywords ?? [],
          missingKeywords: resumeData.missingKeywords ?? [],
          sectionScores: resumeData.sectionScores ?? { skills: 0, projects: 0, experience: 0, education: 0 },
          matchPercentage: typeof matchData.matchPercentage === "number" ? matchData.matchPercentage : null,
          matchSummary: matchData.matchSummary ?? "Match analysis completed.",
          matchedKeywords: matchData.matchedKeywords ?? [],
          jobMissing: matchData.jobMissingKeywords ?? [],
          jobSuggestions: matchData.jobSuggestions ?? [],
          improvedBullets,
          originalBullets,
          jobDescription,
          recruiterNotes,
          updatedAt: new Date().toISOString(),
        };
        void persistWorkspace(nextSnapshot);

        const email = session?.user?.email;
        if (status === "authenticated" && email) {
          void (async () => {
            await saveUserData({ name: session.user?.name ?? null, email });
            const { data: userRow } = await supabase
              .from("users")
              .select("id")
              .eq("email", email)
              .maybeSingle();
            if (!userRow?.id) return;
            await supabase.from("submissions").insert({
              user_id: userRow.id,
              language: "resume-analyzer",
              code: resumeFile?.name ?? "resume",
              output: `ATS ${score} | MATCH ${typeof matchData.matchPercentage === "number" ? matchData.matchPercentage : "--"}`,
              feedback: (resumeData.suggestions ?? []).slice(0, 3).join(" | "),
              difficulty: "hard",
            });
          })();
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to analyze");
      })
      .finally(() => setLoadingAnalyze(false));
  };

  const fixResume = () => {
    if (!resumeFile) return;
    setLoadingFix(true);
    setSuccess(null);
    setError(null);

    const fixForm = new FormData();
    fixForm.append("mode", "fix-resume");
    fixForm.append("resumeFile", resumeFile);

    fetch("/api/resume-analysis", { method: "POST", body: fixForm })
      .then(async (res) => {
        const data = (await res.json()) as FixResponse;
        if (!res.ok) throw new Error(data.error || "Failed to fix resume");
        setImprovedBullets(data.improvedBullets ?? []);
        // Generate original bullets from weaknesses for before/after comparison
        setOriginalBullets([]);
        setSuccess("Resume improvement generated.");

        const nextSnapshot: AnalyzerWorkspaceSnapshot = {
          atsScore,
          label,
          summary,
          strengths,
          weaknesses,
          suggestions,
          includedKeywords,
          missingKeywords,
          sectionScores,
          matchPercentage,
          matchSummary,
          matchedKeywords,
          jobMissing,
          jobSuggestions,
          improvedBullets: data.improvedBullets ?? [],
          originalBullets: [],
          jobDescription,
          recruiterNotes,
          updatedAt: new Date().toISOString(),
        };
        void persistWorkspace(nextSnapshot);

        const email = session?.user?.email;
        if (status === "authenticated" && email) {
          void (async () => {
            await saveUserData({ name: session.user?.name ?? null, email });
            const { data: userRow } = await supabase
              .from("users")
              .select("id")
              .eq("email", email)
              .maybeSingle();
            if (!userRow?.id) return;
            await supabase.from("submissions").insert({
              user_id: userRow.id,
              language: "resume-fix",
              code: resumeFile?.name ?? "resume",
              output: `FIXED BULLETS ${data.improvedBullets?.length ?? 0}`,
              feedback: (data.improvedBullets ?? []).slice(0, 2).join(" | "),
              difficulty: "medium",
            });
          })();
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to fix resume"))
      .finally(() => setLoadingFix(false));
  };

  const downloadInterviewChecklist = () => {
    const lines = [
      "NEXTHIRE AI - INTERVIEW CHECKLIST",
      "",
      `ATS Score: ${atsScore}/100`,
      `Interview Readiness: ${interviewReadiness}%`,
      `Verdict: ${interviewVerdict}`,
      `Job Match: ${matchPercentage === null ? "--" : `${matchPercentage}%`}`,
      "",
      "PRIORITY ACTIONS",
      ...priorityActions.map((item, idx) => `${idx + 1}. ${item}`),
      "",
      "RECRUITER NOTES",
      recruiterNotes.trim() || "No notes added.",
      "",
      "TOP STRENGTHS",
      ...(strengths.length ? strengths.slice(0, 5).map((s, idx) => `${idx + 1}. ${s}`) : ["No strengths captured."]),
      "",
      "TOP WEAKNESSES",
      ...(weaknesses.length ? weaknesses.slice(0, 5).map((w, idx) => `${idx + 1}. ${w}`) : ["No weaknesses captured."]),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "interview-checklist.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={`min-h-screen px-4 pb-8 pt-2 md:px-6 md:pb-10 md:pt-3 ${isDark ? "bg-black" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link href="/my-resume" className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
            My Resume Workspace
          </Link>
        </div>

        <Glass isDark={isDark} className="p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-3">
              <h1 className={`text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Resume Analyzer</h1>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
                  <UploadCloud className="h-4 w-4" />
                  Upload Resume
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
                </label>
                {resumeFile && <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{resumeFile.name}</span>}
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste job description for advanced job match..."
                className={`w-full rounded-2xl border px-4 py-3 outline-none ${isDark ? "border-white/15 bg-white/5 text-white" : "border-black/15 bg-white text-black"}`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={analyzeAll}
                disabled={!canAnalyze || loadingAnalyze}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
                }`}
              >
                {loadingAnalyze ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Re-analyze
              </button>
            </div>
          </div>
        </Glass>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Glass isDark={isDark} className="p-6 lg:col-span-4">
            <h2 className={`mb-4 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>ATS Score</h2>
            {atsScore === null ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className={`text-6xl font-light opacity-30 ${isDark ? "text-white" : "text-black"}`}>--</div>
                <p className={`mt-3 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>Upload a resume to analyze</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex justify-center">
                  <Ring score={atsScore ?? 0} isDark={isDark} />
                </div>
                <p className={`text-center text-sm font-semibold ${scoreClass(atsScore ?? 0, isDark)}`}>{label ?? "--"}</p>
              </>
            )}
          </Glass>

          <Glass isDark={isDark} className="p-6 lg:col-span-8">
            <h2 className={`mb-3 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>AI Resume Summary</h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{summary}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Interview Readiness</p>
                <p className={`mt-1 text-2xl font-bold ${scoreClass(interviewReadiness, isDark)}`}>{interviewReadiness}%</p>
              </div>
              <div className={`rounded-xl border p-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Verdict</p>
                <p className={`mt-1 text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}>{interviewVerdict}</p>
              </div>
            </div>
          </Glass>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Glass isDark={isDark} className="p-6">
            <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Strengths</h3>
            {strengths.length === 0 ? <p className={isDark ? "text-gray-400" : "text-gray-600"}>No analysis yet.</p> : (
              <ul className="space-y-2">
                {strengths.map((item, idx) => (
                  <li key={`${item}-${idx}`} className={`flex gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Glass>

          <Glass isDark={isDark} className="p-6">
            <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Weaknesses</h3>
            {weaknesses.length === 0 ? <p className={isDark ? "text-gray-400" : "text-gray-600"}>No analysis yet.</p> : (
              <ul className="space-y-2">
                {weaknesses.map((item, idx) => (
                  <li key={`${item}-${idx}`} className={`flex gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    <TriangleAlert className={`mt-0.5 h-4 w-4 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Glass>
        </div>

        <Glass isDark={isDark} className="p-6">
          <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Keyword Analysis</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Matched / Included</p>
              <div className="flex flex-wrap gap-2">
                {includedKeywords.length === 0 ? <span className={isDark ? "text-gray-400" : "text-gray-600"}>--</span> : includedKeywords.map((k) => (
                  <span key={k} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Missing</p>
              <div className="flex flex-wrap gap-2">
                {missingKeywords.length === 0 ? <span className={isDark ? "text-gray-400" : "text-gray-600"}>--</span> : missingKeywords.map((k) => (
                  <span key={k} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>{k}</span>
                ))}
              </div>
            </div>
          </div>
        </Glass>

        <Glass isDark={isDark} className="p-6 space-y-3">
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Section-wise Score</h3>
          <ScoreBar label="Skills" value={sectionScores.skills} isDark={isDark} />
          <ScoreBar label="Projects" value={sectionScores.projects} isDark={isDark} />
          <ScoreBar label="Experience" value={sectionScores.experience} isDark={isDark} />
          <ScoreBar label="Education" value={sectionScores.education} isDark={isDark} />
        </Glass>

        <Glass isDark={isDark} className="p-6">
          <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>AI Suggestions (Detailed)</h3>
          {suggestions.length === 0 ? <p className={isDark ? "text-gray-400" : "text-gray-600"}>No suggestions yet.</p> : (
            <ul className="space-y-2">
              {suggestions.map((item, idx) => (
                <li key={`${item}-${idx}`} className={`flex gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <Glass isDark={isDark} className="p-6">
          <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Priority Placement Actions</h3>
          <ul className="space-y-2">
            {priorityActions.map((item, idx) => (
              <li key={`${item}-${idx}`} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {idx + 1}. {item}
              </li>
            ))}
          </ul>
        </Glass>

        <Glass isDark={isDark} className={`p-6 border-2 ${
          isDark ? 'border-white/20 bg-linear-to-br from-white/10 to-white/5' : 'border-black/20 bg-linear-to-br from-black/5 to-black/2'
        }`}>
          <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>AI Resume Analysis</h3>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                See how AI can enhance your bullet points and descriptions
              </p>
            </div>
            <button
              onClick={fixResume}
              disabled={!canAnalyze || loadingFix}
              className={`glow-button relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-bold transition disabled:opacity-60 whitespace-nowrap ${
                isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {loadingFix ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <WandSparkles className="h-5 w-5" />
                  <span>Generate Improvements</span>
                </>
              )}
            </button>
          </div>

          {improvedBullets.length === 0 ? (
            <p className={`text-sm italic ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {loadingFix ? "Analyzing your resume and generating AI improvements..." : "No improvements yet. Click the button to analyze your resume."}
            </p>
          ) : (
            <div className="space-y-4">
              <div className={`grid gap-4 ${originalBullets.length > 0 ? 'md:grid-cols-2' : ''}`}>
                {improvedBullets.map((improved, idx) => {
                  const original = originalBullets[idx] || `Original bullet ${idx + 1}`;
                  return (
                    <div key={`${improved}-${idx}`} className="space-y-2">
                      {/* Before */}
                      <div className={`rounded-lg border p-3 ${isDark ? "border-red-500/30 bg-red-500/10" : "border-red-400/40 bg-red-50"}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-red-400" : "text-red-600"}`}>
                          Before
                        </p>
                        <p className={`text-sm leading-relaxed ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                          {original}
                        </p>
                      </div>
                      
                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className={`text-2xl ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>↓</div>
                      </div>
                      
                      {/* After */}
                      <div className={`rounded-lg border p-3 ${isDark ? "border-green-500/30 bg-green-500/10" : "border-green-400/40 bg-green-50"}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-green-400" : "text-green-600"}`}>
                          After
                        </p>
                        <p className={`text-sm leading-relaxed font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                          {improved}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className={`rounded-lg border p-4 mt-4 ${isDark ? "border-blue-500/30 bg-blue-500/5" : "border-blue-400/30 bg-blue-50"}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                  Key Improvements
                </p>
                <ul className={`space-y-1.5 text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  <li>• Added quantified metrics and business impact</li>
                  <li>• Enhanced with stronger action verbs</li>
                  <li>• Included measurable outcomes</li>
                  <li>• Improved ATS keyword alignment</li>
                </ul>
              </div>
            </div>
          )}
        </Glass>

        <Glass isDark={isDark} className="p-6">
          <h3 className={`mb-3 text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Job Match (Advanced)</h3>
          <p className={`mb-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{matchSummary}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Match</p>
              <p className={`mt-2 text-3xl font-bold ${matchPercentage === null ? (isDark ? "text-gray-500" : "text-gray-500") : scoreClass(matchPercentage, isDark)}`}>
                {matchPercentage === null ? "--" : `${matchPercentage}%`}
              </p>
            </div>
            <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {matchedKeywords.length === 0 ? <span className={isDark ? "text-gray-400" : "text-gray-600"}>--</span> : matchedKeywords.map((k) => (
                  <span key={k} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>{k}</span>
                ))}
              </div>
            </div>
            <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <p className={`mb-2 text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Missing Skills</p>
              <div className="flex flex-wrap gap-2">
                {jobMissing.length === 0 ? <span className={isDark ? "text-gray-400" : "text-gray-600"}>--</span> : jobMissing.map((k) => (
                  <span key={k} className={`rounded-full border px-2.5 py-1 text-xs ${isDark ? "border-white/20 bg-white/10 text-white" : "border-black/20 bg-black/5 text-black"}`}>{k}</span>
                ))}
              </div>
            </div>
          </div>
          {jobSuggestions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {jobSuggestions.map((item, idx) => (
                <li key={`${item}-${idx}`} className={`flex gap-2 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  <Target className={`mt-0.5 h-4 w-4 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <Glass isDark={isDark} className="p-6">
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
            <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Recruiter Notes Panel</h3>
            <button
              onClick={downloadInterviewChecklist}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              <Download className="h-4 w-4" />
              Download Interview Checklist
            </button>
            <Link
              href="/resume-builder"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              Fix In Builder
            </Link>
          </div>
          <textarea
            value={recruiterNotes}
            onChange={(e) => setRecruiterNotes(e.target.value)}
            rows={5}
            placeholder="Add recruiter or mentor notes, interview concerns, and final prep checklist..."
            className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
              isDark ? "border-white/15 bg-white/5 text-white" : "border-black/15 bg-white text-black"
            }`}
          />
        </Glass>

        {success && <p className={`text-sm ${isDark ? "text-white/85" : "text-black/75"}`}>{success}</p>}
        {error && <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{error}</p>}
      </div>
    </main>
  );
}
