"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Sparkles,
  Terminal,
  BookOpen,
  Trophy,
  Users,
  CheckCircle2,
  Award,
  Search,
  FileText,
  ChevronDown,
  Clock,
  ArrowRight,
  GraduationCap,
  Shield,
  Laptop,
  Flame,
  Star,
  Quote,
  MessageSquare,
  Send
} from "lucide-react";

const heroStats = [
  { label: "Placement Success Rate", value: "94.2%" },
  { label: "Partner Institutes", value: "120+ Universities" },
  { label: "Avg Salary Hike", value: "45% Increase" },
];

const trustedPartners = [
  "Google",
  "Amazon",
  "Microsoft",
  "TCS",
  "Infosys",
  "Wipro",
  "Cognizant",
  "Accenture",
];

const features = [
  {
    icon: Laptop,
    title: "AI Interview Coach",
    description: "Talk to our real-time voice-activated AI trainer. Receive instant, critical scorecards on dynamic coding, soft skills, and tech knowledge.",
    href: "/voice-interviewer",
    tag: "Voice Enabled",
  },
  {
    icon: FileText,
    title: "Resume Analyzer & Builder",
    description: "Build ATS-optimized resumes with section-by-section scoring, live keyword matching, and direct recruiter alignment feedback.",
    href: "/resume-analyzer",
    tag: "ATS Score 95+",
  },
  {
    icon: Terminal,
    title: "Elite DSA Coding Arena",
    description: "Tackle curations of coding problems in a dark, high-end sandboxed IDE. Execute and submit against comprehensive testcase suites.",
    href: "/coding",
    tag: "Auto Judged",
  },
  {
    icon: Trophy,
    title: "Placement OA Contests",
    description: "Compete in live, timed mock Online Assessments (OAs) configured to mirror top tech hiring rounds.",
    href: "/contests",
    tag: "Live Leaderboard",
  },
];

const learningTimeline = [
  {
    step: "01",
    title: "ATS Resume Precision",
    description: "Construct an ATS-optimized, high-scoring profile in the Builder. Validate keywords against specific job targets in real-time.",
    duration: "Week 1",
  },
  {
    step: "02",
    title: "Algorithmic Mastery",
    description: "Run through topic-wise coding tracks. Submit solutions in our auto-evaluating arena and review performance analytics.",
    duration: "Week 2 - 4",
  },
  {
    step: "03",
    title: "Live Conversational Prep",
    description: "Speak with the AI voice coach to refine your self-introduction, projects explanation, and behavioral scenario questions.",
    duration: "Week 5 - 6",
  },
  {
    step: "04",
    title: "OA Simulation & Matching",
    description: "Participate in timed mock tests to check pace, pass hidden testcases, and secure referral matches with corporate partners.",
    duration: "Week 7+",
  },
];

const testimonials = [
  {
    name: "Aman Sen",
    role: "Software Engineer, Google",
    quote: "The ATS resume builder and live voice AI helper completely changed my approach. I moved my resume score from 50 to 92 and felt confident speaking to the interview panels.",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "System Analyst, Amazon",
    quote: "Mock OA contests here are indistinguishable from real assessments. Finding out how I fared in time constraints against peers pushed my speed up.",
    rating: 5,
  },
  {
    name: "Kabir Mehta",
    role: "Associate Developer, Microsoft",
    quote: "Having my code evaluated instantly against edge-case test suites was a game changer. Standard platforms do not give this feedback.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "How does the AI Resume Analyzer determine my score?",
    a: "The analyzer parses your resume's structure, section headers, dynamic metrics, and keyword frequency. It matches these indicators against actual recruiter search criteria and job descriptions to issue a verified score.",
  },
  {
    q: "Can I host coding contests for my university batch?",
    a: "Yes. Our contest center allows campus trainers and batch administrators to establish private coding assessments, enforce join keys, and view detailed submission matrix tables.",
  },
  {
    q: "Is the Voice AI Assistant optimized for technical interviews?",
    a: "Absolutely. The voice assistant is trained to ask relevant DSA questions, guide you through problem-solving approaches, and provide verbal hints when you are stuck.",
  },
  {
    q: "Is there support for standard coding languages?",
    a: "Our sandboxed judge supports Python, Java, C++, JavaScript, and Go, handling compiling and runtime execution in secure containers.",
  },
];

export default function Home() {
  const { data: session } = useSession();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportCategory, setSupportCategory] = useState("bug");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      if (session.user.name) setSupportName(session.user.name);
      if (session.user.email) setSupportEmail(session.user.email);
    }
  }, [session]);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    setSupportSending(true);
    setSupportError(null);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: supportName,
          email: supportEmail,
          category: supportCategory,
          message: supportMessage,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit message.");

      setSupportSuccess(true);
    } catch (err: any) {
      setSupportError(err.message || "Failed to send message.");
    } finally {
      setSupportSending(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-background text-foreground premium-glow-bg overflow-x-hidden pt-20">
      {/* ── HERO SECTION ── */}
      <section className="relative px-6 py-20 md:px-12 md:py-32 max-w-7xl mx-auto z-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-semibold uppercase tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
              <span>Next-Gen Placement Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight gradient-text">
              Bridge the Gap From Campus to Top Tech Roles.
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl leading-relaxed">
              An enterprise placement training ecosystem. Master algorithms, align your resume with hiring pipelines, and train with live voice AI mock interviews.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/placement-hub"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-4 text-base font-bold text-background transition hover:opacity-90 hover:scale-[1.02]"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-xl border border-foreground/10 bg-foreground/5 px-8 py-4 text-base font-semibold text-foreground transition hover:bg-foreground/10"
              >
                <span>Trainer Login</span>
              </Link>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-foreground/10">
              {heroStats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-foreground/55">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Mockup Preview */}
          <div className="relative lg:block">
            <div className="premium-card relative z-10 backdrop-blur-md overflow-hidden bg-background/40">
              <div className="flex items-center justify-between border-b border-foreground/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs font-mono text-foreground/40">workspace.nexthire.ai</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-foreground/5 bg-foreground/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Resume ATS Score</span>
                    <span className="text-xs font-bold text-brand-green">92 / 100</span>
                  </div>
                  <div className="w-full bg-foreground/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-green h-full rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-foreground/5 bg-foreground/5 text-center">
                    <span className="block text-2xl font-bold text-brand-green">42</span>
                    <span className="text-[10px] text-foreground/50 uppercase tracking-wider">DSA Solved</span>
                  </div>
                  <div className="p-4 rounded-xl border border-foreground/5 bg-foreground/5 text-center">
                    <span className="block text-2xl font-bold text-brand-purple">88%</span>
                    <span className="text-[10px] text-foreground/50 uppercase tracking-wider">Mock OA Rank</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-brand-green-glow bg-brand-green-dim/10 flex items-center gap-3">
                  <Flame className="h-5 w-5 text-brand-orange animate-pulse" />
                  <div className="text-xs">
                    <span className="font-semibold block text-brand-green">5 Days Streak Active</span>
                    <span className="text-foreground/60">Practice 1 question to continue.</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Background Glow */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-brand-blue-dim to-brand-green-dim blur-3xl opacity-30 -z-10 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY SECTION ── */}
      <section className="border-y border-foreground/10 bg-foreground/5 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 font-semibold">
            Empowering Students Placement Ready At Leading Organizations
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
            {trustedPartners.map((company) => (
              <span key={company} className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-mono">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            The Complete Toolkit For Student Success
          </h2>
          <p className="text-lg text-foreground/60">
            Purpose-built workflows engineered to turn candidate profiles into verified technical assets.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <article key={feat.title} className="premium-card flex flex-col justify-between h-full bg-background/50 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-blue-dim border border-brand-blue/30 text-brand-blue">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-foreground/5 text-foreground/70 uppercase tracking-wider">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold">{feat.title}</h3>
                  <p className="text-sm text-foreground/75 leading-relaxed">{feat.description}</p>
                </div>
                <div className="pt-6">
                  <Link
                    href={feat.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:text-brand-blue/80 transition"
                  >
                    <span>Launch Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── LEARNING JOURNEY ROADMAP ── */}
      <section className="border-t border-foreground/10 bg-foreground/5 py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">The 8-Week Training Roadmap</h2>
            <p className="text-lg text-foreground/60">
              A chronological training workflow designed to maximize offer outcomes in placement season.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto space-y-8">
            <div className="timeline-line hidden md:block" />
            {learningTimeline.map((item, idx) => (
              <div key={item.step} className="relative flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                <div className="timeline-dot bg-background">
                  {item.step}
                </div>
                <div className="flex-1 premium-card bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{item.title}</h3>
                    <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider px-2 py-0.5 rounded border border-brand-blue/20 bg-brand-blue-dim/10">
                      {item.duration}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS SECTION ── */}
      <section className="px-6 py-24 max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Student Success Stories</h2>
          <p className="text-lg text-foreground/60">
            Hear from university graduates who translated learning streaks into dream tech career placements.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="premium-card flex flex-col justify-between bg-background/50">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-orange text-brand-orange" />
                  ))}
                </div>
                <Quote className="h-8 w-8 text-foreground/10" />
                <p className="text-sm text-foreground/75 italic leading-relaxed">"{t.quote}"</p>
              </div>
              <div className="pt-6 border-t border-foreground/5 mt-6">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-foreground/55">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CERTIFICATIONS & PARTNERS ── */}
      <section className="border-t border-foreground/10 bg-foreground/5 py-24 px-6 text-center">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Industry-Recognized Certifications</h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Each module milestone unlocks digital credentials verifiable on LinkedIn, backed by our partner institutions.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="px-6 py-4 rounded-xl border border-foreground/10 bg-background/50 backdrop-blur text-sm font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-purple" />
              <span>Full-Stack Readiness Badge</span>
            </div>
            <div className="px-6 py-4 rounded-xl border border-foreground/10 bg-background/50 backdrop-blur text-sm font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-blue" />
              <span>Data Structures Champion Certificate</span>
            </div>
            <div className="px-6 py-4 rounded-xl border border-foreground/10 bg-background/50 backdrop-blur text-sm font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-green" />
              <span>System Design Intermediate Level</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="px-6 py-24 max-w-4xl mx-auto space-y-12">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="premium-card bg-background/30 cursor-pointer overflow-hidden transition-all duration-300"
                onClick={() => setActiveFaq(isOpen ? null : index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base md:text-lg font-semibold">{faq.q}</h3>
                  <ChevronDown
                    className={`h-5 w-5 text-foreground/50 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </div>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "mt-4 max-h-60 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  <p className="text-sm text-foreground/75 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LEAN SUPPORT & FEEDBACK SECTION ── */}
      <section className="px-6 py-20 max-w-3xl mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-foreground/10 bg-foreground/5 text-xs font-semibold uppercase tracking-[0.16em]">
            <MessageSquare className="h-3.5 w-3.5 text-brand-blue" />
            <span>Connect with Admin</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Need Help or Found a Bug?</h2>
          <p className="text-base text-foreground/60">
            Submit your bug reports, feature requests, or updates directly to the platform admin.
          </p>
        </div>

        <div className="premium-card bg-background/50 backdrop-blur-md">
          {supportSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-brand-green-dim/10 border border-brand-green/30 rounded-full flex items-center justify-center mx-auto text-brand-green">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-brand-green text-center">Message Sent Successfully!</h3>
              <p className="text-sm text-foreground/60 max-w-md mx-auto text-center">
                Thank you for your feedback. The administrator will review your message shortly.
              </p>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupportSuccess(false);
                    setSupportMessage("");
                  }}
                  className="btn btn-ghost text-xs"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              {supportError && (
                <div className="p-3 rounded-lg border border-brand-red/25 bg-brand-red/5 text-xs text-brand-red text-center">
                  {supportError}
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/75">Your Name</label>
                  <input
                    type="text"
                    required
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 px-4 text-sm rounded-xl border border-foreground/10 bg-foreground/5 outline-none focus:border-brand-blue/30 text-foreground placeholder:text-foreground/35"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/75">Your Email</label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full h-11 px-4 text-sm rounded-xl border border-foreground/10 bg-foreground/5 outline-none focus:border-brand-blue/30 text-foreground placeholder:text-foreground/35"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/75">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bug", label: "Bug Report" },
                    { id: "update", label: "Feature Update" },
                    { id: "general", label: "General Inquiry" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSupportCategory(cat.id)}
                      className={`h-10 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                        supportCategory === cat.id
                          ? "bg-brand-blue-dim/20 border-brand-blue/35 text-brand-blue"
                          : "border-foreground/10 bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/75">Message Description</label>
                <textarea
                  rows={4}
                  required
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Please describe the issue or suggestion..."
                  className="w-full p-4 text-sm rounded-xl border border-foreground/10 bg-foreground/5 outline-none resize-none focus:border-brand-blue/30 text-foreground placeholder:text-foreground/35"
                />
              </div>

              <button
                type="submit"
                disabled={supportSending || !supportMessage.trim()}
                className="w-full py-3.5 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {supportSending ? (
                  <>
                    <span className="spinner" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Message to Admin</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-foreground/10 px-6 py-24 max-w-7xl mx-auto text-center space-y-8 relative overflow-hidden">
        <div className="space-y-4 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight gradient-text">Elevate Your Placement Prep Today.</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Get access to standard-compliant testing sandboxes, ATS tools, and live training matrices.
          </p>
        </div>
        <div className="flex justify-center gap-4 relative z-10">
          <Link
            href="/placement-hub"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-4 text-base font-bold text-background transition hover:opacity-90 hover:scale-[1.02]"
          >
            <span>Access Workspace</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        {/* Glow */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-blue-dim blur-3xl opacity-20 -z-10 rounded-full" />
      </section>

      {/* ── PROFESSIONAL FOOTER ── */}
      <footer className="border-t border-foreground/10 bg-foreground/5 px-6 py-16 md:px-12">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <span className="text-xl font-bold tracking-tight">NEXTHIRE AI</span>
            <p className="text-sm text-foreground/65">
              Next-generation training and evaluation engine configured for placement preparation.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Modules</h4>
            <div className="space-y-2 text-sm text-foreground/70">
              <Link href="/my-resume" className="block hover:text-foreground transition">Resume Workspace</Link>
              <Link href="/resume-analyzer" className="block hover:text-foreground transition">Resume Analyzer</Link>
              <Link href="/resume-builder" className="block hover:text-foreground transition">Resume Builder</Link>
              <Link href="/coding" className="block hover:text-foreground transition">Coding Arena</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Ecosystem</h4>
            <div className="space-y-2 text-sm text-foreground/70">
              <Link href="/placement-hub" className="block hover:text-foreground transition">Placement Hub</Link>
              <Link href="/contests" className="block hover:text-foreground transition">Mock Contests</Link>
              <Link href="/voice-interviewer" className="block hover:text-foreground transition">Voice Coach</Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">About</h4>
            <p className="text-sm text-foreground/65 leading-relaxed">
              Designed as a professional utility dashboard. Integrates Supabase and containerized sandboxes for reliable execution.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-foreground/5 text-xs text-foreground/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2026 NextHire AI. Built for verified student career success.</span>
          <div className="flex gap-6">
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
