import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";
import { randomUUID } from "crypto";

config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey);

const sampleQuestions = Array.from({ length: 100 }, (_, i) => {
  const index = i + 1;
  const isHard = index % 10 === 0;
  const isMedium = index % 3 === 0;
  const difficulty = isHard ? "Hard" : isMedium ? "Medium" : "Easy";
  
  return {
    id: randomUUID(),
    title: `Coding Challenge ${index}: Algorithm Optimization`,
    difficulty,
    topic: ['arrays', 'hash-table', isHard ? 'dynamic-programming' : 'strings'],
    description: `This is a premium coding challenge #${index}. You need to optimize the algorithm to run in O(N) time and O(1) space.`,
    acceptance_rate: Math.floor(Math.random() * 60) + 20,
    function_name: `solveProblem${index}`,
    input_type: 'number[]',
    output_type: 'number',
    company_tags: ['google', 'meta', 'amazon'],
    pattern_tags: ['two-pointers', 'sliding-window'],
    examples: [
      { input: "[1, 2, 3]", output: "6", explanation: "1 + 2 + 3 = 6" },
      { input: "[4, 5, 6]", output: "15", explanation: "4 + 5 + 6 = 15" }
    ],
    testcases: [
      { input: "[1, 2, 3]", expectedOutput: "6" },
      { input: "[4, 5, 6]", expectedOutput: "15" },
      { input: "[0, 0, 0]", expectedOutput: "0" }
    ],
    starter_code: {
      javascript: `function solveProblem${index}(nums) {\n  // Write your code here\n  return 0;\n}`,
      python: `def solveProblem${index}(nums):\n    # Write your code here\n    pass`,
      java: `class Solution {\n    public int solveProblem${index}(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}`
    }
  };
});

async function run() {
  console.log("Seeding 100 coding questions...");
  
  const { data: existing, error: fetchErr } = await admin.from("questions").select("id").limit(1);
  if (fetchErr) {
    console.error("Failed to check existing questions:", fetchErr);
    process.exit(1);
  }

  const { error } = await admin.from("questions").insert(sampleQuestions);
  
  if (error) {
    console.error("Failed to seed questions:", error);
    process.exit(1);
  }
  
  console.log("✅ Successfully seeded 100 coding questions into Supabase.");
}

run();
