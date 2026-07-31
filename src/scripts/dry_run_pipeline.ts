import { ContentPipelineOrchestrator } from "../platform/content-pipeline/core/Orchestrator";
import { MockProvider } from "../platform/content-pipeline/llm/MockProvider";
import { VerificationLoop } from "../platform/content-pipeline/core/VerificationLoop";

async function executeDryRun() {
  console.log("==========================================");
  console.log("   CONTENT INTELLIGENCE PIPELINE DRY RUN");
  console.log("==========================================\\n");

  const orchestrator = new ContentPipelineOrchestrator({ batchSize: 10, offset: 0 });
  const mockLlm = new MockProvider({ provider: "mock", model: "mock-v1" });
  const verifier = new VerificationLoop(mockLlm, { maxRetries: 3 });

  // 10 Mock Questions covering diverse topics
  const dryRunQuestions = [
    { id: "q1", title: "Two Sum", category: "Arrays" },
    { id: "q2", title: "Search in Rotated Sorted Array", category: "Binary Search" },
    { id: "q3", title: "Longest Substring Without Repeating Characters", category: "Sliding Window" },
    { id: "q4", title: "Course Schedule", category: "Graphs" },
    { id: "q5", title: "Binary Tree Level Order Traversal", category: "Trees" },
    { id: "q6", title: "Coin Change", category: "Dynamic Programming" },
    { id: "q7", title: "Jump Game", category: "Greedy" },
    { id: "q8", title: "N-Queens", category: "Backtracking" },
    { id: "q9", title: "Single Number", category: "Bit Manipulation" },
    { id: "q10", title: "LRU Cache", category: "Design" }
  ];

  for (const q of dryRunQuestions) {
    console.log(`\\n--- Processing: ${q.title} ---`);
    const result = await orchestrator.processQuestion(q.id, q);
    
    // Simulate Verification Loop
    const verifResult = await verifier.generateAndVerifySolution("Solve this", [], "typescript");
    
    console.log(`Status: ${result.success ? "✅ Passed" : "❌ Failed"}`);
    console.log(`Verification Compile & Run: ${verifResult.success ? "✅ Success" : "❌ Failed"}`);
    console.log(`Quality Score: ${result.confidenceScore}/100`);
  }

  console.log("\\n==========================================");
  console.log("   DRY RUN COMPLETE: 10/10 Processed");
  console.log("==========================================");
}

executeDryRun().catch(console.error);
