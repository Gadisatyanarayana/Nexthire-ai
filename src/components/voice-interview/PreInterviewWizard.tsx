"use client";

import React, { useState } from "react";
import { Upload, Briefcase, Award, Building2, FileText, Target, Zap, Clock, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";

export type InterviewSetupConfig = {
  resumeFile: string | null;
  targetRole: string;
  experienceLevel: string;
  company: string;
  jobDescription: string;
  interviewType: "HR" | "Technical" | "Behavioral" | "System Design" | "Coding" | "Mixed";
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  duration: number; // in minutes
};

interface PreInterviewWizardProps {
  onComplete: (config: InterviewSetupConfig) => void;
}

export function PreInterviewWizard({ onComplete }: PreInterviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [resumeFile, setResumeFile] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("Software Development Engineer (SDE-1)");
  const [experienceLevel, setExperienceLevel] = useState("Fresher / Entry-Level (0-1 yrs)");
  const [company, setCompany] = useState("TCS NQT / Infosys");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewSetupConfig["interviewType"]>("Technical");
  const [difficulty, setDifficulty] = useState<InterviewSetupConfig["difficulty"]>("Medium");
  const [duration, setDuration] = useState(30);

  const totalSteps = 8;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete({
        resumeFile,
        targetRole,
        experienceLevel,
        company,
        jobDescription,
        interviewType,
        difficulty,
        duration
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8 font-sans">
      
      {/* Wizard Header Progress */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 mb-3">
          <span className="uppercase tracking-widest text-emerald-400">NextHire AI Interview Wizard</span>
          <span>Step {currentStep} of {totalSteps}</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Resume Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 1: Upload Your Resume</h2>
              <p className="text-xs text-zinc-400">Allows the interviewer to ask targeted questions about your projects and stack.</p>
            </div>
          </div>
          <div 
            onClick={() => setResumeFile("sample_resume_john_doe.pdf")}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              resumeFile ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-500"
            }`}
          >
            <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
            {resumeFile ? (
              <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> {resumeFile} (Attached)
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-white">Click to Upload PDF or DOCX Resume</p>
                <p className="text-xs text-zinc-500 mt-1">Or click to select sample candidate profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Target Role */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 2: Target Role</h2>
              <p className="text-xs text-zinc-400">Select the engineering or product role you are interviewing for.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Software Development Engineer (SDE-1)",
              "Full Stack Web Developer",
              "Backend Systems Engineer",
              "Frontend React / Next.js Engineer",
              "Data Structures & Algorithms Analyst",
              "DevOps & Cloud Infrastructure Engineer"
            ].map(role => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                  targetRole === role 
                    ? "border-emerald-500 bg-emerald-500/10 text-white font-bold" 
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Experience Level */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 3: Experience Level</h2>
              <p className="text-xs text-zinc-400">Sets the depth of architectural and algorithmic questions.</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { level: "Fresher / Entry-Level (0-1 yrs)", desc: "Focuses on core DSA, OOP concepts, basic SQL, and college projects." },
              { level: "Junior Engineer (1-3 yrs)", desc: "Covers data structures, API design, code optimization, and clean architecture." },
              { level: "Mid-Level Engineer (3-5 yrs)", desc: "Focuses on system design, database indexing, concurrency, and tradeoff analysis." },
              { level: "Senior / Lead (5+ yrs)", desc: "Distributed systems, fault tolerance, microservices, and leadership scenarios." }
            ].map(item => (
              <button
                key={item.level}
                onClick={() => setExperienceLevel(item.level)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  experienceLevel === item.level
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-sm font-bold">{item.level}</div>
                <div className="text-xs text-zinc-400 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Company */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 4: Target Company</h2>
              <p className="text-xs text-zinc-400">Simulates real interview patterns from top hiring companies.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["TCS NQT", "Infosys", "Wipro", "Amazon", "Google", "Microsoft", "Meta", "EY / Accenture"].map(c => (
              <button
                key={c}
                onClick={() => setCompany(c)}
                className={`p-4 rounded-xl border text-center text-xs font-bold transition-all ${
                  company === c
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Job Description */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 5: Job Description (Optional)</h2>
              <p className="text-xs text-zinc-400">Paste the specific job description to tailor the interview questions.</p>
            </div>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste Job Description requirement text here..."
            className="w-full h-36 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 transition"
          />
        </div>
      )}

      {/* Step 6: Interview Type */}
      {currentStep === 6 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 6: Interview Round Type</h2>
              <p className="text-xs text-zinc-400">Choose the evaluation round format.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { type: "Technical", desc: "Data structures, algorithms & core CS concepts" },
              { type: "Coding", desc: "Live code editor & test cases round" },
              { type: "System Design", desc: "Architecture, scalability & DB schema design" },
              { type: "Behavioral", desc: "STAR method scenario questions" },
              { type: "HR", desc: "Culture fit, salary & background evaluation" },
              { type: "Mixed", desc: "Full comprehensive hiring simulation" }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setInterviewType(item.type as any)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  interviewType === item.type
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-sm font-bold text-emerald-400">{item.type}</div>
                <div className="text-[11px] text-zinc-400 mt-1">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 7: Difficulty */}
      {currentStep === 7 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 7: Difficulty Level</h2>
              <p className="text-xs text-zinc-400">Adjust how strictly the interviewer challenges your answers.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Easy", "Medium", "Hard", "Expert"].map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d as any)}
                className={`p-4 rounded-xl border text-center text-xs font-bold transition-all ${
                  difficulty === d
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 8: Interview Duration */}
      {currentStep === 8 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Step 8: Interview Duration</h2>
              <p className="text-xs text-zinc-400">Select total time limit for the mock interview session.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[15, 30, 45, 60].map(m => (
              <button
                key={m}
                onClick={() => setDuration(m)}
                className={`p-4 rounded-xl border text-center text-xs font-bold transition-all ${
                  duration === m
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {m} Minutes
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wizard Footer Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <button
          onClick={handleNext}
          className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
        >
          {currentStep < totalSteps ? "Next Step →" : "Lock Setup & Start Interview 🚀"}
        </button>
      </div>
    </div>
  );
}
