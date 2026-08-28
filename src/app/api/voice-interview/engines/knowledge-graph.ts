export interface CandidateKnowledgeGraph {
  role: string;
  experience: string;
  skills: string[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  answeredTopics: string[];
  weakTopics: string[];
  strongTopics: string[];
  pendingTopics: string[];
  scores: {
    confidence: number;
    communication: number;
    coding: number;
    systemDesign: number;
    behavioral: number;
  };
}

export function createEmptyKnowledgeGraph(): CandidateKnowledgeGraph {
  return {
    role: "Candidate",
    experience: "Unknown",
    skills: [],
    projects: [],
    answeredTopics: [],
    weakTopics: [],
    strongTopics: [],
    pendingTopics: [],
    scores: {
      confidence: 50,
      communication: 50,
      coding: 50,
      systemDesign: 50,
      behavioral: 50
    }
  };
}

export function updateKnowledgeGraph(graph: CandidateKnowledgeGraph, answerAnalysis: {
  topic: string;
  isStrong: boolean;
  scoreDeltas: Partial<CandidateKnowledgeGraph['scores']>;
}): CandidateKnowledgeGraph {
  const newGraph = { ...graph, scores: { ...graph.scores } };
  
  if (!newGraph.answeredTopics.includes(answerAnalysis.topic)) {
    newGraph.answeredTopics.push(answerAnalysis.topic);
  }

  if (answerAnalysis.isStrong) {
    if (!newGraph.strongTopics.includes(answerAnalysis.topic)) {
      newGraph.strongTopics.push(answerAnalysis.topic);
    }
    newGraph.weakTopics = newGraph.weakTopics.filter(t => t !== answerAnalysis.topic);
  } else {
    if (!newGraph.weakTopics.includes(answerAnalysis.topic)) {
      newGraph.weakTopics.push(answerAnalysis.topic);
    }
    newGraph.strongTopics = newGraph.strongTopics.filter(t => t !== answerAnalysis.topic);
  }

  for (const [key, delta] of Object.entries(answerAnalysis.scoreDeltas)) {
    if (delta !== undefined && key in newGraph.scores) {
      const currentScore = newGraph.scores[key as keyof CandidateKnowledgeGraph['scores']];
      newGraph.scores[key as keyof CandidateKnowledgeGraph['scores']] = Math.max(0, Math.min(100, currentScore + delta));
    }
  }

  return newGraph;
}
