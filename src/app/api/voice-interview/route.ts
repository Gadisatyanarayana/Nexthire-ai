import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getAdminClient, upsertUserAdmin } from "@/lib/supabaseAdmin";
import { getMasterSystemPrompt } from "@/lib/aiMasterPrompt";
import type { InterviewAnalysis, InterviewDifficulty, InterviewLanguage, VoiceInterviewSession, VoiceDsaQuestion } from "@/lib/interviewSession";
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

type PromptPhase = "greeting_intro" | "intro_review" | "core_interview" | "coding_round" | "final_review";

function getRemainingMinutes(sess: VoiceInterviewSession): number {
  const totalMs = Math.max(1, Number(sess.config.totalDurationMinutes || 20) * 60_000);
  const elapsed = Math.max(0, Date.now() - sess.timeline.totalStartedAt);
  const remaining = Math.max(0, totalMs - elapsed);
  return Math.ceil(remaining / 60_000);
}

function phaseObjective(phase: PromptPhase): string {
  if (phase === "greeting_intro") return "Collect concise self-introduction with role, impact, and target role.";
  if (phase === "intro_review") return "Ask one focused follow-up from intro and check communication clarity.";
  if (phase === "core_interview") return "Ask one DSA reasoning question with edge-case discussion.";
  if (phase === "coding_round") return "Drive clean implementation and complexity explanation.";
  return "Provide concise final review with actionable next steps.";
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

function resolvePromptPhase(totalElapsedMs: number): PromptPhase {
  const elapsedSec = Math.max(0, Math.floor(totalElapsedMs / 1000));
  if (elapsedSec < 120) return "greeting_intro";
  if (elapsedSec < 300) return "intro_review";
  if (elapsedSec < 900) return "core_interview";
  if (elapsedSec < 1080) return "coding_round";
  return "final_review";
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

function buildMasterInterviewerPrompt(sess: VoiceInterviewSession): string {
  const candidate = resolveCandidateName(sess);
  const totalElapsedMs = Date.now() - sess.timeline.totalStartedAt;
  const phase = resolvePromptPhase(totalElapsedMs);
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
  } else if (company === "tcs" || company === "infosys") {
    companyBias = `Target Company: ${company.toUpperCase()}. Focus on core technical fundamentals, clean documentation, robust software lifecycle checks, and basic data structures.`;
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

  const jdText = jobDescription ? `Target Job Description Context: ${jobDescription}` : "";

  return `${corePrompt}

You are NextHire AI, a highly professional, calm, and human-like interviewer.

Candidate Name: ${candidate}
Interview Duration: 20 minutes
Topic: ${String(sess.config.dsaTopic || "arrays")}
Difficulty: ${String(sess.config.difficulty || "medium")}
${companyBias}
${personaInstructions}
${jdText}

Your behavior must feel like a real human interviewer corresponding to your active Persona.

INTERVIEW FLOW
PHASE 1 (0-2 min): Greeting and intro request.
PHASE 2 (2-5 min): Intro review with polite feedback.
PHASE 3 (5-15 min): Core interview, one question at a time.
PHASE 4 (15-18 min): Coding round with one coding problem, example IO, and 2-3 test cases.
PHASE 5 (18-20 min): Final structured review.

HUMAN-LIKE BEHAVIOR
- Use natural fillers occasionally: "hmm", "okay", "right", "mhmm".
- If hesitation is detected, reassure briefly based on your active Persona.
- If silence is detected, use: "I'm here, continue when you're ready.".
- If stress appears, reassure that this is mock practice.

STAR METHOD EVALUATION (For behavioral / HR / leadership questions):
- Evaluate if the response defines: Situation, Task, Action, and Result.
- If any component is missing, ask follow-up questions to prompt for the missing details.

RULES
- Ask only one question at a time.
- Keep response short and natural (under 45 words).
- Stay on topic.
- Never say you are an AI.

CURRENT RUNTIME PHASE: ${phase}
Follow only the active phase in this turn.`;
}

function buildStructuredFinalReview(analysis: InterviewAnalysis): string {
  const communication = analysis.communicationClarity ?? analysis.selfIntroQuality;
  const technical = analysis.codeQuality;
  const problemSolving = scoreBand((analysis.codeQuality * 0.7) + (analysis.selfIntroQuality * 0.3));
  const confidence = analysis.confidenceScore ?? analysis.selfIntroQuality;
  const improvements = analysis.improvements.slice(0, 2).join(" ");

  return [
    "Final Interview Review",
    `1. Communication Skills: ${communication}/100`,
    `2. Technical Knowledge: ${technical}/100`,
    `3. Problem Solving: ${problemSolving}/100`,
    `4. Confidence Level: ${confidence}/100`,
    `5. Suggestions for Improvement: ${improvements || "Keep practicing structured explanations and edge-case thinking."}`,
    "You did well. Keep practicing daily and you'll improve.",
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

function buildFinalAnalysis(sess: VoiceInterviewSession, code: string) {
  const introMetrics = analyzeIntroTranscript(sess.introTranscript || sess.config.selfIntroduction || "");
  const codeMetrics = analyzeCodeQuality(code || "", sess.config.difficulty);
  const overallScore = scoreBand(introMetrics.selfIntroQuality * 0.45 + codeMetrics.codeQuality * 0.55);
  const starEvaluation = evaluateSTARMetrics(sess.introTranscript || sess.config.selfIntroduction || "", introMetrics.structure);
  const learningRecommendations = generateLearningRecommendations(overallScore, codeMetrics.codeQuality, introMetrics.selfIntroQuality);

  return {
    selfIntroQuality: introMetrics.selfIntroQuality,
    codeQuality: codeMetrics.codeQuality,
    codeFindings: codeMetrics.codeFindings,
    communicationClarity: introMetrics.clarity,
    fillerWordScore: introMetrics.fillerWordScore,
    confidenceScore: introMetrics.confidence,
    introTranscriptLength: introMetrics.wordCount,
    transcript: introMetrics.transcript,
    complexity: codeMetrics.complexity,
    improvements: codeMetrics.improvements,
    strengths: [
      ...codeMetrics.strengths,
      introMetrics.selfIntroQuality >= 70
        ? "Self-introduction was structured and relevant."
        : "You handled the intro stage and can improve structure with practice.",
    ].slice(0, 4),
    aiSuggestions: [
      introMetrics.fillerWordScore < 65
        ? "Practice a 60-second intro script to reduce filler words and improve pacing."
        : "Keep your current speaking pace; it supports confident communication.",
      "For each coding round, verbalize brute-force then optimized approach before coding.",
      "Do one timed mock interview weekly and track intro + coding score trend.",
    ],
    overallScore,
    starEvaluation,
    learningRecommendations,
  };
}

async function generateInterviewerReply(sess: VoiceInterviewSession, transcript: string): Promise<string> {
  const totalElapsedMs = Date.now() - sess.timeline.totalStartedAt;
  const promptPhase = resolvePromptPhase(totalElapsedMs);
  const remainingMinutes = getRemainingMinutes(sess);
  const compactHistory = sess.aiResponses
    .slice(-8)
    .map((entry) => `${entry.role === "ai" ? "Interviewer" : "Candidate"}: ${entry.content}`)
    .join("\n");

  const defaultReplyByPhase: Record<PromptPhase, string> = {
    greeting_intro: `Hello ${resolveCandidateName(sess)}, nice to meet you. Please share a short self-introduction.`,
    intro_review: "Okay, thank you. Briefly tell me one project, your exact role, and one measurable impact.",
    core_interview: "Right. Here is one question: explain the core idea first, then one edge case, then your optimal approach.",
    coding_round: "Good attempt. Now solve one coding problem step by step, verify with one edge case, and explain complexity before submitting.",
    final_review: "Thanks. I will now give your final structured review in communication, technical depth, and confidence.",
  };

  if (!GROQ_API_KEY) {
    return defaultReplyByPhase[promptPhase];
  }

  try {
    const systemPrompt = buildMasterInterviewerPrompt(sess);
    const hesitationNote = hasHesitationIndicators(transcript)
      ? "Candidate shows hesitation. First reassure briefly, then continue with one concise question."
      : "No hesitation detected. Continue normal interviewer flow.";

    const userPrompt = `Conversation so far:\n${compactHistory}\n\nLatest candidate response:\n${transcript}\n\nRemaining time: about ${remainingMinutes} minute(s).\nCurrent objective: ${phaseObjective(promptPhase)}\n${hesitationNote}\n\nRules: ask only one question in this turn, keep response under 45 words, and stay natural/human.`;

    const reply = await callGroqAPI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const cleaned = String(reply || "").replace(/\s+/g, " ").trim();
    if (cleaned.length > 0) return cleaned;
  } catch {
    // Fallback below.
  }

  return defaultReplyByPhase[promptPhase];
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
          interviewType: body.interviewType || "Technical"
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
      const totalElapsed = now - sess.timeline.totalStartedAt;

      let nextPhase = sess.timeline.phase;
      let phaseMessage = "";

      if (sess.timeline.phase === "intro") {
        nextPhase = "dsa-question";
        
        // Dynamic difficulty adaptation
        const introMetrics = analyzeIntroTranscript(sess.introTranscript || sess.config.selfIntroduction || "");
        const score = introMetrics.selfIntroQuality;
        const oldDifficulty = sess.config.difficulty;
        sess.config.difficulty = adaptDifficulty(oldDifficulty, score);
        console.log(`Adaptive AI Difficulty: score = ${score}, shifted from ${oldDifficulty} to ${sess.config.difficulty}`);

        // Exclude previously asked questions
        const excludeList = sess.config.askedQuestionIds || [];
        sess.dsaQuestion = getRandomDsaQuestion(sess.config.difficulty, sess.config.dsaTopic, excludeList);
        
        // Track asked questions
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

        phaseMessage = `Great start. Now we move into a ${difficultyLabel} ${topicLabel} coding round. Problem: ${sess.dsaQuestion.title}. ${sess.dsaQuestion.description} Function signature: ${sess.dsaQuestion.functionName}(${sess.dsaQuestion.inputType}) -> ${sess.dsaQuestion.outputType}. ${sampleText} Explain your approach step by step, mention edge cases, and then move to implementation in the editor.`;
      } else if (sess.timeline.phase === "dsa-question") {
        if (totalElapsed > timings.intro + timings.dsaQuestion + timings.coding - 120000) {
          // Last 2 minutes
          nextPhase = "coding";
          phaseMessage = "You are in the final 2 minutes. Focus on correctness, edge cases, and clear explanation. Let us finalize your solution.";
        } else {
          nextPhase = "coding";
          phaseMessage = "Clear! Now move to implementation. Keep calm, write clean code, verify with sample test cases, and submit when confident.";
        }
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

      if (sess.timeline.phase === "intro") {
        const elapsedMs = Date.now() - sess.timeline.totalStartedAt;
        const promptPhase = resolvePromptPhase(elapsedMs);
        let coaching = "";

        if (promptPhase === "greeting_intro" || promptPhase === "intro_review") {
          const intro = analyzeIntroTranscript(sess.introTranscript || "");
          coaching = intro.fillerWordScore < 60
            ? "Take your time. No pressure. Slow down slightly, pause between points, and reduce filler words."
            : "Okay, good progress. Keep a calm pace and continue with concise, confident sentences.";
        } else {
          coaching = await generateInterviewerReply(sess, transcript);
        }

        if (hesitationDetected && !/take your time|no pressure|doing fine/i.test(coaching)) {
          coaching = `${supportiveLine()} ${coaching}`;
        }

        sess.aiResponses.push({
          role: "ai",
          content: coaching,
          timestamp: Date.now(),
        });
      } else if (sess.timeline.phase === "dsa-question" || sess.timeline.phase === "coding" || sess.timeline.phase === "submitted") {
        let reply = await generateInterviewerReply(sess, transcript);
        if (hesitationDetected && !/take your time|no pressure|doing fine/i.test(reply)) {
          reply = `${supportiveLine()} ${reply}`;
        }
        sess.aiResponses.push({
          role: "ai",
          content: reply,
          timestamp: Date.now(),
        });
      }

      await persistSession(sess);

      const latestReply = sess.aiResponses.filter((m) => m.role === "ai").slice(-1)[0]?.content || "";
      return NextResponse.json({ session: sess, accepted: true, reply: latestReply });
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
      const analysis = buildFinalAnalysis(sess, code);
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
              self_introduction: analysis.selfIntroQuality,
              code_quality: analysis.codeQuality,
              communication: analysis.communicationClarity,
              filler_words: analysis.fillerWordScore,
              confidence: analysis.confidenceScore,
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
        sess.timeline.phase = "submitted";
      }

      sess.aiResponses.push({
        role: "ai",
        content: feedbackMessage,
        timestamp: now,
      });

      const introMetrics = analyzeIntroTranscript(sess.introTranscript || sess.config.selfIntroduction || "");
      const codeMetrics = analyzeCodeQuality(body.code || "", sess.config.difficulty);
      sess.analysis = buildFinalAnalysis(sess, body.code || "");
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
