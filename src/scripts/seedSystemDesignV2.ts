import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Setup env
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
  console.log("Starting Optimized Bulk System Design V2 Database Seed...");

  const dataPath = path.resolve(__dirname, "data/system-design");

  // Read JSON files
  const modules = JSON.parse(fs.readFileSync(path.join(dataPath, "modules.json"), "utf8"));
  const lessons = JSON.parse(fs.readFileSync(path.join(dataPath, "lessons.json"), "utf8"));
  const cases = JSON.parse(fs.readFileSync(path.join(dataPath, "cases.json"), "utf8"));
  const companies = JSON.parse(fs.readFileSync(path.join(dataPath, "companies.json"), "utf8"));

  // 1. Bulk Seeding Modules
  console.log(`Bulk upserting ${modules.length} Modules...`);
  const modRows = modules.map((mod: any) => ({
    id: mod.id,
    title: mod.title,
    level_order: mod.level_order
  }));
  const { error: modErr } = await supabase
    .from("sd_modules")
    .upsert(modRows, { onConflict: "id" });
  
  if (modErr) console.error("Error bulk upserting modules:", modErr.message);
  else console.log("Modules seeded successfully.");

  // 2. Bulk Seeding Lessons
  console.log(`Bulk upserting ${lessons.length} Lessons...`);
  const lessonRows = lessons.map((lesson: any) => ({
    id: lesson.id,
    module_id: lesson.module_id,
    title: lesson.title,
    difficulty: lesson.difficulty,
    reading_time: lesson.reading_time,
    content: lesson.content
  }));

  // Batch insert lessons (50 per batch)
  const lessonBatchSize = 50;
  for (let i = 0; i < lessonRows.length; i += lessonBatchSize) {
    const batch = lessonRows.slice(i, i + lessonBatchSize);
    const { error: lesErr } = await supabase
      .from("sd_lessons")
      .upsert(batch, { onConflict: "id" });
    if (lesErr) {
      console.error(`Error bulk upserting lessons batch starting at index ${i}:`, lesErr.message);
    }
  }
  console.log("Lessons seeded successfully.");

  // 3. Clear and Bulk Seed Quiz Questions
  console.log("Bulk seeding Lesson Quiz Questions...");
  const { error: clearErr } = await supabase
    .from("sd_questions")
    .delete()
    .neq("lesson_id", "---placeholder---");
  if (clearErr) {
    console.error("Error clearing existing quiz questions:", clearErr.message);
  }

  const quizRows = [];
  for (const lesson of lessons as any[]) {
    const questions = lesson.content.practice_questions || [];
    for (const q of questions) {
      quizRows.push({
        lesson_id: lesson.id,
        question: q.q,
        options: q.opts,
        correct_index: q.correct,
        explanation: q.exp,
        difficulty: lesson.difficulty,
        company_tags: ["Google", "Amazon", "Meta"]
      });
    }
  }

  console.log(`Inserting ${quizRows.length} quiz questions in batches...`);
  const qBatchSize = 50;
  for (let i = 0; i < quizRows.length; i += qBatchSize) {
    const batch = quizRows.slice(i, i + qBatchSize);
    const { error: insErr } = await supabase
      .from("sd_questions")
      .insert(batch);
    if (insErr) {
      console.error(`Error inserting quiz batch starting at index ${i}:`, insErr.message);
    }
  }
  console.log("Quiz questions seeded successfully.");

  // 4. Bulk Seeding Case Studies
  console.log(`Bulk upserting ${cases.length} Case Studies...`);
  const caseRows = cases.map((c: any) => ({
    id: c.id,
    title: c.title,
    target_scale: c.target_scale,
    content: c.content
  }));
  const { error: caseErr } = await supabase
    .from("sd_case_studies")
    .upsert(caseRows, { onConflict: "id" });
  if (caseErr) console.error("Error bulk upserting case studies:", caseErr.message);
  else console.log("Case studies seeded successfully.");

  // 5. Bulk Seeding Company Profiles
  console.log(`Bulk upserting ${companies.length} Company Profiles...`);
  const companyRows = companies.map((cmp: any) => ({
    id: cmp.id,
    name: cmp.name,
    difficulty: cmp.difficulty,
    focus: cmp.focus,
    rubric: cmp.rubric
  }));
  const { error: cmpErr } = await supabase
    .from("sd_company_profiles")
    .upsert(companyRows, { onConflict: "id" });
  if (cmpErr) console.error("Error bulk upserting company profiles:", cmpErr.message);
  else console.log("Company profiles seeded successfully.");

  console.log("System Design V2 Database Seed completed successfully!");
}

seed().catch(console.error);
