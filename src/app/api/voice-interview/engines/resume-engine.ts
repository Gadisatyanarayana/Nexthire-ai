import { CandidateKnowledgeGraph, createEmptyKnowledgeGraph } from "./knowledge-graph";

export async function extractResumeProfile(rawPdfText: string, llmProvider: any): Promise<CandidateKnowledgeGraph> {
  const prompt = `
You are a Resume Intelligence Engine. Extract the following information from the raw resume text and output ONLY valid JSON matching this schema:
{
  "role": "string (e.g. Java Backend Developer)",
  "experience": "string (e.g. Fresher, 5 years)",
  "skills": ["string"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "strengths": ["string"],
  "weaknesses": ["string"]
}

Raw Resume Text:
${rawPdfText.substring(0, 10000)}
`;

  try {
    const response = await llmProvider.generate([{ role: "user", content: prompt }]);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const graph = createEmptyKnowledgeGraph();
      
      // We will cast to any here to inject the new profile fields we'll add to the graph soon
      graph.role = parsed.role || "Candidate";
      graph.experience = parsed.experience || "Unknown";
      
      graph.skills = parsed.skills || [];
      graph.projects = parsed.projects || [];
      
      // Initial assumptions based on resume
      graph.strongTopics = parsed.strengths || [];
      graph.weakTopics = parsed.weaknesses || [];
      
      return graph;
    }
  } catch (e) {
    console.error("[ResumeEngine] Failed to extract profile JSON:", e);
  }
  
  return createEmptyKnowledgeGraph();
}
