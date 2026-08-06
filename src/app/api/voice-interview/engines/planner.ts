import { CandidateKnowledgeGraph } from "./knowledge-graph";

export type InterviewRound = "Intro" | "Resume" | "Technical" | "Coding" | "SystemDesign" | "Behavioral" | "HR" | "Finished";

export function determineNextRound(currentRound: InterviewRound, elapsedTimeMs: number, totalDurationMs: number): InterviewRound {
  if (elapsedTimeMs > totalDurationMs - 120000) return "Finished"; // Last 2 mins for closing
  
  // Basic time-based progression for demo purposes
  const progress = elapsedTimeMs / totalDurationMs;
  
  if (progress < 0.1) return "Intro";
  if (progress < 0.25) return "Resume";
  if (progress < 0.45) return "Technical";
  if (progress < 0.60) return "Coding";
  if (progress < 0.75) return "SystemDesign";
  if (progress < 0.90) return "Behavioral";
  return "HR";
}

export function selectNextTopic(round: InterviewRound, graph: CandidateKnowledgeGraph): string {
  // Check pending follow-ups first
  if (graph.pendingTopics.length > 0) {
    const topic = graph.pendingTopics[0];
    graph.pendingTopics.shift();
    return `Follow-up on: ${topic}`;
  }

  if (round === "Resume") {
    // Pick an un-asked project
    const unaskedProjects = graph.projects.filter(p => !graph.answeredTopics.includes(`Project: ${p.name}`));
    if (unaskedProjects.length > 0) return `Project: ${unaskedProjects[0].name}`;
    return "Resume Overview";
  }
  
  if (round === "Technical") {
    // Pick an un-asked skill
    const unaskedSkills = graph.skills.filter(s => !graph.answeredTopics.includes(`Skill: ${s}`));
    if (unaskedSkills.length > 0) {
      // Sometimes dive deep into a weak topic instead of a new one
      if (graph.weakTopics.length > 0 && Math.random() > 0.7) {
        return `Deep dive into weak area: ${graph.weakTopics[0]}`;
      }
      return `Skill: ${unaskedSkills[0]}`;
    }
    return "General Technical";
  }
  
  if (round === "Behavioral") {
    const behavioralTopics = [
      "STAR: Difficult Bug or Conflict",
      "STAR: Leadership",
      "STAR: Failure and Learning",
      "STAR: Tight Deadline"
    ];
    const unasked = behavioralTopics.filter(t => !graph.answeredTopics.includes(t));
    return unasked.length > 0 ? unasked[0] : "General Behavioral";
  }
  
  if (round === "SystemDesign") {
    return "System Design Architecture & Scalability";
  }
  
  if (round === "Intro") {
    return "Candidate Introduction";
  }
  
  return `General ${round}`;
}
