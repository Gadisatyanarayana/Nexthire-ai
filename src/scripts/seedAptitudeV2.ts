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
  console.log("Starting Aptitude Phase 1 Database Seed...");

  const dataPath = path.resolve(__dirname, "data/aptitude");

  // Read JSON files
  const modules = JSON.parse(fs.readFileSync(path.join(dataPath, "modules.json"), "utf8"));
  const lessons = JSON.parse(fs.readFileSync(path.join(dataPath, "lessons.json"), "utf8"));
  const formulas = JSON.parse(fs.readFileSync(path.join(dataPath, "formulas.json"), "utf8"));
  const questions = JSON.parse(fs.readFileSync(path.join(dataPath, "questions.json"), "utf8"));

  // 1. Bulk Seeding Modules
  console.log(`Bulk upserting ${modules.length} Modules...`);
  const { error: modErr } = await supabase
    .from("apt_modules")
    .upsert(modules, { onConflict: "id" });
  if (modErr) console.error("Error bulk upserting modules:", modErr.message);
  else console.log("Modules seeded successfully.");

  // 2. Bulk Seeding Lessons
  console.log(`Bulk upserting ${lessons.length} Lessons...`);
  const { error: lesErr } = await supabase
    .from("apt_lessons")
    .upsert(lessons, { onConflict: "id" });
  if (lesErr) console.error("Error bulk upserting lessons:", lesErr.message);
  else console.log("Lessons seeded successfully.");

  // 3. Bulk Seeding Formulas
  console.log(`Inserting ${formulas.length} Formulas...`);
  const { error: formErr } = await supabase
    .from("apt_formulas")
    .insert(formulas);
  if (formErr) console.error("Error inserting formulas:", formErr.message);
  else console.log("Formulas seeded successfully.");

  // 4. Bulk Seeding Questions and Company Tags
  console.log("Bulk seeding Questions...");
  const qBatchSize = 50;
  let successCount = 0;

  for (let i = 0; i < questions.length; i += qBatchSize) {
    const batch = questions.slice(i, i + qBatchSize);
    
    // Insert questions and return IDs
    const { data: insertedQuestions, error: insErr } = await supabase
      .from("apt_questions")
      .insert(batch.map((q: any) => ({
        lesson_id: q.lesson_id,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
        difficulty: q.difficulty,
        status: q.status
      })))
      .select("id, question");

    if (insErr) {
      console.error(`Error inserting quiz batch starting at index ${i}:`, insErr.message);
      continue;
    }

    if (insertedQuestions && insertedQuestions.length > 0) {
      successCount += insertedQuestions.length;

      // Match inserted questions back to their company tags (using question text as key for matching)
      const tagsToInsert: any[] = [];
      for (const iq of insertedQuestions) {
        const origQ = batch.find((b: any) => b.question === iq.question);
        if (origQ && origQ.companies && origQ.companies.length > 0) {
          for (const company of origQ.companies) {
            tagsToInsert.push({
              question_id: iq.id,
              company_name: company
            });
          }
        }
      }

      if (tagsToInsert.length > 0) {
        const { error: tagErr } = await supabase
          .from("apt_company_tags")
          .insert(tagsToInsert);
        if (tagErr) console.error(`Error inserting company tags batch:`, tagErr.message);
      }
    }
  }
  console.log(`Questions seeded successfully. Inserted ${successCount} questions.`);

  console.log("Aptitude Database Seed completed successfully!");
}

seed().catch(console.error);
