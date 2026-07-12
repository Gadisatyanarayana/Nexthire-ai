import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data: lessons } = await supabase.from('apt_lessons').select('id, title, module_id');
  if (!lessons || lessons.length === 0) return;
  
  // Pick some valid lessons
  const topics = [
    { name: "Profit and Loss", match: "Profit" },
    { name: "Time and Work", match: "Time" },
    { name: "Data Interpretation", match: "Data" },
    { name: "Logical Reasoning", match: "Logical" },
    { name: "Probability", match: "Probability" },
    { name: "Ratios", match: "Ratio" }
  ];
  
  const validWeightage: any = {};
  let weightCounter = 20;
  
  for (const t of topics) {
    const lesson = lessons.find(l => l.title.includes(t.match)) || lessons[Math.floor(Math.random() * lessons.length)];
    validWeightage[lesson.title] = {
      weight: weightCounter,
      lessonId: lesson.id,
      moduleId: lesson.module_id
    };
    weightCounter = Math.max(5, weightCounter - 3);
    if (Object.keys(validWeightage).length >= 4) break; // keep top 4
  }

  const { data: companies } = await supabase.from('apt_companies').select('*');
  for (const c of (companies || [])) {
      await supabase.from('apt_companies').update({ topic_weightage: validWeightage }).eq('id', c.id);
      console.log('Fixed topic weightage with real lessons for', c.name);
  }
}
run();
