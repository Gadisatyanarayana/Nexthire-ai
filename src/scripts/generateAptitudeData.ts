import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAptitudeQuestions, APTITUDE_TOPICS } from "../lib/aptitudeGenerator"; // The old generator

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data/aptitude");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateAptitudeData() {
  console.log("Generating Aptitude Phase 1 Data (Drafts)...");

  // Generate modules
  const modules = [
    { id: "mod-0", title: "Basics", level_order: 0 },
    { id: "mod-1", title: "Arithmetic", level_order: 1 },
    { id: "mod-2", title: "Algebra", level_order: 2 },
    { id: "mod-3", title: "Geometry", level_order: 3 },
  ];

  // Map topics to module-1 (Arithmetic) for now since these are arithmetic
  const lessons = APTITUDE_TOPICS.map((topic, i) => ({
    id: `lesson-apt-${i}`,
    module_id: "mod-1",
    title: topic,
    difficulty: "Beginner to Advanced",
    reading_time: "45 mins",
    content: {
      overview: `A complete guide to ${topic} for placement preparation.`,
      theory: "Concept Explanation, Mathematical Theory, Shortcuts, Tricks...",
      mistakes: "Common mistakes and how to avoid them."
    },
    status: "draft"
  }));

  // Map formulas
  const formulas = [];
  const questions = [];

  // Generate 180 questions per topic using the existing generator logic
  let formulaId = 0;
  for (let i = 0; i < APTITUDE_TOPICS.length; i++) {
    const topic = APTITUDE_TOPICS[i];
    const lesson_id = `lesson-apt-${i}`;
    
    // Create a dummy formula for each topic
    formulas.push({
      topic_id: lesson_id,
      formula_text: `Basic formula for ${topic}: X = Y + Z`,
      example_q: "Find X if Y=10 and Z=5.",
      example_a: "X = 15.",
      status: "draft"
    });

    // Grab the existing generated questions
    const generated = getAptitudeQuestions(topic);
    for (const q of generated) {
      questions.push({
        lesson_id,
        question: q.question,
        options: q.options,
        correct_index: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        status: "draft",
        companies: q.companies || []
      });
    }
  }

  // Save JSON
  fs.writeFileSync(path.join(DATA_DIR, "modules.json"), JSON.stringify(modules, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "lessons.json"), JSON.stringify(lessons, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "formulas.json"), JSON.stringify(formulas, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, "questions.json"), JSON.stringify(questions, null, 2));

  console.log(`Generated ${modules.length} modules, ${lessons.length} lessons, ${formulas.length} formulas, and ${questions.length} questions as drafts.`);
}

generateAptitudeData();
