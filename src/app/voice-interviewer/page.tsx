"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, Mic, MicOff, Play, Square } from "lucide-react";
import Editor from "@monaco-editor/react";
import type { InterviewDifficulty, InterviewLanguage, VoiceInterviewSession } from "@/lib/interviewSession";
import { getPhaseTimings, formatTimeRemaining } from "@/lib/interviewSession";

type UIPhase = "setup" | "interview" | "completed";

export default function VoiceInterviewerPage() {
  const { status } = useSession();
  const [isDark, setIsDark] = useState(false);
  const [uiPhase, setUIPhase] = useState<UIPhase>("setup");

  // Setup form
  const [language, setLanguage] = useState<InterviewLanguage>("python");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("medium");
  const [selfIntro, setSelfIntro] = useState("");
  const [dsaTopic, setDsaTopic] = useState("arrays");
  const [setupLoading, setSetupLoading] = useState(false);

  // Interview state
  const [session, setSession] = useState<VoiceInterviewSession | null>(null);
  const [code, setCode] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Voice
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timings = getPhaseTimings(session.config.difficulty);
      const totalElapsed = now - session.timeline.totalStartedAt;
      const remaining = Math.max(0, timings.total - totalElapsed);
      setTimeRemaining(remaining);

      if (remaining === 0 && session.timeline.phase !== "completed") {
        setUIPhase("completed");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [session]);

  const startInterview = async () => {
    if (!selfIntro.trim()) {
      alert("Please provide a self-introduction");
      return;
    }

    setSetupLoading(true);
    try {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          language,
          difficulty,
          selfIntroduction: selfIntro,
          dsaTopic,
        }),
      });

      if (!res.ok) throw new Error("Failed to start interview");
      const data = (await res.json()) as { session: VoiceInterviewSession };
      setSession(data.session);
      setUIPhase("interview");

      // Speak introduction
      speakMessage(data.session.aiResponses[0]?.content || "");
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "Failed to start interview"}`);
    } finally {
      setSetupLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstart = () => setIsRecording(true);

        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch {
        alert("Microphone access denied");
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  const submitCode = async () => {
    if (!code.trim()) {
      alert("Please write some code before submitting");
      return;
    }

    if (!session) return;

    setInterviewLoading(true);
    try {
      const res = await fetch("/api/voice-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-code",
          sessionId: session.id,
          code,
          language_submit: language,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit code");
      const data = (await res.json()) as { session: VoiceInterviewSession };
      setSession(data.session);
      setUIPhase("completed");

      speakMessage(data.session.aiResponses[data.session.aiResponses.length - 1]?.content || "");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Failed to submit"}`);
    } finally {
      setInterviewLoading(false);
    }
  };

  const getTimerDisplay = () => {
    if (timeRemaining === null) return "0:00";
    return formatTimeRemaining(timeRemaining);
  };

  const getTimerBgColor = () => {
    if (!session || timeRemaining === null) return "bg-gray-500";
    const timings = getPhaseTimings(session.config.difficulty);
    const elapsed = timings.total - timeRemaining;
    const percent = (elapsed / timings.total) * 100;

    if (percent < 50) return "bg-green-500/20 border-green-500";
    if (percent < 75) return "bg-orange-500/20 border-orange-500";
    return "bg-red-500/20 border-red-500";
  };

  if (status === "loading") return null;
  if (status === "unauthenticated") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-white"}`}>
        <p className={isDark ? "text-white" : "text-black"}>Please sign in to use voice interviewer.</p>
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${isDark ? "bg-black" : "bg-white"}`}>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/placement-hub" className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-black"}`}>Voice Technical Interviewer</h1>
          <div className={`text-lg font-bold px-4 py-2 rounded-xl border-2 ${getTimerBgColor()} ${isDark ? "text-white" : "text-black"}`}>
            {getTimerDisplay()}
          </div>
        </div>

        {/* Setup Phase */}
        {uiPhase === "setup" && (
          <div className={`max-w-2xl mx-auto rounded-2xl border p-8 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Interview Setup</h2>

            <div className="space-y-4">
              <div>
                <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>
                  Programming Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as InterviewLanguage)}
                  className={`w-full mt-2 rounded-xl px-4 py-3 outline-none ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/20 text-black"}`}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as InterviewDifficulty)}
                  className={`w-full mt-2 rounded-xl px-4 py-3 outline-none ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/20 text-black"}`}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>DSA Topic</label>
                <select
                  value={dsaTopic}
                  onChange={(e) => setDsaTopic(e.target.value)}
                  className={`w-full mt-2 rounded-xl px-4 py-3 outline-none ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/20 text-black"}`}
                >
                  <option value="arrays">Arrays</option>
                  <option value="strings">Strings</option>
                  <option value="trees">Trees</option>
                  <option value="graphs">Graphs</option>
                  <option value="dp">Dynamic Programming</option>
                  <option value="sorting">Sorting</option>
                  <option value="searching">Searching</option>
                </select>
              </div>

              <div>
                <label className={`text-sm font-semibold ${isDark ? "text-white/80" : "text-black/80"}`}>
                  Self Introduction (2 min audio)
                </label>
                <textarea
                  value={selfIntro}
                  onChange={(e) => setSelfIntro(e.target.value)}
                  placeholder="Brief introduction about yourself, your background, and relevant experience..."
                  rows={4}
                  className={`w-full mt-2 rounded-xl px-4 py-3 outline-none ${isDark ? "bg-white/10 border-white/20 text-white placeholder:text-white/50" : "bg-black/5 border-black/20 text-black placeholder:text-black/50"}`}
                />
                <p className={`mt-2 text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>You can provide text. The AI will conduct the interview.</p>
              </div>

              <button
                onClick={startInterview}
                disabled={setupLoading || !selfIntro.trim()}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  isDark
                    ? "bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                    : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
                }`}
              >
                {setupLoading ? (
                  <>
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Starting Interview...
                  </>
                ) : (
                  "Start Interview (15 minutes)"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Interview Phase */}
        {uiPhase === "interview" && session && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* AI Chat / Question */}
            <div className={`lg:col-span-1 rounded-2xl border p-6 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>
                {session.timeline.phase === "intro" && "Self Introduction (2 min)"}
                {session.timeline.phase === "dsa-question" && "DSA Question (1 min)"}
                {session.timeline.phase === "coding" && "Solve (12 min)"}
              </h3>

              <div className={`space-y-4 mb-4 max-h-96 overflow-y-auto p-3 rounded-xl ${isDark ? "bg-black/50" : "bg-black/5"}`}>
                {session.aiResponses.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.role === "ai"
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-black/10 text-black"
                          : isDark
                          ? "bg-white text-black"
                          : "bg-black text-white"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {session.dsaQuestion && session.timeline.phase === "coding" && (
                <div className={`mt-4 p-3 rounded-lg border ${isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-black/5"}`}>
                  <p className={`text-xs font-semibold ${isDark ? "text-white/60" : "text-black/60"}`}>Current Problem</p>
                  <p className={`text-sm font-bold mt-1 ${isDark ? "text-white" : "text-black"}`}>{session.dsaQuestion.title}</p>
                  <p className={`text-xs mt-1 ${isDark ? "text-white/70" : "text-black/70"}`}>{session.dsaQuestion.description}</p>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => speakMessage(session.aiResponses[session.aiResponses.length - 1]?.content || "")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}
                >
                  {isSpeaking ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isSpeaking ? "Stop" : "Speak"}
                </button>
                <button
                  onClick={toggleRecording}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                    isRecording
                      ? isDark
                        ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                      : isDark
                      ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isRecording ? "Stop Rec" : "Record"}
                </button>
              </div>
            </div>

            {/* Code Editor */}
            {session.timeline.phase === "coding" && (
              <div className={`lg:col-span-2 rounded-2xl border overflow-hidden ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
                <div className={`p-4 border-b ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <h3 className={`font-bold ${isDark ? "text-white" : "text-black"}`}>Code Editor</h3>
                  <p className={`text-xs mt-1 ${isDark ? "text-white/60" : "text-black/60"}`}>Write your solution here. Tab switching is disabled during interview.</p>
                </div>

                <Editor
                  height="500px"
                  language={language === "cpp" ? "cpp" : language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme={isDark ? "vs-dark" : "vs"}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />

                <div className={`p-4 border-t ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <button
                    onClick={submitCode}
                    disabled={interviewLoading}
                    className={`w-full py-3 rounded-lg font-semibold ${
                      isDark
                        ? "bg-white text-black hover:bg-gray-100 disabled:opacity-50"
                        : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
                    }`}
                  >
                    {interviewLoading ? (
                      <>
                        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Solution"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed Phase */}
        {uiPhase === "completed" && session && session.analysis && (
          <div className={`max-w-4xl mx-auto rounded-2xl border p-8 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
            <h2 className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-black"}`}>Interview Complete!</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className={`p-4 rounded-xl ${isDark ? "bg-white/10" : "bg-black/5"}`}>
                <p className={`text-sm font-semibold ${isDark ? "text-white/60" : "text-black/60"}`}>Overall Score</p>
                <p className={`text-4xl font-bold mt-2 ${session.analysis.overallScore >= 70 ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-yellow-400" : "text-yellow-600")}`}>
                  {session.analysis.overallScore}%
                </p>
              </div>

              <div className={`p-4 rounded-xl ${isDark ? "bg-white/10" : "bg-black/5"}`}>
                <p className={`text-sm font-semibold ${isDark ? "text-white/60" : "text-black/60"}`}>Time Complexity</p>
                <p className={`text-xl font-bold mt-2 ${isDark ? "text-white" : "text-black"}`}>{session.analysis.complexity.time}</p>
                <p className={`text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>(Space: {session.analysis.complexity.space})</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className={`p-4 rounded-xl ${isDark ? "bg-green-500/10 border border-green-500/20" : "bg-green-50 border border-green-200"}`}>
                <p className={`font-semibold ${isDark ? "text-green-400" : "text-green-700"}`}>Strengths</p>
                <ul className={`mt-2 space-y-1 text-sm ${isDark ? "text-green-300" : "text-green-800"}`}>
                  {session.analysis.strengths.map((s, i) => (
                    <li key={i}>✓ {s}</li>
                  ))}
                </ul>
              </div>

              <div className={`p-4 rounded-xl ${isDark ? "bg-blue-500/10 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
                <p className={`font-semibold ${isDark ? "text-blue-400" : "text-blue-700"}`}>Areas to Improve</p>
                <ul className={`mt-2 space-y-1 text-sm ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                  {session.analysis.improvements.map((imp, i) => (
                    <li key={i}>→ {imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`mt-6 p-4 rounded-xl ${isDark ? "bg-purple-500/10 border border-purple-500/20" : "bg-purple-50 border border-purple-200"}`}>
              <p className={`font-semibold ${isDark ? "text-purple-400" : "text-purple-700"}`}>Next Steps</p>
              <ul className={`mt-2 space-y-1 text-sm ${isDark ? "text-purple-300" : "text-purple-800"}`}>
                {session.analysis.aiSuggestions.map((sugg, i) => (
                  <li key={i}>• {sugg}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/coding" className={`flex-1 py-3 rounded-xl font-semibold text-center transition ${isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-900"}`}>
                Practice More
              </Link>
              <Link href="/placement-hub" className={`flex-1 py-3 rounded-xl font-semibold text-center ${isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-black/10 text-black hover:bg-black/20"}`}>
                Back to Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
