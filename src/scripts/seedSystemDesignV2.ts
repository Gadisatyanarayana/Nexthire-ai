import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { MODULES, CASE_STUDIES } from "../lib/systemDesignContent";

// Setup env (assuming run via ts-node from project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting System Design V2 Database Seed...");

  // 1. Seed Modules and Lessons
  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    
    // Insert Module
    const { error: modErr } = await supabase
      .from("sd_modules")
      .upsert({
        id: mod.id,
        title: mod.title,
        level_order: i + 1
      }, { onConflict: "id" });
      
    if (modErr) console.error("Error inserting module:", modErr.message);
    else console.log(`Inserted Module: ${mod.title}`);

    // Insert Lessons
    for (const lesson of mod.lessons) {
      
      // Map legacy data into 23-step JSON structure (partially filled based on available data)
      const contentJson = {
        introduction: lesson.objectives.join(" "),
        problemStatement: "Understanding the limitations of traditional architectures.",
        theory: lesson.theory,
        diagramId: lesson.diagramId,
        advantages: lesson.advantages,
        disadvantages: lesson.disadvantages,
        tradeoffs: lesson.tradeoffs,
        mistakes: lesson.mistakes,
        bestPractices: lesson.bestPractices,
        interviewQuestions: lesson.interviewQuestions,
        summary: lesson.takeaways.join(" ")
      };

      const { error: lesErr } = await supabase
        .from("sd_lessons")
        .upsert({
          id: lesson.id,
          module_id: mod.id,
          title: lesson.title,
          difficulty: lesson.difficulty,
          reading_time: lesson.readingTime,
          content: contentJson
        }, { onConflict: "id" });

      if (lesErr) console.error("Error inserting lesson:", lesErr.message);
      else console.log(`  Inserted Lesson: ${lesson.title}`);

      // Insert Questions
      for (const q of lesson.quiz) {
        const { error: qErr } = await supabase
          .from("sd_questions")
          .insert({
            lesson_id: lesson.id,
            question: q.q,
            options: q.opts,
            correct_index: q.correct,
            explanation: q.exp,
            difficulty: lesson.difficulty,
            company_tags: []
          });
          
        if (qErr) console.error("  Error inserting question:", qErr.message);
      }
      console.log(`    Inserted ${lesson.quiz.length} Questions for lesson`);
    }
  }

  // 2. Seed Case Studies (14-step template mapping)
  for (const caseStudy of CASE_STUDIES) {
    const caseContent = {
      functionalSpecs: caseStudy.functionalSpecs,
      nonFunctionalSpecs: caseStudy.nonFunctionalSpecs,
      capacityEstimation: caseStudy.capacityEstimation,
      diagramId: caseStudy.diagramId,
      highLevelDesign: caseStudy.highLevelDesign,
      lowLevelDesign: caseStudy.lowLevelDesign,
      databaseSchema: caseStudy.databaseSchema,
      apiEndpoints: caseStudy.apiEndpoints,
      tradeoffs: caseStudy.tradeoffs
    };

    const { error: caseErr } = await supabase
      .from("sd_case_studies")
      .upsert({
        id: caseStudy.id,
        title: caseStudy.title,
        target_scale: caseStudy.targetScale,
        content: caseContent
      }, { onConflict: "id" });

    if (caseErr) console.error("Error inserting case study:", caseErr.message);
    else console.log(`Inserted Case Study: ${caseStudy.title}`);
  }

  console.log("Seed complete!");
}

seed().catch(console.error);
