import fs from "fs";

const filePath = "scripts/data/enriched-problems.json";

// Read and parse the JSON
const content = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(content);

const questions = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];

if (questions.length === 0) {
  console.log("No questions found");
  process.exit(1);
}

console.log(`Total questions: ${questions.length}\n`);

// Check first 5 questions for their structure
for (let i = 0; i < Math.min(5, questions.length); i++) {
  const q = questions[i]?.question || questions[i];
  console.log(`Q${i + 1}: ${q.title || "No title"}`);
  console.log(`  - output_type: ${q.output_type || "MISSING"}`);
  console.log(`  - starter_code exists: ${q.starter_code ? "YES" : "NO"}`);
  if (q.starter_code) {
    console.log(`    - java: ${q.starter_code.java ? "YES" : "NO"}`);
  }
  console.log(`  - examples: ${q.examples?.length || 0} examples`);
  if (q.examples && q.examples.length > 0) {
    console.log(`    - first example output: ${q.examples[0].output || "N/A"}`);
  }
  console.log("");
}

// Check output_type distribution
const outputTypeDistribution = {};
questions.forEach(item => {
  const q = item?.question || item;
  const type = q.output_type || "MISSING";
  outputTypeDistribution[type] = (outputTypeDistribution[type] || 0) + 1;
});

console.log("output_type distribution:");
Object.entries(outputTypeDistribution).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

// Check if any have starter_code
const withStarterCode = questions.filter(item => {
  const q = item?.question || item;
  return q.starter_code && typeof q.starter_code === "object";
}).length;

console.log(`\nQuestions with starter_code: ${withStarterCode}`);
