import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { getMasterSystemPrompt } from "@/lib/aiMasterPrompt";
import type { InterviewAnalysis, InterviewDifficulty, InterviewLanguage, VoiceInterviewSession, VoiceDsaQuestion, InterviewPhase } from "@/lib/interviewSession";
import { getPhaseTimings, generateSessionId } from "@/lib/interviewSession";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODELS = [
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "actually",
  "basically",
  "literally",
  "sort of",
  "kind of",
];

type PromptPhase = "intro" | "hr" | "technical" | "coding" | "system_design" | "behavioral" | "feedback";

function getRemainingMinutes(sess: VoiceInterviewSession): number {
  const totalMs = Math.max(1, Number(sess.config.totalDurationMinutes || 20) * 60_000);
  const elapsed = Math.max(0, Date.now() - sess.timeline.totalStartedAt);
  const remaining = Math.max(0, totalMs - elapsed);
  return Math.ceil(remaining / 60_000);
}

function phaseObjective(phase: PromptPhase): string {
  if (phase === "intro") return "Collect concise self-introduction with role, impact, and target role.";
  if (phase === "hr") return "Evaluate motivation, background, and cultural fit.";
  if (phase === "technical") return "Assess core technical knowledge and problem-solving without code.";
  if (phase === "coding") return "Drive clean implementation, verify logic, and ask for time/space complexity.";
  if (phase === "system_design") return "Discuss high-level architecture, scalability, and trade-offs.";
  if (phase === "behavioral") return "Ask STAR method questions on past challenges or leadership.";
  return "Provide concise final feedback with actionable next steps.";
}

function candidateNameFromEmail(email: string): string {
  const local = String(email || "").split("@")[0] || "candidate";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  return cleaned || "candidate";
}

function resolveCandidateName(sess: VoiceInterviewSession): string {
  const explicit = String(sess.config.candidateName || "").trim();
  if (explicit) return explicit;
  return candidateNameFromEmail(sess.email);
}

function resolvePromptPhase(sess: VoiceInterviewSession): PromptPhase {
  // Hybrid logic: the phase is driven by the AI (stored in sess.timeline.phase),
  // but if the phase runs out of time, we force it forward.
  const now = Date.now();
  const elapsedInPhase = now - sess.timeline.phaseStartedAt;
  const current = sess.timeline.phase as string;

  // Max durations per phase as fallback
  const MAX_PHASE_MS: Record<string, number> = {
    intro: 2 * 60_000,
    hr: 3 * 60_000,
    technical: 5 * 60_000,
    coding: 10 * 60_000,
    system_design: 5 * 60_000,
    behavioral: 4 * 60_000,
  };

  const forcedTransitions: Record<string, PromptPhase> = {
    intro: "hr",
    hr: "technical",
    technical: "coding",
    coding: "system_design",
    system_design: "behavioral",
    behavioral: "feedback"
  };

  if (MAX_PHASE_MS[current] && elapsedInPhase > MAX_PHASE_MS[current]) {
    // Force transition due to time limit
    return forcedTransitions[current] || "feedback";
  }

  // Fallback map if the AI hasn't explicitly set it, or to map from old setup phases
  if (["setup", "intro"].includes(current)) return "intro";
  if (current === "completed") return "feedback";
  
  return current as PromptPhase;
}

function hasHesitationIndicators(text: string): boolean {
  const normalized = String(text || "").toLowerCase();
  if (!normalized) return false;
  if (/\b(uh|umm|um|hmm|erm|ah)\b/.test(normalized)) return true;
  if (/\.\.\.|--|\b(let me think|i mean|not sure)\b/.test(normalized)) return true;
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 4 && !/[.!?]$/.test(normalized.trim());
}

function supportiveLine(): string {
  const options = [
    "Take your time. No pressure.",
    "You're doing fine. Continue at your pace.",
    "No worries, this is practice. Go ahead.",
  ];
  return options[Math.floor(Math.random() * options.length)];
}

function adaptDifficulty(current: InterviewDifficulty, score: number): InterviewDifficulty {
  if (score >= 82) {
    if (current === "easy") return "medium";
    if (current === "medium") return "hard";
  } else if (score <= 58) {
    if (current === "hard") return "medium";
    if (current === "medium") return "easy";
  }
  return current;
}

function generateInitialGreeting(name: string, companyMode: string, persona: string, topic: string, difficulty: string): string {
  let companyText = "";
  if (companyMode && companyMode !== "general") {
    companyText = ` specifically tailored for the target role at ${companyMode.toUpperCase()}`;
  }

  let personaIntro = "Hello, I am your NextHire AI interviewer.";
  if (persona === "friendly") {
    personaIntro = `Hi ${name}! I'm your friendly mock interviewer today. We want to help you prepare and have a great conversation.`;
  } else if (persona === "tough") {
    personaIntro = `Welcome candidate. I am your Lead AI Recruiter. I will conduct a strict, timed placement evaluation today.`;
  } else if (persona === "startup_cto") {
    personaIntro = `Hey! I'm the CTO of our startup. Let's do a fast-paced chat about building scalable logic.`;
  } else if (persona === "hr_lead") {
    personaIntro = `Good day. I am the HR Lead. I will evaluate both your technical problem solving and leadership capabilities.`;
  }

  const topicLabel = topic.charAt(0).toUpperCase() + topic.slice(1);
  return `${personaIntro} Nice to meet you. Please start by giving a short self-introduction. We'll run a focused 20-minute evaluation round${companyText} focusing on ${topicLabel} at ${difficulty} level.`;
}

function buildMasterInterviewerPrompt(sess: VoiceInterviewSession, resumeText: string = ""): string {
  const candidate = resolveCandidateName(sess);
  const phase = resolvePromptPhase(sess);
  const corePrompt = getMasterSystemPrompt("interviewer");

  const company = sess.config.companyMode || "general";
  const persona = sess.config.persona || "professional";
  const jobDescription = sess.config.jobDescription || "";

  let companyBias = "General Placement Standard Evaluation.";
  if (company === "google") {
    companyBias = "Target Company: Google. Strict focus on algorithmic complexity, optimal space/time trade-offs, Googleyness, open-ended problem exploration, and edge-case rigor.";
  } else if (company === "amazon") {
    companyBias = "Target Company: Amazon. Inject questions mapping to Amazon Leadership Principles (Customer Obsession, Ownership, Bias for Action). Challenge coding optimization and scalability.";
  } else if (company === "microsoft") {
    companyBias = "Target Company: Microsoft. Encourage clean, modular design patterns, growth mindset, accessibility, and clear structural explanation.";
  } else if (company === "tcs" || company === "infosys" || company === "accenture") {
    companyBias = `Target Company: ${company.toUpperCase()}. Focus on core technical fundamentals, clean documentation, robust software lifecycle checks, basic data structures, and aptitude.`;
  } else if (company === "meta") {
    companyBias = "Target Company: Meta. Focus on speed of execution, rapid reasoning, optimal time complexity, and direct logical implementation.";
  } else if (company === "apple") {
    companyBias = "Target Company: Apple. Strict focus on accuracy, details, privacy, memory efficiency, and robust resource usage.";
  }

  let personaInstructions = "Persona: Professional Interviewer. Professional, objective, balanced, and structured.";
  if (persona === "friendly") {
    personaInstructions = "Persona: Friendly Recruiter. Warm, encouraging, supportive, smiles in tone, reassures if candidate hesitates, keeps it lower pressure.";
  } else if (persona === "tough") {
    personaInstructions = "Persona: Tough Recruiter. Strict, no-nonsense, direct, questions assumptions, demands optimal complexity, challenges answers with hard follow-ups.";
  } else if (persona === "startup_cto") {
    personaInstructions = "Persona: Startup CTO. Fast-paced, pragmatic, hands-on, focus on scaling, shipping code fast, no fluff, values raw problem-solving speed.";
  } else if (persona === "hr_lead") {
    personaInstructions = "Persona: HR Lead. Focuses on leadership behavior, soft skills, team alignment, adaptability, alongside technical correctness.";
  }

  const jdText = jobDescription ? `Target Job Description Context: ${jobDescription}\n` : "";
  const resumeContext = resumeText ? `Candidate Resume Context: ${resumeText.substring(0, 1500)}...\nUse this resume to ask personalized, intelligent follow-up questions.` : "";

  return `${corePrompt}

You are NextHire AI, a highly professional, calm, and human-like interviewer.

Candidate Name: ${candidate}
Interview Duration: 20 minutes
Topic: ${String(sess.config.dsaTopic || "arrays")}
Difficulty: ${String(sess.config.difficulty || "medium")}
${companyBias}
${personaInstructions}
${jdText}${resumeContext}

Your behavior must feel like a real human interviewer corresponding to your active Persona.

HYBRID PROGRESSION (AI DRIVEN)
You control the interview stage. When you feel a stage is complete and it is time to move to the next stage, you MUST include the exact exact token "[STAGE: NEXT_STAGE_NAME]" anywhere in your response, where NEXT_STAGE_NAME is one of: [HR, TECHNICAL, CODING, SYSTEM_DESIGN, BEHAVIORAL, FEEDBACK]. 
Example: "Great answer. Let's move on. [STAGE: CODING]"

INTERVIEW FLOW STAGES
- INTRO: Greeting and intro request.
- HR: Motivation, culture fit.
- TECHNICAL: Conceptual CS questions.
- CODING: DSA logic.
- SYSTEM_DESIGN: Scalability/Architecture.
- BEHAVIORAL: STAR method questions.
- FEEDBACK: Final wrap up.

HUMAN-LIKE BEHAVIOR
- Generate intelligent follow-up questions dynamically based on the candidate's last answer. Do not ask generic questions.
- Use natural fillers occasionally: "hmm", "okay", "right", "mhmm".
- Keep response short and natural (under 45 words).
- Stay on topic.
- Never say you are an AI.

CURRENT RUNTIME PHASE: ${phase}
Follow only the active phase in this turn. Ask exactly one question.`;
}

function buildStructuredFinalReview(analysis: InterviewAnalysis): string {
  const improvements = analysis.improvements.slice(0, 2).join(" ");

  return [
    "Final Interview Review",
    `1. Communication: ${analysis.communication}/100`,
    `2. Technical Knowledge: ${analysis.technicalKnowledge}/100`,
    `3. Coding: ${analysis.coding}/100`,
    `4. System Design: ${analysis.systemDesign}/100`,
    `5. Problem Solving: ${analysis.problemSolving}/100`,
    `6. Confidence: ${analysis.confidence}/100`,
    `7. Grammar: ${analysis.grammar}/100`,
    `8. Speaking Fluency: ${analysis.speakingFluency}/100`,
    `9. Resume Knowledge: ${analysis.resumeKnowledge}/100`,
    `10. Behavioral Skills: ${analysis.behavioralSkills}/100`,
    `Overall Placement Readiness Score: ${analysis.overallScore}/100`,
    `Suggestions for Improvement: ${improvements || "Keep practicing structured explanations and edge-case thinking."}`,
    "You did well. A full transcript and PDF report will be generated for your review.",
  ].join("\n");
}

// In-memory sessions (in prod, use Supabase)
const activeSessions = new Map<string, VoiceInterviewSession>();

type VoiceInterviewSessionRow = {
  session_id: string;
  email: string;
  payload: VoiceInterviewSession;
  status: string;
  created_at: string;
  updated_at: string;
};

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

async function persistSession(sess: VoiceInterviewSession) {
  activeSessions.set(sess.id, sess);

  try {
    const admin = getAdminClient();
    const row = {
      session_id: sess.id,
      email: normalizeEmail(sess.email),
      payload: sess,
      status: String(sess.timeline?.phase || "setup"),
      updated_at: new Date().toISOString(),
    };
    await admin.from("voice_interview_sessions").upsert(row, { onConflict: "session_id" });
  } catch {
    // Non-blocking fallback to in-memory session map.
  }
}

async function loadSession(sessionId: string): Promise<VoiceInterviewSession | null> {
  const id = String(sessionId || "").trim();
  if (!id) return null;

  const cached = activeSessions.get(id);
  if (cached) return cached;

  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("voice_interview_sessions")
      .select("session_id, email, payload, status, created_at, updated_at")
      .eq("session_id", id)
      .maybeSingle();

    const row = data as VoiceInterviewSessionRow | null;
    if (!row?.payload || typeof row.payload !== "object") return null;
    const restored = row.payload;
    activeSessions.set(id, restored);
    return restored;
  } catch {
    return null;
  }
}

async function loadSessionForUser(sessionId: string, email: string): Promise<VoiceInterviewSession | null> {
  const sess = await loadSession(sessionId);
  if (!sess) return null;
  if (normalizeEmail(sess.email) !== normalizeEmail(email)) return null;
  return sess;
}

// Sample DSA questions by difficulty and topic (each problem includes max three test cases).
function getRandomDsaQuestion(
  difficulty: InterviewDifficulty,
  topic: string,
  excludeIds: string[] = [],
): VoiceDsaQuestion {
  const normalizedTopic = String(topic || "arrays").trim().toLowerCase();
  const questions: Record<InterviewDifficulty, Record<string, VoiceDsaQuestion[]>> = {
    easy: {
      arrays: [
        {
          id: "easy-arrays-1",
          title: "Two Sum",
          description: "Given an array nums and target, return indices of two numbers that add up to target.",
          functionName: "twoSum",
          inputType: "int[],int",
          outputType: "int[]",
          examples: [
            { input: "[2,7,11,15], 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9." },
            { input: "[3,2,4], 6", output: "[1,2]" },
            { input: "[3,3], 6", output: "[0,1]" },
          ],
          constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        },
      ],
      strings: [
        {
          id: "easy-strings-1",
          title: "Valid Anagram",
          description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
          functionName: "isAnagram",
          inputType: "String,String",
          outputType: "boolean",
          examples: [
            { input: "anagram,nagaram", output: "true" },
            { input: "rat,car", output: "false" },
            { input: "listen,silent", output: "true" },
          ],
          constraints: ["1 <= s.length, t.length <= 5 * 10^4"],
        },
      ],
      trees: [
        {
          id: "easy-trees-1",
          title: "Maximum Depth of Binary Tree",
          description: "Given the root of a binary tree, return its maximum depth.",
          functionName: "maxDepth",
          inputType: "TreeNode",
          outputType: "int",
          examples: [
            { input: "[3,9,20,null,null,15,7]", output: "3" },
            { input: "[1,null,2]", output: "2" },
            { input: "[]", output: "0" },
          ],
          constraints: ["Number of nodes is in range [0, 10^4]"],
        },
      ],
      graphs: [
        {
          id: "easy-graphs-1",
          title: "Find if Path Exists in Graph",
          description: "Given an undirected graph and two nodes source and destination, return true if a path exists.",
          functionName: "validPath",
          inputType: "int,int[][],int,int",
          outputType: "boolean",
          examples: [
            { input: "3, [[0,1],[1,2],[2,0]], 0, 2", output: "true" },
            { input: "6, [[0,1],[0,2],[3,5],[5,4],[4,3]], 0, 5", output: "false" },
            { input: "2, [[0,1]], 0, 1", output: "true" },
          ],
          constraints: ["1 <= n <= 2 * 10^5"],
        },
      ],
      dp: [
        {
          id: "easy-dp-1",
          title: "Climbing Stairs",
          description: "You are climbing a staircase. Each time you can climb 1 or 2 steps. Return number of distinct ways to reach top.",
          functionName: "climbStairs",
          inputType: "int",
          outputType: "int",
          examples: [
            { input: "2", output: "2" },
            { input: "3", output: "3" },
            { input: "5", output: "8" },
          ],
          constraints: ["1 <= n <= 45"],
        },
      ],
      sorting: [
        {
          id: "easy-sorting-1",
          title: "Sort Array By Parity",
          description: "Return an array where all even integers come before odd integers.",
          functionName: "sortArrayByParity",
          inputType: "int[]",
          outputType: "int[]",
          examples: [
            { input: "[3,1,2,4]", output: "[2,4,3,1]" },
            { input: "[0]", output: "[0]" },
            { input: "[1,2,3,4]", output: "[2,4,1,3]" },
          ],
          constraints: ["1 <= nums.length <= 5000"],
        },
      ],
      searching: [
        {
          id: "easy-searching-1",
          title: "Binary Search",
          description: "Given a sorted array and target, return index if found, otherwise return -1.",
          functionName: "search",
          inputType: "int[],int",
          outputType: "int",
          examples: [
            { input: "[-1,0,3,5,9,12], 9", output: "4" },
            { input: "[-1,0,3,5,9,12], 2", output: "-1" },
            { input: "[1], 1", output: "0" },
          ],
          constraints: ["1 <= nums.length <= 10^4"],
        },
      ],
    },
    medium: {
      strings: [
        {
          id: "medium-strings-1",
          title: "Longest Substring Without Repeating Characters",
          description: "Given a string s, find the length of the longest substring without repeating characters.",
          functionName: "lengthOfLongestSubstring",
          inputType: "String",
          outputType: "int",
          examples: [
            { input: "abcabcbb", output: "3", explanation: 'The answer is "abc".' },
            { input: "bbbbb", output: "1" },
            { input: "pwwkew", output: "3" },
          ],
          constraints: ["0 <= s.length <= 5 * 10^4"],
        },
      ],
      arrays: [
        {
          id: "medium-arrays-1",
          title: "Product of Array Except Self",
          description: "Return an array output where output[i] is the product of all elements of nums except nums[i].",
          functionName: "productExceptSelf",
          inputType: "int[]",
          outputType: "int[]",
          examples: [
            { input: "[1,2,3,4]", output: "[24,12,8,6]" },
            { input: "[-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
            { input: "[2,3,4,5]", output: "[60,40,30,24]" },
          ],
          constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
        },
      ],
      trees: [
        {
          id: "medium-trees-1",
          title: "Binary Tree Level Order Traversal",
          description: "Return the level order traversal of a binary tree as a list of levels.",
          functionName: "levelOrder",
          inputType: "TreeNode",
          outputType: "int[][]",
          examples: [
            { input: "[3,9,20,null,null,15,7]", output: "[[3],[9,20],[15,7]]" },
            { input: "[1]", output: "[[1]]" },
            { input: "[]", output: "[]" },
          ],
          constraints: ["Number of nodes is in range [0, 2000]"],
        },
      ],
      graphs: [
        {
          id: "medium-graphs-1",
          title: "Number of Provinces",
          description: "Given adjacency matrix isConnected, return the number of connected components.",
          functionName: "findCircleNum",
          inputType: "int[][]",
          outputType: "int",
          examples: [
            { input: "[[1,1,0],[1,1,0],[0,0,1]]", output: "2" },
            { input: "[[1,0,0],[0,1,0],[0,0,1]]", output: "3" },
            { input: "[[1,1,1],[1,1,1],[1,1,1]]", output: "1" },
          ],
          constraints: ["1 <= n <= 200"],
        },
      ],
      dp: [
        {
          id: "medium-dp-1",
          title: "Coin Change",
          description: "Given coins and amount, return minimum number of coins needed to make amount, or -1.",
          functionName: "coinChange",
          inputType: "int[],int",
          outputType: "int",
          examples: [
            { input: "[1,2,5], 11", output: "3" },
            { input: "[2], 3", output: "-1" },
            { input: "[1], 0", output: "0" },
          ],
          constraints: ["1 <= coins.length <= 12", "0 <= amount <= 10^4"],
        },
      ],
      sorting: [
        {
          id: "medium-sorting-1",
          title: "Sort Colors",
          description: "Sort an array containing only 0, 1, 2 in-place.",
          functionName: "sortColors",
          inputType: "int[]",
          outputType: "int[]",
          examples: [
            { input: "[2,0,2,1,1,0]", output: "[0,0,1,1,2,2]" },
            { input: "[2,0,1]", output: "[0,1,2]" },
            { input: "[0]", output: "[0]" },
          ],
          constraints: ["1 <= nums.length <= 300"],
        },
      ],
      searching: [
        {
          id: "medium-searching-1",
          title: "Search in Rotated Sorted Array",
          description: "Given rotated sorted array nums and target, return its index or -1.",
          functionName: "search",
          inputType: "int[],int",
          outputType: "int",
          examples: [
            { input: "[4,5,6,7,0,1,2], 0", output: "4" },
            { input: "[4,5,6,7,0,1,2], 3", output: "-1" },
            { input: "[1], 0", output: "-1" },
          ],
          constraints: ["1 <= nums.length <= 5000"],
        },
      ],
    },
    hard: {
      arrays: [
        {
          id: "hard-arrays-1",
          title: "Median of Two Sorted Arrays",
          description: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays in O(log (m+n)).",
          functionName: "findMedianSortedArrays",
          inputType: "int[],int[]",
          outputType: "double",
          examples: [
            { input: "[1,3], [2]", output: "2.0" },
            { input: "[1,2], [3,4]", output: "2.5" },
            { input: "[0,0], [0,0]", output: "0.0" },
          ],
          constraints: ["0 <= m, n <= 1000"],
        },
      ],
      dp: [
        {
          id: "hard-dp-1",
          title: "Edit Distance",
          description: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.",
          functionName: "minDistance",
          inputType: "String,String",
          outputType: "int",
          examples: [
            { input: "horse,ros", output: "3" },
            { input: "intention,execution", output: "5" },
            { input: "abc,abc", output: "0" },
          ],
          constraints: ["0 <= word1.length, word2.length <= 500"],
        },
      ],
      trees: [
        {
          id: "hard-trees-1",
          title: "Binary Tree Maximum Path Sum",
          description: "Given a non-empty binary tree, return the maximum path sum.",
          functionName: "maxPathSum",
          inputType: "TreeNode",
          outputType: "int",
          examples: [
            { input: "[1,2,3]", output: "6" },
            { input: "[-10,9,20,null,null,15,7]", output: "42" },
            { input: "[2,-1]", output: "2" },
          ],
          constraints: ["Number of nodes is in range [1, 3 * 10^4]"],
        },
      ],
      graphs: [
        {
          id: "hard-graphs-1",
          title: "Word Ladder",
          description: "Return length of shortest transformation sequence from beginWord to endWord.",
          functionName: "ladderLength",
          inputType: "String,String,String[]",
          outputType: "int",
          examples: [
            { input: "hit,cog,[hot,dot,dog,lot,log,cog]", output: "5" },
            { input: "hit,cog,[hot,dot,dog,lot,log]", output: "0" },
            { input: "a,c,[a,b,c]", output: "2" },
          ],
          constraints: ["1 <= wordList.length <= 5000"],
        },
      ],
      sorting: [
        {
          id: "hard-sorting-1",
          title: "Largest Number",
          description: "Arrange non-negative integers such that they form the largest number.",
          functionName: "largestNumber",
          inputType: "int[]",
          outputType: "String",
          examples: [
            { input: "[10,2]", output: "210" },
            { input: "[3,30,34,5,9]", output: "9534330" },
            { input: "[0,0]", output: "0" },
          ],
          constraints: ["1 <= nums.length <= 100"],
        },
      ],
      searching: [
        {
          id: "hard-searching-1",
          title: "Find Minimum in Rotated Sorted Array II",
          description: "Given rotated sorted array that may contain duplicates, return minimum element.",
          functionName: "findMin",
          inputType: "int[]",
          outputType: "int",
          examples: [
            { input: "[2,2,2,0,1]", output: "0" },
            { input: "[1,3,5]", output: "1" },
            { input: "[1,1,1,1]", output: "1" },
          ],
          constraints: ["1 <= nums.length <= 5000"],
        },
      ],
      strings: [
        {
          id: "hard-strings-1",
          title: "Minimum Window Substring",
          description: "Return the minimum window in s which contains all characters in t.",
          functionName: "minWindow",
          inputType: "String,String",
          outputType: "String",
          examples: [
            { input: "ADOBECODEBANC,ABC", output: "BANC" },
            { input: "a,a", output: "a" },
            { input: "a,aa", output: "" },
          ],
          constraints: ["1 <= s.length, t.length <= 10^5"],
        },
      ],
    },
  };

  const byDifficulty = questions[difficulty] || questions.easy;
  const allQuestions = Object.values(byDifficulty).flat();
  const excluded = new Set(excludeIds.filter(Boolean));

  const pickRandom = (pool: VoiceDsaQuestion[]) => {
    const available = pool.filter((question) => !excluded.has(question.id));
    const finalPool = available.length > 0 ? available : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  };

  const topicPool = byDifficulty[normalizedTopic] || byDifficulty.arrays || allQuestions;
  const distinctTopicPool = topicPool.filter((question) => !excluded.has(question.id));
  if (distinctTopicPool.length > 0) {
    return pickRandom(topicPool);
  }

  const fallbackPool = allQuestions.filter((question) => !excluded.has(question.id));
  if (fallbackPool.length > 0) {
    return pickRandom(fallbackPool);
  }

  return pickRandom(allQuestions.length > 0 ? allQuestions : questions.easy.arrays);
}

async function callGroqAPI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  let lastError = "Groq API error";

  for (const model of GROQ_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      let response: Response | null = null;
      let retries = 0;
      const maxRetries = 2;

      while (retries <= maxRetries) {
        try {
          response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
            method: "POST",
            signal: controller.signal,
            headers: {
              "Authorization": `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.7,
              max_tokens: 1024,
              top_p: 1,
            }),
          });

          if (response.ok) break;

          if (response.status === 429 || response.status === 503 || response.status === 500) {
            retries++;
            if (retries <= maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
              continue;
            }
          }
          break;
        } catch (e) {
          retries++;
          if (retries <= maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
            continue;
          }
          break;
        }
      }

      if (!response || !response.ok) {
        lastError = `Model ${model} failed${response ? ` with status ${response.status}` : ""}`;
        continue;
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content || "";
      if (content.trim().length > 0) return content;
      lastError = `No response from model ${model}`;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error(lastError);
}

type RequestBody = {
  action: "create" | "next-question" | "submit-code" | "get-session" | "submit-voice-input" | "intro-review" | "next-coding-question" | "finalize" | "followup-questions" | "upload-resume" | "get-resume" | "delete-resume";
  sessionId?: string;
  difficulty?: InterviewDifficulty;
  language?: InterviewLanguage;
  selfIntroduction?: string;
  dsaTopic?: string;
  code?: string;
  language_submit?: InterviewLanguage;
  currentQuestionId?: string;
  transcript?: string;
  file?: string;
  filename?: string;
  size?: number;
  companyMode?: string;
  persona?: string;
  jobDescription?: string;
  interviewType?: string;
};

function scoreBand(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function analyzeIntroTranscript(transcript: string) {
  const text = String(transcript || "").trim();
  const words = text.length > 0 ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lower = text.toLowerCase();

  const fillerCount = FILLER_WORDS.reduce((sum, w) => {
    const pattern = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "g");
    return sum + (lower.match(pattern)?.length || 0);
  }, 0);

  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 1;
  const mentionsBackground = /(college|student|engineer|developer|experience|intern|project)/i.test(text);
  const mentionsStrength = /(strength|strong|good at|skilled|comfortable|confident)/i.test(text);
  const mentionsGoal = /(role|career|interview|job|learn|improve|goal)/i.test(text);

  const clarity = scoreBand(50 + Math.min(30, Math.max(0, wordCount - 40) * 0.6) - fillerRatio * 80 + (mentionsBackground ? 8 : 0));
  const confidence = scoreBand(45 + (mentionsStrength ? 18 : 0) + (mentionsGoal ? 12 : 0) - fillerRatio * 70);
  const structure = scoreBand(40 + (mentionsBackground ? 16 : 0) + (mentionsStrength ? 16 : 0) + (mentionsGoal ? 16 : 0));
  const fillerWordScore = scoreBand(100 - fillerRatio * 180);
  const selfIntroQuality = scoreBand((clarity * 0.4) + (confidence * 0.3) + (structure * 0.3));

  return {
    transcript: text,
    wordCount,
    fillerCount,
    clarity,
    confidence,
    structure,
    fillerWordScore,
    selfIntroQuality,
  };
}

async function analyzeIntroTranscriptWithAI(transcript: string) {
  const fallback = analyzeIntroTranscript(transcript);
  if (!GROQ_API_KEY) return fallback;

  const text = String(transcript || "").trim();
  if (!text) return fallback;

  try {
    const response = await callGroqAPI([
      {
        role: "system",
        content:
          "You evaluate interview self-introductions. Return strict JSON only with keys: clarity, confidence, structure, fillerWordScore, summary. Scores must be integers 0-100.",
      },
      {
        role: "user",
        content: `Transcript:\n${text}\n\nReturn only JSON.`,
      },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]) as {
      clarity?: number;
      confidence?: number;
      structure?: number;
      fillerWordScore?: number;
      summary?: string;
    };

    const clarity = scoreBand(Number(parsed.clarity ?? fallback.clarity));
    const confidence = scoreBand(Number(parsed.confidence ?? fallback.confidence));
    const structure = scoreBand(Number(parsed.structure ?? fallback.structure));
    const fillerWordScore = scoreBand(Number(parsed.fillerWordScore ?? fallback.fillerWordScore));
    const selfIntroQuality = scoreBand(clarity * 0.4 + confidence * 0.3 + structure * 0.3);

    return {
      ...fallback,
      clarity,
      confidence,
      structure,
      fillerWordScore,
      selfIntroQuality,
      aiSummary: String(parsed.summary || "").trim(),
    };
  } catch {
    return fallback;
  }
}

function analyzeCodeQuality(code: string, difficulty: InterviewDifficulty) {
  const text = String(code || "");
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const hasFunction = /(def\s+|function\s+|public\s+\w+\s+\w+\s*\(|\w+\s+\w+\s*\([^)]*\)\s*\{)/.test(text);
  const hasLoop = /\bfor\b|\bwhile\b/.test(text);
  const hasCondition = /\bif\b|\bswitch\b/.test(text);
  const hasDataStruct = /\bmap\b|\bset\b|\bdict\b|\bhash\b|\bqueue\b|\bstack\b|\bvector\b|\barraylist\b|\bheap\b/i.test(text);
  const hasComments = /\/\/|#|\/\*/.test(text);
  const complexityHint = /O\([^)]*\)/i.test(text);

  const baseline = difficulty === "hard" ? 62 : difficulty === "medium" ? 68 : 74;
  const codeQuality = scoreBand(
    baseline
      + (hasFunction ? 6 : -12)
      + (hasLoop ? 6 : 0)
      + (hasCondition ? 6 : 0)
      + (hasDataStruct ? 8 : 0)
      + (hasComments ? 4 : 0)
      + (complexityHint ? 4 : 0)
      + Math.min(10, nonEmpty.length * 0.4)
  );

  const codeFindings: Array<{ line: number | null; severity: 'low' | 'medium' | 'high'; message: string }> = [];
  if (!hasFunction) {
    codeFindings.push({ line: null, severity: 'high', message: 'No clear function or method boundary was detected. Add a named solution entry point.' });
  }
  if (!hasCondition) {
    codeFindings.push({ line: null, severity: 'medium', message: 'Missing explicit edge-case branching. Check empty input and single-element cases.' });
  }
  if (!complexityHint && hasLoop) {
    codeFindings.push({ line: null, severity: 'medium', message: 'Complexity is not stated. Explain the time and space cost before submit.' });
  }
  if (nonEmpty.length > 0 && nonEmpty.length < 5) {
    codeFindings.push({ line: 1, severity: 'low', message: 'Solution is very short. Re-check readability and test coverage before final submission.' });
  }

  return {
    codeQuality,
    codeFindings,
    complexity: {
      time: hasDataStruct && hasLoop ? "O(n) to O(n log n)" : hasLoop ? "O(n^2) possible" : "O(n)",
      space: hasDataStruct ? "O(n)" : "O(1) to O(n)",
    },
    strengths: [
      hasFunction ? "Method structure is clear and interview-friendly." : "You attempted a solution under time pressure.",
      hasCondition ? "Branch handling is present for key decision points." : "You can improve decision-flow handling with explicit edge branches.",
      hasDataStruct ? "Good use of data structures for efficiency." : "Consider stronger data structure choice for optimization.",
    ],
    improvements: [
      hasComments ? "Good readability. Keep comments concise and focused on intent." : "Add 1-2 intent comments for non-trivial logic.",
      "Validate edge cases like empty input, single element, and large constraints.",
      "State time and space complexity explicitly before final submission.",
    ],
  };
}

function evaluateSTARMetrics(transcript: string, structureScore: number) {
  const text = String(transcript || "").toLowerCase();
  
  // Look for keywords indicating Situation, Task, Action, Result
  const hasSituation = /(project|context|problem|client|customer|background|scenario|was trying to|needed to)/i.test(text);
  const hasTask = /(task|responsibility|goal|objective|assigned|target|role|milestone)/i.test(text);
  const hasAction = /(i implemented|i created|i solved|i designed|i used|i built|we decided|i led|i analyzed)/i.test(text);
  const hasResult = /(result|outcome|impact|increased|decreased|improved|percentage|%|achieved|delivered|learned)/i.test(text);

  const situationScore = scoreBand((hasSituation ? 80 : 40) + structureScore * 0.2);
  const taskScore = scoreBand((hasTask ? 80 : 40) + structureScore * 0.2);
  const actionScore = scoreBand((hasAction ? 85 : 45) + structureScore * 0.15);
  const resultScore = scoreBand((hasResult ? 85 : 45) + structureScore * 0.15);

  let feedback = "Your responses follow a solid structure. To further align with the STAR framework, make sure to clearly quantify the outcomes of your projects.";
  if (!hasSituation || !hasTask) {
    feedback = "Ensure you set the stage clearly: describe the initial situation and your specific task/responsibility before jumping into technical details.";
  } else if (!hasResult) {
    feedback = "You explained your actions well, but missed stating the final result. Mention numbers, metrics, or key takeaways of your solution.";
  }

  return {
    situation: situationScore,
    task: taskScore,
    action: actionScore,
    result: resultScore,
    feedback
  };
}

function generateLearningRecommendations(overallScore: number, codeQuality: number, introQuality: number) {
  const recs = [];
  
  if (codeQuality < 75) {
    recs.push({
      subject: "Data Structures & Algorithms",
      topic: "Arrays, Strings & Graph Traversal",
      resource: "NextHire DSA Sandbox / Coding Challenges",
      urgency: "High"
    });
  } else {
    recs.push({
      subject: "Advanced Algorithms",
      topic: "Dynamic Programming & Optimization",
      resource: "LeetCode Hard Challenges / NextHire Coding Track",
      urgency: "Medium"
    });
  }

  if (overallScore < 80) {
    recs.push({
      subject: "System Design",
      topic: "Scaling API Gateways & Load Balancing",
      resource: "NextHire System Design Roadmap",
      urgency: "Medium"
    });
    recs.push({
      subject: "SQL & Databases",
      topic: "Indexing & Query Optimization",
      resource: "SQL Practice Hub / Complex Joins",
      urgency: "High"
    });
  }

  if (introQuality < 70) {
    recs.push({
      subject: "Behavioral Preparation",
      topic: "STAR Method & Leadership Principles",
      resource: "Google Warmup / STAR templates",
      urgency: "High"
    });
  }

  recs.push({
    subject: "Aptitude & Reasoning",
    topic: "Logical Puzzles & Probability",
    resource: "NextHire Placement Reasoning Tracks",
    urgency: "Low"
  });

  return recs;
}

async function buildFinalAnalysis(sess: VoiceInterviewSession, code: string): Promise<InterviewAnalysis> {
  const transcript = (sess.aiResponses || [])
    .map((r) => `${r.role === "ai" ? "Interviewer" : "Candidate"}: ${r.content}`)
    .join("\n");

  const fallback: InterviewAnalysis = {
    communication: 70, technicalKnowledge: 70, coding: 70, systemDesign: 70,
    problemSolving: 70, confidence: 70, grammar: 70, speakingFluency: 70,
    resumeKnowledge: 70, behavioralSkills: 70, overallScore: 70,
    improvements: ["Keep practicing."], strengths: ["Good effort."], aiSuggestions: [],
    complexity: { time: "O(N)", space: "O(1)" }
  };

  if (!GROQ_API_KEY) return fallback;

  try {
    const prompt = `Evaluate the following placement interview transcript and code submission.
    
Transcript:
${transcript.slice(-6000)}

Code Submission:
${code.slice(0, 2000)}

Return strict JSON only with the following keys (all integer scores 0-100):
"communication", "technicalKnowledge", "coding", "systemDesign", "problemSolving", "confidence", "grammar", "speakingFluency", "resumeKnowledge", "behavioralSkills", "overallScore".
Also include string arrays for "improvements" (max 3), "strengths" (max 3), "aiSuggestions" (max 3), and an object "complexity" with "time" and "space" string values.`;

    const response = await callGroqAPI([
      { role: "system", content: "You are an expert technical recruiter and interviewer. Output only valid JSON." },
      { role: "user", content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      communication: scoreBand(parsed.communication || 70),
      technicalKnowledge: scoreBand(parsed.technicalKnowledge || 70),
      coding: scoreBand(parsed.coding || 70),
      systemDesign: scoreBand(parsed.systemDesign || 70),
      problemSolving: scoreBand(parsed.problemSolving || 70),
      confidence: scoreBand(parsed.confidence || 70),
      grammar: scoreBand(parsed.grammar || 70),
      speakingFluency: scoreBand(parsed.speakingFluency || 70),
      resumeKnowledge: scoreBand(parsed.resumeKnowledge || 70),
      behavioralSkills: scoreBand(parsed.behavioralSkills || 70),
      overallScore: scoreBand(parsed.overallScore || 70),
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : fallback.improvements,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallback.strengths,
      aiSuggestions: Array.isArray(parsed.aiSuggestions) ? parsed.aiSuggestions : fallback.aiSuggestions,
      complexity: parsed.complexity || fallback.complexity,
    };
  } catch (e) {
    console.error("Failed to build final analysis:", e);
    return fallback;
  }
}

async function extractResumeText(email: string): Promise<string> {
  try {
    const admin = getAdminClient();
    const { data: userRow } = await admin
      .from("users")
      .select("resume_path")
      .eq("email", normalizeEmail(email))
      .maybeSingle();

    if (!userRow?.resume_path) return "";

    const { data: fileData, error } = await admin.storage.from("resumes").download(userRow.resume_path);
    if (error || !fileData) return "";

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfParseLib = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseLib.default || pdfParseLib;
    const result = await pdfParse(buffer);
    return result.text || "";
  } catch (e) {
    console.error("Failed to parse resume", e);
    return "";
  }
}

async function generateInterviewerReply(sess: VoiceInterviewSession, transcript: string, resumeText: string = ""): Promise<{ reply: string, nextPhase?: PromptPhase }> {
  const promptPhase = resolvePromptPhase(sess);
  const remainingMinutes = getRemainingMinutes(sess);
  const compactHistory = sess.aiResponses
    .slice(-8)
    .map((entry) => `${entry.role === "ai" ? "Interviewer" : "Candidate"}: ${entry.content}`)
    .join("\n");

  const defaultReplyByPhase: Record<PromptPhase, string> = {
    intro: `Hello ${resolveCandidateName(sess)}, nice to meet you. Please share a short self-introduction.`,
    hr: "Thank you. Why are you interested in this role and what is your greatest strength?",
    technical: "Let's move to some technical concepts. Explain a core technical challenge you recently solved.",
    coding: "Now we will do a coding challenge. Please explain your approach step-by-step.",
    system_design: "Let's talk about system design. How would you scale a read-heavy application?",
    behavioral: "Can you describe a time you had a conflict with a teammate and how you resolved it?",
    feedback: "Thanks. I will now compile your final placement readiness report."
  };

  if (!GROQ_API_KEY) {
    return { reply: defaultReplyByPhase[promptPhase] };
  }

  try {
    const systemPrompt = buildMasterInterviewerPrompt(sess, resumeText);
    const hesitationNote = hasHesitationIndicators(transcript)
      ? "Candidate shows hesitation. First reassure briefly, then continue with one concise question."
      : "No hesitation detected. Continue normal interviewer flow.";

    const userPrompt = `Conversation so far:\n${compactHistory}\n\nLatest candidate response:\n${transcript}\n\nRemaining time: about ${remainingMinutes} minute(s).\nCurrent objective: ${phaseObjective(promptPhase)}\n${hesitationNote}\n\nRules: ask only one question in this turn, keep response under 45 words, and stay natural/human.`;

    const rawReply = await callGroqAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    let cleaned = String(rawReply || "").replace(/\s+/g, " ").trim();
    let nextPhase: PromptPhase | undefined = undefined;

    // Detect [STAGE: XXX] token
    const stageMatch = cleaned.match(/\[STAGE:\s*([A-Z_]+)\]/i);
    if (stageMatch) {
      const extractedPhase = stageMatch[1].toLowerCase();
      const validPhases: PromptPhase[] = ["intro", "hr", "technical", "coding", "system_design", "behavioral", "feedback"];
      if (validPhases.includes(extractedPhase as PromptPhase)) {
        nextPhase = extractedPhase as PromptPhase;
      }
      cleaned = cleaned.replace(/\[STAGE:\s*[A-Z_]+\]/gi, "").trim();
    }

    if (cleaned.length > 0) return { reply: cleaned, nextPhase };
  } catch (e) {
    console.error("AI Generation failed:", e);
  }

  return { reply: defaultReplyByPhase[promptPhase] };
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const gate = await checkRateLimit({ key: `voice-interview:${ip}`, limit: 30, windowMs: 60_000 });
    if (!gate.allowed) {
      return NextResponse.json({ error: `Too many requests. Retry in ${gate.retryAfterSeconds}s.` }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;

    if (body.action === "get-resume") {
      const admin = getAdminClient();
      const { data: userRow } = await admin
        .from("users")
        .select("resume_path, resume_filename, resume_size, resume_uploaded_at")
        .eq("email", normalizeEmail(session.user.email))
        .maybeSingle();

      if (userRow?.resume_path) {
        const keywords = ["Python", "JavaScript", "React", "SQL", "Java", "C++", "AWS", "Docker", "Kubernetes", "TypeScript", "Node.js", "HTML", "CSS", "MongoDB", "PostgreSQL", "Rust", "Go", "Django", "Express"];
        const matched: string[] = [];
        const lowerName = String(userRow.resume_filename || "").toLowerCase();
        keywords.forEach(kw => {
          if (lowerName.includes(kw.toLowerCase())) {
            matched.push(kw);
          }
        });
        if (matched.length === 0) {
          matched.push("React", "Node.js", "SQL", "JavaScript");
        }

        return NextResponse.json({
          resume: {
            path: userRow.resume_path,
            filename: userRow.resume_filename,
            size: userRow.resume_size,
            uploadedAt: userRow.resume_uploaded_at,
          },
          skills: matched
        });
      }

      return NextResponse.json({ resume: null });
    }

    if (body.action === "delete-resume") {
      const admin = getAdminClient();
      const email = normalizeEmail(session.user.email);
      
      const { data: userRow } = await admin
        .from("users")
        .select("id, resume_path")
        .eq("email", email)
        .maybeSingle();

      if (userRow) {
        if (userRow.resume_path) {
          try {
            await admin.storage.from("resumes").remove([userRow.resume_path]);
          } catch (e) {
            console.error("Storage delete failed:", e);
          }
        }

        await admin
          .from("users")
          .update({
            resume_path: null,
            resume_filename: null,
            resume_size: null,
            resume_uploaded_at: null
          })
          .eq("id", userRow.id);
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "upload-resume") {
      if (!body.file || !body.filename || !body.size) {
        return NextResponse.json({ error: "Missing file payload" }, { status: 400 });
      }

      const admin = getAdminClient();
      const email = normalizeEmail(session.user.email);

      const { data: userRow } = await admin
        .from("users")
        .select("id, resume_filename, resume_size")
        .eq("email", email)
        .maybeSingle();

      if (!userRow?.id) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (userRow.resume_filename === body.filename && userRow.resume_size === body.size) {
        return NextResponse.json({ success: false, duplicate: true, error: "Duplicate resume file detected" });
      }

      const base64Data = body.file.split(",")[1] || body.file;
      const buffer = Buffer.from(base64Data, "base64");
      const path = `${userRow.id}/${body.filename}`;

      const { error: storageError } = await admin.storage
        .from("resumes")
        .upload(path, buffer, { contentType: "application/pdf", upsert: true });

      if (storageError) {
        console.error("Supabase Storage error:", storageError);
        return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
      }

      const now = new Date().toISOString();

      await admin
        .from("users")
        .update({
          resume_path: path,
          resume_filename: body.filename,
          resume_size: body.size,
          resume_uploaded_at: now
        })
        .eq("id", userRow.id);

      const keywords = ["Python", "JavaScript", "React", "SQL", "Java", "C++", "AWS", "Docker", "Kubernetes", "TypeScript", "Node.js", "HTML", "CSS", "MongoDB", "PostgreSQL", "Rust", "Go", "Django", "Express"];
      const matched: string[] = [];
      const lowerName = String(body.filename || "").toLowerCase();
      keywords.forEach(kw => {
        if (lowerName.includes(kw.toLowerCase())) {
          matched.push(kw);
        }
      });
      if (matched.length === 0) {
        matched.push("React", "Node.js", "SQL", "JavaScript");
      }

      return NextResponse.json({
        success: true,
        resumePath: path,
        skills: matched
      });
    }

    if (body.action === "create") {
      const sessionId = generateSessionId(session.user.email);
      const timings = getPhaseTimings(body.difficulty || "medium");
      const now = Date.now();

      const resumeText = await extractResumeText(session.user.email);

      const newSession: VoiceInterviewSession = {
        id: sessionId,
        email: session.user.email,
        config: {
          candidateName: String(session.user.name || candidateNameFromEmail(session.user.email || "")).trim(),
          language: body.language || "python",
          difficulty: body.difficulty || "medium",
          selfIntroduction: body.selfIntroduction || "",
          dsaTopic: body.dsaTopic || "arrays",
          totalDurationMinutes: 20,
          companyMode: body.companyMode || "general",
          persona: body.persona || "professional",
          jobDescription: body.jobDescription || "",
          askedQuestionIds: [],
          interviewType: body.interviewType || "Technical",
          resumeText,
        },
        timeline: {
          phase: "intro",
          phaseStartedAt: now,
          phaseTimeoutMs: timings.intro,
          totalStartedAt: now,
        },
        aiResponses: [
          {
            role: "ai",
            content: generateInitialGreeting(
              String(session.user.name || candidateNameFromEmail(session.user.email || "candidate")).trim(),
              body.companyMode || "general",
              body.persona || "professional",
              body.dsaTopic || "arrays",
              body.difficulty || "medium"
            ),
            timestamp: now,
          },
        ],
        createdAt: now,
      };

      await persistSession(newSession);

      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({ name: session.user?.name || null, email: session.user.email });
        await admin.from("user_activity").insert({
          user_id: user.id,
          activity_type: "voice_interview_start",
          source: "voice-interviewer",
          payload: { difficulty: body.difficulty, topic: body.dsaTopic },
          created_at: new Date().toISOString(),
        });
      } catch {
        // Analytics non-blocking
      }

      return NextResponse.json({
        session: newSession,
        phaseTimings: timings,
      });
    }

    if (body.action === "next-question") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const timings = getPhaseTimings(sess.config.difficulty);
      const now = Date.now();

      let nextPhase: InterviewPhase = sess.timeline.phase;
      let phaseMessage = "";

      if (sess.timeline.phase === "intro") {
        nextPhase = "hr";
        phaseMessage = "Let's move into the HR round. Why are you interested in this position?";
      } else if (sess.timeline.phase === "hr") {
        nextPhase = "technical";
        phaseMessage = "Moving to the technical round. Can you explain a core technical challenge you recently solved?";
      } else if (sess.timeline.phase === "technical") {
        nextPhase = "coding";

        // Exclude previously asked questions
        const excludeList = sess.config.askedQuestionIds || [];
        sess.dsaQuestion = getRandomDsaQuestion(sess.config.difficulty, sess.config.dsaTopic, excludeList);
        if (!sess.config.askedQuestionIds) {
          sess.config.askedQuestionIds = [];
        }
        sess.config.askedQuestionIds.push(sess.dsaQuestion.id);

        const samples = sess.dsaQuestion.examples.slice(0, 2);
        const sampleText = samples
          .map((example, idx) => `Sample ${idx + 1} Input: ${example.input}. Output: ${example.output}.`)
          .join(" ");

        const difficultyLabel = sess.config.difficulty === "easy" ? "Easy" : sess.config.difficulty === "medium" ? "Medium" : "Hard";
        const topicLabel = String(sess.config.dsaTopic || "arrays").charAt(0).toUpperCase() + String(sess.config.dsaTopic || "arrays").slice(1);

        phaseMessage = `Excellent. Let's move into a ${difficultyLabel} ${topicLabel} coding round. Problem: ${sess.dsaQuestion.title}. ${sess.dsaQuestion.description} Function signature: ${sess.dsaQuestion.functionName}(${sess.dsaQuestion.inputType}) -> ${sess.dsaQuestion.outputType}. ${sampleText} Explain your approach first.`;
      } else if (sess.timeline.phase === "coding") {
        nextPhase = "system_design";
        phaseMessage = "Let's move to system design. How would you design a rate-limiter for a distributed system?";
      } else if (sess.timeline.phase === "system_design") {
        nextPhase = "behavioral";
        phaseMessage = "Let's talk about behavioral skills. Tell me about a time you handled conflict within a team.";
      } else if (sess.timeline.phase === "behavioral") {
        nextPhase = "feedback";
        phaseMessage = "Thank you. I am preparing your final feedback summary now.";
      } else if (sess.timeline.phase === "feedback") {
        nextPhase = "completed";
        phaseMessage = "Evaluation completed.";
      }

      sess.timeline.phase = nextPhase;
      sess.timeline.phaseStartedAt = now;
      sess.aiResponses.push({
        role: "ai",
        content: phaseMessage,
        timestamp: now,
      });
      await persistSession(sess);

      return NextResponse.json({
        session: sess,
        nextPhase,
        message: phaseMessage,
      });
    }

    if (body.action === "submit-voice-input") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const transcript = String(body.transcript || "").trim();
      if (!transcript) {
        const quietReply = "I'm here, continue when you're ready.";
        sess.aiResponses.push({ role: "ai", content: quietReply, timestamp: Date.now() });
        await persistSession(sess);
        return NextResponse.json({ session: sess, accepted: false, reply: quietReply });
      }

      const hesitationDetected = hasHesitationIndicators(transcript);

      sess.introTranscript = [String(sess.introTranscript || ""), transcript].filter(Boolean).join(" ").trim().slice(0, 4000);
      sess.aiResponses.push({
        role: "user",
        content: transcript.slice(0, 1000),
        timestamp: Date.now(),
      });

      const { reply, nextPhase } = await generateInterviewerReply(sess, transcript, sess.config.resumeText);
      let coaching = reply;

      if (hesitationDetected && !/take your time|no pressure|doing fine/i.test(coaching)) {
        coaching = `${supportiveLine()} ${coaching}`;
      }

      if (nextPhase && nextPhase !== sess.timeline.phase) {
        sess.timeline.phase = nextPhase;
        sess.timeline.phaseStartedAt = Date.now();

        if (nextPhase === "coding" && !sess.dsaQuestion) {
           const excludeList = sess.config.askedQuestionIds || [];
           // Assuming getRandomDsaQuestion is imported and available
           sess.dsaQuestion = getRandomDsaQuestion(sess.config.difficulty, sess.config.dsaTopic, excludeList);
           if (!sess.config.askedQuestionIds) sess.config.askedQuestionIds = [];
           sess.config.askedQuestionIds.push(sess.dsaQuestion.id);
        }
      }

      sess.aiResponses.push({
        role: "ai",
        content: coaching,
        timestamp: Date.now(),
      });

      await persistSession(sess);

      return NextResponse.json({ session: sess, accepted: true, reply: coaching, phase: sess.timeline.phase });
    }

    if (body.action === "intro-review") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (!String(sess.introTranscript || "").trim()) {
        const review = "I could not hear your introduction yet. Please speak your self-introduction for at least 30-45 seconds, then I will give detailed feedback on clarity, confidence, and structure.";
        sess.aiResponses.push({ role: "ai", content: review, timestamp: Date.now() });
        await persistSession(sess);
        return NextResponse.json({ session: sess, review });
      }

      const intro = await analyzeIntroTranscriptWithAI(sess.introTranscript || "");
      const review = [
        `Self-intro review: clarity ${intro.clarity}%, confidence ${intro.confidence}%, structure ${intro.structure}%.`,
        intro.wordCount < 60
          ? "Add 3 missing points: your current role/education, one strong project outcome, and the role you are targeting."
          : "Good detail level. Keep answers in 45-60 seconds and highlight measurable impact.",
        intro.fillerWordScore < 65
          ? "Reduce filler words by pausing after each sentence."
          : "Your pacing is professional. Keep this rhythm.",
        ("aiSummary" in intro && typeof (intro as { aiSummary?: string }).aiSummary === "string" && (intro as { aiSummary?: string }).aiSummary)
          ? `Interviewer note: ${(intro as { aiSummary?: string }).aiSummary}`
          : "",
      ].filter(Boolean).join(" ");

      sess.aiResponses.push({ role: "ai", content: review, timestamp: Date.now() });
      await persistSession(sess);
      return NextResponse.json({ session: sess, review });
    }

    if (body.action === "followup-questions") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const candidate = resolveCandidateName(sess);
      const prompt = `Alright ${candidate}, one quick follow-up: if the input is empty or has one element, how should your code behave and why?`;

      sess.aiResponses.push({ role: "ai", content: prompt, timestamp: Date.now() });
      await persistSession(sess);
      return NextResponse.json({ session: sess, message: prompt });
    }

    if (body.action === "next-coding-question") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      sess.dsaQuestion = getRandomDsaQuestion(
        sess.config.difficulty,
        sess.config.dsaTopic,
        [String(body.currentQuestionId || sess.dsaQuestion?.id || "")],
      );
      sess.timeline.phase = "coding";
      sess.timeline.phaseStartedAt = Date.now();
      const samples = sess.dsaQuestion.examples.slice(0, 2);
      const sampleText = samples
        .map((example, idx) => `Sample ${idx + 1} Input: ${example.input}. Output: ${example.output}.`)
        .join(" ");

      sess.aiResponses.push({
        role: "ai",
        content: `Excellent pace. You have more than 7 minutes remaining. Here is your second problem in your selected track (${sess.config.difficulty} / ${sess.config.dsaTopic}): ${sess.dsaQuestion.title}. ${sess.dsaQuestion.description} Function signature: ${sess.dsaQuestion.functionName}(${sess.dsaQuestion.inputType}) -> ${sess.dsaQuestion.outputType}. ${sampleText} Take your time, explain your approach first, then implement.`,
        timestamp: Date.now(),
      });
      await persistSession(sess);

      return NextResponse.json({ session: sess, question: sess.dsaQuestion });
    }

    if (body.action === "finalize") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      if (sess.timeline.phase === "completed") {
        return NextResponse.json({ error: "Session already finalized", session: sess, analysis: sess.analysis }, { status: 200 });
      }

      const code = String(body.code || sess.submission?.code || "");
      if (!sess.submission) {
        sess.submission = {
          code,
          language: body.language_submit || sess.config.language,
          submittedAt: Date.now(),
        };
      }
      const analysis = await buildFinalAnalysis(sess, code);
      sess.analysis = analysis;
      sess.timeline.phase = "completed";
      const finalSummary = buildStructuredFinalReview(analysis);
      sess.aiResponses.push({
        role: "ai",
        content: finalSummary,
        timestamp: Date.now(),
      });
      await persistSession(sess);

      // Persist to structured tables for Phase 6 history, analytics, and gamification
      try {
        const admin = getAdminClient();
        const { data: userRow } = await admin
          .from("users")
          .select("id")
          .eq("email", normalizeEmail(session.user.email))
          .maybeSingle();

        if (userRow?.id) {
          const userId = userRow.id;
          const durationSec = sess.timeline?.totalStartedAt
            ? Math.floor((Date.now() - sess.timeline.totalStartedAt) / 1000)
            : 0;

          // 1. Insert history record
          const historyRow = {
            user_id: userId,
            session_id: sess.id,
            interview_type: sess.config.interviewType || "Technical",
            company_mode: sess.config.companyMode || null,
            persona: sess.config.persona || null,
            difficulty: sess.config.difficulty || "medium",
            duration_seconds: durationSec,
            questions_count: sess.aiResponses.filter((m) => m.role === "user").length || 0,
            overall_score: analysis.overallScore,
            category_scores: {
              communication: analysis.communication,
              technical_knowledge: analysis.technicalKnowledge,
              coding: analysis.coding,
              system_design: analysis.systemDesign,
              problem_solving: analysis.problemSolving,
              confidence: analysis.confidence,
              grammar: analysis.grammar,
              speaking_fluency: analysis.speakingFluency,
              resume_knowledge: analysis.resumeKnowledge,
              behavioral_skills: analysis.behavioralSkills,
            },
            transcript: sess.aiResponses,
            feedback: {
              overall_summary: finalSummary,
              strengths: analysis.strengths,
              aiSuggestions: analysis.aiSuggestions,
            },
            learning_recommendations: analysis.learningRecommendations,
            status: "completed",
            created_at: new Date().toISOString(),
          };
          await admin.from("voice_interview_history").insert(historyRow);

          // 2. Award XP and calculate Level/Streak updates
          const xpEarned = Math.round(50 + analysis.overallScore * 1.5);
          const { data: gamificationRow } = await admin
            .from("voice_interview_gamification")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          let totalXp = xpEarned;
          let streak = 1;
          let longestStreak = 1;
          let level = 1;
          let badges: string[] = [];

          if (gamificationRow) {
            totalXp = (gamificationRow.total_xp || 0) + xpEarned;
            level = Math.floor(totalXp / 500) + 1;

            const todayStr = new Date().toISOString().split("T")[0];
            const lastDateStr = gamificationRow.last_interview_date;

            if (lastDateStr) {
              const lastDate = new Date(lastDateStr);
              const today = new Date(todayStr);
              const diffTime = Math.abs(today.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                streak = (gamificationRow.current_streak || 0) + 1;
              } else if (diffDays === 0) {
                streak = gamificationRow.current_streak || 1;
              } else {
                streak = 1;
              }
            } else {
              streak = 1;
            }

            longestStreak = Math.max(gamificationRow.longest_streak || 1, streak);
            badges = Array.isArray(gamificationRow.badges) ? gamificationRow.badges : [];
          }

          const newGamification = {
            user_id: userId,
            total_xp: totalXp,
            current_streak: streak,
            longest_streak: longestStreak,
            last_interview_date: new Date().toISOString().split("T")[0],
            level: level,
            badges: badges,
            updated_at: new Date().toISOString(),
          };
          await admin.from("voice_interview_gamification").upsert(newGamification, { onConflict: "user_id" });
        }
      } catch (dbErr) {
        console.error("DB persistence failed during voice interview finalization:", dbErr);
      }

      return NextResponse.json({ session: sess, analysis, message: finalSummary });
    }

    if (body.action === "submit-code") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const now = Date.now();
      const totalElapsed = now - sess.timeline.totalStartedAt;
      const timings = getPhaseTimings(sess.config.difficulty);
      const timeExpired = totalElapsed > timings.total;

      sess.submission = {
        code: body.code || "",
        language: body.language_submit || sess.config.language,
        submittedAt: now,
      };

      let feedbackMessage = "";
      if (timeExpired) {
        feedbackMessage = `Time is up. Interview complete. I'll now review your communication style, coding quality, and optimization level with clear actionable feedback.`;
        sess.timeline.phase = "completed";
      } else {
        feedbackMessage = `Excellent submission. I'll review your code for correctness, complexity, and interview-readiness.`;
        sess.timeline.phase = "system_design";
      }

      sess.aiResponses.push({
        role: "ai",
        content: feedbackMessage,
        timestamp: now,
      });

      const introMetrics = analyzeIntroTranscript(sess.introTranscript || sess.config.selfIntroduction || "");
      const codeMetrics = analyzeCodeQuality(body.code || "", sess.config.difficulty);
      sess.analysis = await buildFinalAnalysis(sess, body.code || "");
      if (timeExpired) {
        feedbackMessage = buildStructuredFinalReview(sess.analysis);
      }
      const overallScore = sess.analysis.overallScore;
      await persistSession(sess);

      try {
        const admin = getAdminClient();
        const user = await upsertUserAdmin({
          name: session.user?.name || null,
          email: session.user.email,
        });

        await admin.from("submissions").insert({
          user_id: user.id,
          language: "voice-interview",
          code: body.code || "",
          output: feedbackMessage,
          feedback: JSON.stringify({
            type: "voice_interview_summary",
            overallScore,
            introScore: introMetrics.selfIntroQuality,
            codeScore: codeMetrics.codeQuality,
            codeFindings: codeMetrics.codeFindings,
            clarityScore: introMetrics.clarity,
            confidenceScore: introMetrics.confidence,
            fillerWordScore: introMetrics.fillerWordScore,
            transcriptWordCount: introMetrics.wordCount,
            transcript: introMetrics.transcript,
            suggestions: sess.analysis.aiSuggestions,
            improvements: sess.analysis.improvements,
            strengths: sess.analysis.strengths,
            starEvaluation: sess.analysis.starEvaluation,
            learningRecommendations: sess.analysis.learningRecommendations,
          }),
          difficulty: sess.config.difficulty,
          question_id: sess.dsaQuestion?.id || null,
          result: timeExpired ? "time_exceeded" : "completed",
          contest_id: null,
        });

        await admin.from("user_activity").insert({
          user_id: user.id,
          activity_type: "voice_interview_complete",
          source: "voice-interviewer",
          payload: {
            sessionId: sess.id,
            overallScore,
            introScore: introMetrics.selfIntroQuality,
            codeScore: codeMetrics.codeQuality,
            timedOut: timeExpired,
          },
          created_at: new Date().toISOString(),
        });
      } catch {
        // Persisting analytics should not break the interview flow.
      }

      return NextResponse.json({
        session: sess,
        analysis: sess.analysis,
        message: feedbackMessage,
      });
    }

    if (body.action === "get-session") {
      const sess = await loadSessionForUser(body.sessionId || "", session.user.email);
      if (!sess) {
        return NextResponse.json({ session: null, missing: true });
      }

      return NextResponse.json({ session: sess });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice interview error";
    console.error("Voice interview error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
