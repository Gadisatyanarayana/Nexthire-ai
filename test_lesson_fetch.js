const fs = require('fs');
const path = require('path');
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

const { LearningQueryService } = require('./src/lib/learning/services/LearningQueryService');

async function testAll() {
  console.log("=== 1. TEST APTITUDE MODULES & LESSONS ===");
  const aptMods = await LearningQueryService.getModules("quantitative-aptitude");
  console.log("Aptitude Modules:", aptMods.length);
  if (aptMods.length > 0) {
    const mod = aptMods[0];
    const modRes = await LearningQueryService.getModule(mod.id, "quantitative-aptitude");
    console.log("getModule apt:", modRes ? modRes.id : "NULL");
    const lessons = await LearningQueryService.getLessonsByModule(mod.id, "quantitative-aptitude");
    console.log("Apt lessons for first module:", lessons.length);
    if (lessons.length > 0) {
      const lRes = await LearningQueryService.getLesson(lessons[0].id, "quantitative-aptitude");
      console.log("getLesson apt:", lRes ? lRes.id : "NULL");
    }
  }

  console.log("=== 2. TEST REASONING MODULES & LESSONS ===");
  const reasMods = await LearningQueryService.getModules("logical-reasoning");
  console.log("Reasoning Modules:", reasMods.length);
  if (reasMods.length > 0) {
    const mod = reasMods[0];
    const modRes = await LearningQueryService.getModule(mod.id, "logical-reasoning");
    console.log("getModule reas:", modRes ? modRes.id : "NULL");
    const lessons = await LearningQueryService.getLessonsByModule(mod.id, "logical-reasoning");
    console.log("Reas lessons for first module:", lessons.length);
    if (lessons.length > 0) {
      const lRes = await LearningQueryService.getLesson(lessons[0].id, "logical-reasoning");
      console.log("getLesson reas:", lRes ? lRes.id : "NULL");
    }
  }

  console.log("=== 3. TEST VERBAL MODULES & LESSONS ===");
  const verbMods = await LearningQueryService.getModules("verbal-ability");
  console.log("Verbal Modules:", verbMods.length);
  if (verbMods.length > 0) {
    const mod = verbMods[0];
    const modRes = await LearningQueryService.getModule(mod.id, "verbal-ability");
    console.log("getModule verbal:", modRes ? modRes.id : "NULL");
    const lessons = await LearningQueryService.getLessonsByModule(mod.id, "verbal-ability");
    console.log("Verbal lessons for first module:", lessons.length);
    if (lessons.length > 0) {
      const lRes = await LearningQueryService.getLesson(lessons[0].id, "verbal-ability");
      console.log("getLesson verbal:", lRes ? lRes.id : "NULL");
    }
  }
}

testAll().catch(console.error);
