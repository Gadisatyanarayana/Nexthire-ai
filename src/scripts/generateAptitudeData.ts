import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { getAptitudeQuestions, APTITUDE_TOPICS } from "../lib/aptitudeGenerator"; // The old generator

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data/aptitude");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function generateUUID(seedText: string) {
  const hash = crypto.createHash('md5').update(seedText).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function generateAptitudeData() {
  console.log("Generating Aptitude Phase 1 Data (Drafts)...");

  // 12 Modules
  const modules = Array.from({ length: 12 }).map((_, i) => ({
    id: `mod-${i}`,
    title: `Aptitude Module ${i + 1}`,
    level_order: i
  }));

  const lessons = [];
  const formulas = [];
  const questions = [];

  // We need 500 lessons total. Spread across 12 modules, that's ~42 lessons per module.
  // We have 10 base topics. We can cycle through them.
  let lessonIdCounter = 0;
  let formulaIdCounter = 0;
  
  for (let m = 0; m < modules.length; m++) {
    for (let l = 0; l < 42; l++) {
      const topicIndex = (m * 42 + l) % APTITUDE_TOPICS.length;
      const baseTopic = APTITUDE_TOPICS[topicIndex];
      const lesson_id = `lesson-apt-${lessonIdCounter}`;
      
      lessons.push({
        id: lesson_id,
        module_id: modules[m].id,
        title: `${baseTopic} - Part ${Math.floor((m * 42 + l) / APTITUDE_TOPICS.length) + 1}`,
        difficulty: l % 3 === 0 ? "Hard" : l % 2 === 0 ? "Medium" : "Easy",
        reading_time: "45 mins",
        content: {
          overview: `A complete guide to ${baseTopic} for placement preparation.`,
          theory: "Concept Explanation, Mathematical Theory, Shortcuts, Tricks...",
          mistakes: "Common mistakes and how to avoid them."
        },
        status: "draft"
      });

      // Generate formulas for the first ~260 lessons
      if (formulaIdCounter < 260) {
        const fText = `Advanced formula ${formulaIdCounter} for ${baseTopic}`;
        formulas.push({
          id: generateUUID(`formula-${fText}`),
          topic_id: lesson_id,
          formula_text: fText,
          example_q: "Find X",
          example_a: "X = 15",
          status: "draft"
        });
        formulaIdCounter++;
      }

      // We need 5000+ questions total across 500 lessons (10 per lesson = 5000)
      const generated = getAptitudeQuestions(baseTopic);
      // To ensure diversity without duplication, use a dedicated slice from the generated pool for this topic.
      // We generate 600 questions per topic, and need ~561 (51 lessons * 11).
      const topicLessonsSoFar = Math.floor((m * 42 + l) / APTITUDE_TOPICS.length);
      const offset = topicLessonsSoFar * 11;
      const selectedQuestions = generated.slice(offset, offset + 11); // get 11 per lesson to hit >5000
      
      for (const q of selectedQuestions) {
        questions.push({
          id: generateUUID(`q-${lesson_id}-${q.id}`), // Guaranteed unique ID
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
      
      lessonIdCounter++;
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
