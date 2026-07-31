const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

async function main() {
  // Let's test the queries used in /aptitude/learn/[moduleId]/[lessonId]/page.tsx
  const { LearningService } = require('./src/lib/learning/services/LearningService');

  console.log("Testing getLesson('percentages', 'aptitude')...");
  const lesson = await LearningService.queries.getLesson('percentages', 'aptitude');
  console.log("lesson:", lesson ? lesson.id : "NULL");

  console.log("Testing getModule('quant-arithmetic', 'aptitude')...");
  const moduleData = await LearningService.queries.getModule('quant-arithmetic', 'aptitude');
  console.log("moduleData:", moduleData ? moduleData.id : "NULL");

  console.log("Testing getFormulasByLesson('percentages', 'aptitude')...");
  const formulas = await LearningService.queries.getFormulasByLesson('percentages', 'aptitude');
  console.log("formulas count:", formulas ? formulas.length : "NULL");

  console.log("Testing getQuestionPreview('percentages', 4, 'aptitude')...");
  const questions = await LearningService.queries.getQuestionPreview('percentages', 4, 'aptitude');
  console.log("questions count:", questions ? questions.length : "NULL");

  // Also test a reasoning lesson: seating-arrangements
  console.log("\nTesting getLesson('seating-arrangements', 'reasoning')...");
  const rLesson = await LearningService.queries.getLesson('seating-arrangements', 'reasoning');
  console.log("rLesson:", rLesson ? rLesson.id : "NULL");

  console.log("Testing getModule('lr-analytical', 'reasoning')...");
  const rModule = await LearningService.queries.getModule('lr-analytical', 'reasoning');
  console.log("rModule:", rModule ? rModule.id : "NULL");

  // What about when the user clicks on a REASONING module from /reasoning?
  // Let's check what lesson IDs are in lr-analytical
  const rLessons = await LearningService.queries.getLessonsByModule('lr-analytical', 'reasoning');
  console.log("rLessons for lr-analytical:", rLessons.map(l => l.id));
}

main().catch(console.error);
