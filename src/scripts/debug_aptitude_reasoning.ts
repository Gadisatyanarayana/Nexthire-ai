import { LearningService } from "../lib/learning/services/LearningService";

async function run() {
  console.log("=== DEBUGGING DOMAINS, MODULES, LESSONS ===");
  try {
    const domains = await LearningService.queries.getDomains();
    console.log("Domains count:", domains.length);
    console.log("Domains:", domains.map(d => ({ id: d.id, title: d.title })));

    for (const d of domains) {
      const modules = await LearningService.queries.getModules(d.id);
      console.log(`\nDomain [${d.id}]: ${modules.length} modules found`);
      if (modules.length > 0) {
        const firstMod = modules[0];
        console.log(`  First Module: [${firstMod.id}] ${firstMod.title}`);
        const lessons = await LearningService.queries.getLessonsByModule(firstMod.id, d.id);
        console.log(`  Lessons in first module (${firstMod.id}): ${lessons.length}`);
        if (lessons.length > 0) {
          const firstLesson = lessons[0];
          console.log(`    First Lesson: [${firstLesson.id}] ${firstLesson.title}`);
          const fetchedLesson = await LearningService.queries.getLesson(firstLesson.id, d.id);
          console.log(`    getLesson("${firstLesson.id}", "${d.id}") result:`, fetchedLesson ? "SUCCESS" : "NULL");
        }
      }
    }

    // Also test what happens if someone passes "aptitude" or "reasoning" as domainId
    console.log("\n--- Testing 'aptitude' and 'reasoning' aliases ---");
    const modApt = await LearningService.queries.getModules("aptitude");
    console.log("getModules('aptitude'):", modApt.length);
    const modReas = await LearningService.queries.getModules("reasoning");
    console.log("getModules('reasoning'):", modReas.length);

  } catch (err) {
    console.error("ERROR:", err);
  }
}
run();
