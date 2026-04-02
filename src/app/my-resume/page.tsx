"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { saveUserData, supabase } from "@/lib/supabase";

type ResumeAnalyzeApiResponse = {
  atsScore?: number;
  suggestions?: string[];
  error?: string;
};

type JobMatchApiResponse = {
  matchPercentage?: number;
  error?: string;
};

function scoreToneColor(score: number, isDark: boolean): string {
  if (score < 50) return isDark ? "text-gray-300" : "text-gray-700";
  if (score <= 75) return isDark ? "text-white" : "text-black";
  return isDark ? "text-white" : "text-black";
}

function GlassCard({
  children,
  isDark,
  className,
}: {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
}) {
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

export default function MyResumePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [cloudResumePath, setCloudResumePath] = useState<string | null>(null);

  const [atsScore, setAtsScore] = useState<number | null>(72);
  const [miniSuggestions, setMiniSuggestions] = useState<string[]>([
    "Add measurable impact in project bullets (e.g., performance or user growth).",
    "Align top skills with your target role keywords.",
    "Move strongest project above less relevant entries.",
  ]);
  const [jobDescription, setJobDescription] = useState("");
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);

  const [loadingQuick, setLoadingQuick] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
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
    return () => {
      if (resumeUrl) URL.revokeObjectURL(resumeUrl);
    };
  }, [resumeUrl]);

  useEffect(() => {
    const email = session?.user?.email;
    if (status !== "authenticated" || !email) return;

    let active = true;

    const restoreCloudResume = async () => {
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
        .eq("language", "resume-upload")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const path = latest?.code;
      if (!path || !active) return;

      const signed = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signed.data?.signedUrl && active) {
        setCloudResumePath(path);
        setResumeUrl(signed.data.signedUrl);
      }
    };

    void restoreCloudResume();

    return () => {
      active = false;
    };
  }, [session, status]);

  const canMatch = useMemo(() => {
    return Boolean(resumeFile) && jobDescription.trim().length >= 20;
  }, [resumeFile, jobDescription]);

  const readinessScore = useMemo(() => {
    let score = 0;
    if (resumeFile) score += 25;
    if (typeof atsScore === "number") score += 25;
    if (typeof matchPercentage === "number") score += 25;
    if (miniSuggestions.length > 0) score += 25;
    return score;
  }, [resumeFile, atsScore, matchPercentage, miniSuggestions.length]);

  const readinessLabel = useMemo(() => {
    if (readinessScore >= 85) return "Interview Ready";
    if (readinessScore >= 60) return "Placement Ready";
    if (readinessScore >= 35) return "In Progress";
    return "Not Started";
  }, [readinessScore]);

  const actionPlan = useMemo(() => {
    const actions: string[] = [];
    if (!resumeFile) actions.push("Upload your latest one-page resume in PDF or DOCX format.");
    if (atsScore === null) actions.push("Run ATS analysis to identify formatting and keyword gaps.");
    if (miniSuggestions.length === 0) actions.push("Generate suggestions and apply at least 2 improvements.");
    if (matchPercentage === null) actions.push("Paste a target role JD and run match analysis.");
    if (typeof matchPercentage === "number" && matchPercentage < 70) {
      actions.push("Increase job match above 70% by adding missing role keywords and quantified impact bullets.");
    }
    if (actions.length === 0) {
      actions.push("Keep one tailored version per target role and re-run analysis weekly.");
    }
    return actions.slice(0, 4);
  }, [resumeFile, atsScore, miniSuggestions.length, matchPercentage]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (resumeUrl) URL.revokeObjectURL(resumeUrl);

    const url = URL.createObjectURL(file);
    setResumeFile(file);
    setResumeUrl(url);

    setAtsScore(null);
    setMiniSuggestions([]);
    setMatchPercentage(null);
    setSuccess(null);
    setError(null);

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

        const path = `${userRow.id}/${Date.now()}-${file.name}`;
        const uploadResult = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
        if (uploadResult.error) return;

        const signed = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 60 * 24 * 7);
        if (signed.data?.signedUrl) {
          setCloudResumePath(path);
          setResumeUrl(signed.data.signedUrl);
        }

        await supabase.from("submissions").insert({
          user_id: userRow.id,
          language: "resume-upload",
          code: path,
          output: "Resume uploaded",
          feedback: file.name,
          difficulty: "easy",
          result: "Uploaded",
        });
        setSuccess("Resume uploaded and synced to cloud.");
      })();
    }
  };

  const handleDelete = () => {
    if (resumeUrl) URL.revokeObjectURL(resumeUrl);

    if (cloudResumePath) {
      void supabase.storage.from("resumes").remove([cloudResumePath]);
      setCloudResumePath(null);
    }

    setResumeFile(null);
    setResumeUrl(null);
    setAtsScore(null);
    setMiniSuggestions([]);
    setJobDescription("");
    setMatchPercentage(null);
    setSuccess(null);
    setError(null);
  };

  const handleDownload = () => {
    if (!resumeUrl || !resumeFile) return;
    const a = document.createElement("a");
    a.href = resumeUrl;
    a.download = resumeFile.name;
    a.click();
  };

  const runQuickAnalysis = () => {
    if (!resumeFile) return;

    setError(null);
    setSuccess(null);
    setLoadingQuick(true);

    const formData = new FormData();
    formData.append("mode", "resume");
    formData.append("resumeFile", resumeFile);

    fetch("/api/resume-analysis", { method: "POST", body: formData })
      .then(async (res) => {
        const data = (await res.json()) as ResumeAnalyzeApiResponse;
        if (!res.ok) throw new Error(data.error || "Failed to analyze resume");

        setAtsScore(typeof data.atsScore === "number" ? data.atsScore : null);
        setMiniSuggestions((data.suggestions ?? []).slice(0, 3));
        setSuccess("Resume analyzed successfully.");

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
              language: "resume-workspace",
              code: resumeFile?.name ?? "resume",
              output: `ATS ${typeof data.atsScore === "number" ? data.atsScore : "--"}`,
              feedback: (data.suggestions ?? []).slice(0, 3).join(" | "),
              difficulty: "medium",
            });
          })();
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to analyze resume");
      })
      .finally(() => setLoadingQuick(false));
  };

  const runBasicMatch = () => {
    if (!resumeFile || !canMatch) return;

    setError(null);
    setSuccess(null);
    setLoadingMatch(true);

    const formData = new FormData();
    formData.append("mode", "job-match");
    formData.append("resumeFile", resumeFile);
    formData.append("jobDescription", jobDescription);

    fetch("/api/resume-analysis", { method: "POST", body: formData })
      .then(async (res) => {
        const data = (await res.json()) as JobMatchApiResponse;
        if (!res.ok) throw new Error(data.error || "Failed to analyze match");
        setMatchPercentage(typeof data.matchPercentage === "number" ? data.matchPercentage : null);
        setSuccess("Job match analysis completed.");

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
              language: "resume-match",
              code: resumeFile?.name ?? "resume",
              output: `MATCH ${typeof data.matchPercentage === "number" ? data.matchPercentage : "--"}`,
              feedback: jobDescription.slice(0, 240),
              difficulty: "medium",
            });
          })();
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to analyze match");
      })
      .finally(() => setLoadingMatch(false));
  };

  return (
    <main className={`min-h-screen px-4 pb-8 pt-2 md:px-6 md:pb-10 md:pt-3 ${isDark ? "bg-black" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className={`text-2xl md:text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>My Resume Workspace</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <GlassCard isDark={isDark} className="p-6 lg:col-span-8">
            <h2 className={`mb-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Resume Upload</h2>
            <p className={`mb-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Upload PDF or DOCX, then run quick analysis.</p>

            {!resumeFile ? (
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition ${
                  isDark ? "border-white/20 bg-white/3 hover:border-white/40" : "border-black/20 bg-black/2 hover:border-black/40"
                }`}
              >
                <UploadCloud className={`h-9 w-9 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>Drag & Drop or Click to Upload</span>
                <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>PDF / DOCX</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
              </label>
            ) : (
              <div className={`rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/3" : "border-black/10 bg-black/2"}`}>
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileText className={`h-5 w-5 ${isDark ? "text-gray-300" : "text-gray-700"}`} />
                    <span className={`${isDark ? "text-gray-200" : "text-gray-800"}`}>{resumeFile.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <label
                      className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                      }`}
                    >
                      Replace
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleUpload} className="hidden" />
                    </label>
                    <button
                      onClick={handleDelete}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                        isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
                      }`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <button
                  onClick={runQuickAnalysis}
                  disabled={loadingQuick}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-70 ${
                    isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
                  }`}
                >
                  {loadingQuick ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Refresh Quick Score
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard isDark={isDark} className="p-6 lg:col-span-4 space-y-5">
            <div>
              <h2 className={`mb-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>ATS Score</h2>
              <div className="flex items-center justify-center py-4">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="60" fill="none" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth="6" />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke={atsScore === null ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : (atsScore >= 75 ? (isDark ? '#ffffff' : '#000000') : (atsScore >= 50 ? (isDark ? '#b0b0b0' : '#707070') : '#666666'))}
                    strokeWidth="6"
                    strokeDasharray={`${atsScore === null ? 0 : (atsScore / 100) * 377} 377`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px', transition: 'stroke-dasharray 0.6s ease-out' }}
                  />
                  <text x="70" y="78" textAnchor="middle" fontSize="42" fontWeight="bold" fill={isDark ? '#ffffff' : '#000000'}>
                    {atsScore === null ? '--' : atsScore}
                  </text>
                </svg>
              </div>
            </div>

            <div className={`rounded-xl border p-4 space-y-3 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <div>
                <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Resume Status</p>
                <p className={`mt-1 text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {resumeFile ? 'Uploaded' : 'Not Uploaded'}
                </p>
              </div>
              <div>
                <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Last Analyzed</p>
                <p className={`mt-1 text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {atsScore !== null ? 'just now' : '--'}
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <p className={`text-xs uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-600"}`}>Placement Readiness</p>
              <p className={`mt-1 text-2xl font-bold ${scoreToneColor(readinessScore, isDark)}`}>{readinessScore}%</p>
              <p className={`mt-1 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{readinessLabel}</p>
            </div>

            <Link
              href="/resume-analyzer"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              Full Analyzer
            </Link>
            <Link
              href="/resume-builder"
              className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
              }`}
            >
              Open Builder
            </Link>
          </GlassCard>
        </div>

        <GlassCard isDark={isDark} className="p-6">
          <h2 className={`mb-3 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Resume Preview</h2>
          {resumeUrl ? (
            <div className="space-y-4">
              <iframe src={resumeUrl} title="Resume Preview" className="h-120 w-full rounded-2xl border border-black/10 bg-white" />
              <div className="flex gap-3 flex-wrap">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                    isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  View Resume
                </a>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${
                    isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Download Resume
                </button>
              </div>
            </div>
          ) : (
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Upload a resume to preview it here.</p>
          )}
        </GlassCard>

        <GlassCard isDark={isDark} className="p-6">
          <h2 className={`mb-4 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/resume-analyzer" className={`glow-button relative rounded-xl px-6 py-3 text-base font-bold text-center transition ${
              isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
            }`}>
              Analyze Resume
            </Link>
            <Link
              href="/resume-builder"
              className={`rounded-xl px-6 py-3 text-base font-semibold text-center transition ${
                isDark ? "border border-white/30 bg-white/5 text-white hover:bg-white/10" : "border border-black/30 bg-black/5 text-black hover:bg-black/10"
              }`}
            >
              Edit Resume
            </Link>
            <button
              onClick={handleDownload}
              disabled={!resumeFile}
              className={`rounded-xl px-6 py-3 text-base font-semibold text-center transition disabled:opacity-50 ${
                isDark ? "border border-white/30 bg-white/5 text-white hover:bg-white/10" : "border border-black/30 bg-black/5 text-black hover:bg-black/10"
              }`}
            >
              Download
            </button>
          </div>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-6">
          <h2 className={`mb-3 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Mini Suggestions</h2>
          {miniSuggestions.length === 0 ? (
            <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>Run quick analysis to get 2-3 suggestions.</p>
          ) : (
            <ul className="space-y-2">
              {miniSuggestions.map((item, idx) => (
                <li key={`${item}-${idx}`} className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  • {item}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/resume-analyzer"
            className={`mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}
          >
            Full Suggestions In Analyzer
          </Link>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-6">
          <h2 className={`mb-2 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Job Match Basic</h2>
          <p className={`mb-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Detailed role-fit insights are available on Resume Analyzer page.</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={4}
              placeholder="Paste job description..."
              className={`w-full rounded-2xl border px-4 py-3 outline-none ${
                isDark ? "border-white/15 bg-white/5 text-white" : "border-black/15 bg-white text-black"
              }`}
            />
            <button
              onClick={runBasicMatch}
              disabled={!canMatch || loadingMatch}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {loadingMatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Analyze Match
            </button>
          </div>
          <p className={`mt-4 text-2xl font-bold ${matchPercentage === null ? (isDark ? "text-gray-500" : "text-gray-500") : scoreToneColor(matchPercentage, isDark)}`}>
            {matchPercentage === null ? "Match: --" : `Match: ${matchPercentage}%`}
          </p>
          <Link
            href="/resume-analyzer"
            className={`mt-2 inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${
              isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"
            }`}
          >
            Open Detailed Job Match
          </Link>
        </GlassCard>

        <GlassCard isDark={isDark} className="p-6">
          <h2 className={`mb-3 text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Placement Action Plan</h2>
          <ul className="space-y-2">
            {actionPlan.map((item, idx) => (
              <li key={`${item}-${idx}`} className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {idx + 1}. {item}
              </li>
            ))}
          </ul>
        </GlassCard>

        {success && <p className={`text-sm ${isDark ? "text-white/85" : "text-black/75"}`}>{success}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </main>
  );
}
