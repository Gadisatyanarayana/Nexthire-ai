import { CandidateKnowledgeGraph, updateKnowledgeGraph } from "./knowledge-graph";
import { InterviewRound, determineNextRound, selectNextTopic } from "./planner";

export interface OrchestrationContext {
  graph: CandidateKnowledgeGraph;
  currentRound: InterviewRound;
  elapsedTimeMs: number;
  totalDurationMs: number;
  companyMode: string;
  persona: string;
  candidateAnswer: string;
  llmProvider: any; // e.g. a generic wrapper around Groq/OpenAI
}

export async function orchestrateTurn(ctx: OrchestrationContext): Promise<{
  nextRound: InterviewRound;
  graph: CandidateKnowledgeGraph;
  aiReplyText: string;
}> {
  // 1. Analyze the candidate's previous answer using LLM
  // (In a full implementation, you'd prompt the LLM to score the answer 0-100 and extract topics)
  // For safety and performance, we'll do a fast evaluation pass here:
  const evaluationPrompt = `
Analyze this candidate's answer for the topic of ${ctx.currentRound}.
Answer: "${ctx.candidateAnswer}"
Did they sound confident? Provide a JSON: {"isStrong": true/false, "confidenceDelta": number (-10 to 10), "technicalDelta": number (-10 to 10)}
`;
  
  let isStrong = true;
  let scoreDeltas = { confidence: 0, technical: 0 };
  
  try {
    const evalRes = await ctx.llmProvider.generate([{ role: "user", content: evaluationPrompt }]);
    const jsonMatch = evalRes.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      isStrong = parsed.isStrong ?? true;
      scoreDeltas.confidence = parsed.confidenceDelta ?? 0;
      scoreDeltas.technical = parsed.technicalDelta ?? 0;
    }
  } catch (e) {
    console.warn("[Orchestrator] Evaluation failed, using defaults", e);
  }

  // 2. Update Memory & Scores
  const newGraph = updateKnowledgeGraph(ctx.graph, {
    topic: ctx.currentRound,
    isStrong,
    scoreDeltas: {
      confidence: scoreDeltas.confidence,
      communication: isStrong ? 2 : -2,
      coding: scoreDeltas.technical
    }
  });

  // 3. Decide Next Round
  const nextRound = determineNextRound(ctx.currentRound, ctx.elapsedTimeMs, ctx.totalDurationMs);

  // 4. Select Topic
  const nextTopic = selectNextTopic(nextRound, newGraph);

  // 5. Generate Natural Wording via LLM
  const wordingPrompt = `
You are a senior technical interviewer for ${ctx.companyMode} using a ${ctx.persona} persona.
The candidate just answered: "${ctx.candidateAnswer}"
The next topic to cover is: "${nextTopic}" (Round: ${nextRound})

Acknowledge their answer briefly, then ask a natural, targeted question about the next topic. 
Do not be robotic. Do not exceed 40 words.
`;

  const aiReplyText = await ctx.llmProvider.generate([{ role: "system", content: wordingPrompt }]);

  return {
    nextRound,
    graph: newGraph,
    aiReplyText: aiReplyText.trim()
  };
}
