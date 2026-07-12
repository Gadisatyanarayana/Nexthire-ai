import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { QuestionEngine } from '../lib/aptitude/QuestionEngine';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function traceBug1() {
  console.log("Tracing Bug 1: No adaptive questions available...");
  
  const { data: allQuestions } = await supabase.from('apt_questions').select('*').limit(50);
  if (!allQuestions || allQuestions.length === 0) {
    console.log("No questions found in DB.");
    return;
  }
  
  console.log(`Fetched ${allQuestions.length} questions from DB.`);
  console.log(`Sample difficulty: ${allQuestions[0].difficulty}`);
  
  const selected = QuestionEngine.selectAdaptiveQuestions(allQuestions, [], 0, 10);
  console.log(`QuestionEngine selected: ${selected.length} questions.`);
  
  if (selected.length === 0) {
    console.log("Empty array returned! Inspecting pool buckets...");
    const easyQ = allQuestions.filter(q => q.difficulty?.toLowerCase() === "easy");
    const medQ = allQuestions.filter(q => q.difficulty?.toLowerCase() === "medium");
    const hardQ = allQuestions.filter(q => q.difficulty?.toLowerCase() === "hard");
    console.log(`Easy: ${easyQ.length}, Medium: ${medQ.length}, Hard: ${hardQ.length}`);
  }
}

traceBug1().catch(console.error);
