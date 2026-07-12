import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function publishAll() {
  console.log("Publishing content...");

  const { error: errL } = await supabase.from('apt_lessons').update({ status: 'published' }).eq('status', 'draft');
  if (errL) console.error("Error publishing lessons:", errL.message);
  else console.log("Lessons published.");

  const { error: errF } = await supabase.from('apt_formulas').update({ status: 'published' }).eq('status', 'draft');
  if (errF) console.error("Error publishing formulas:", errF.message);
  else console.log("Formulas published.");

  const { error: errQ } = await supabase.from('apt_questions').update({ status: 'published' }).eq('status', 'draft');
  if (errQ) console.error("Error publishing questions:", errQ.message);
  else console.log("Questions published.");
  
  console.log("\nVerifying Question Distribution across Modules (Full Fetch)...");
  
  // We need to fetch all questions, overcoming the 1000 limit
  let allQuestions: any[] = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.from('apt_questions').select('id, lesson_id').range(from, from + limit - 1);
    if (error) {
      console.error(error);
      break;
    }
    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    from += limit;
  }
  
  const { data: lessons } = await supabase.from('apt_lessons').select('id, title, module_id');
  const { data: modules } = await supabase.from('apt_modules').select('id, title');
  
  if (lessons && modules) {
    const byLesson: Record<string, number> = {};
    for (const q of allQuestions) {
      byLesson[q.lesson_id] = (byLesson[q.lesson_id] || 0) + 1;
    }
    
    const moduleMap = new Map(modules.map(m => [m.id, m.title]));
    const moduleDist: Record<string, number> = {};
    
    lessons.forEach(l => {
      const count = byLesson[l.id] || 0;
      const modTitle = moduleMap.get(l.module_id) || l.module_id;
      moduleDist[modTitle] = (moduleDist[modTitle] || 0) + count;
    });
    
    for (const [mod, count] of Object.entries(moduleDist)) {
      console.log(` - ${mod}: ${count} questions`);
    }
  }
}

publishAll().catch(console.error);
