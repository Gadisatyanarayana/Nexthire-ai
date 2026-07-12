import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'apt_modules',
  'apt_lessons',
  'apt_formulas',
  'apt_questions',
  'apt_company_tags',
  'apt_mock_tests',
  'apt_mock_sessions',
  'apt_topic_mastery',
  'apt_revision_queue',
  'apt_company_readiness',
  'apt_ai_sessions'
];

async function verify() {
  console.log("Starting Phase 0: Database Verification\n");
  
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    
    // Total rows
    const { count: total, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Error fetching total: ${error.message}`);
      continue;
    }
    
    // Published/Draft rows (if status column exists)
    let published = 0;
    let draft = 0;
    
    // Check if status column exists by attempting to query it
    const { data: sample, error: errSample } = await supabase.from(table).select('status').limit(1);
    if (!errSample && sample && sample.length > 0 && sample[0].hasOwnProperty('status')) {
      const { count: cPub } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('status', 'published');
      const { count: cDraft } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq('status', 'draft');
      published = cPub || 0;
      draft = cDraft || 0;
      console.log(`Total: ${total} | Published: ${published} | Draft: ${draft}`);
    } else {
      console.log(`Total: ${total}`);
    }

    // Check broken foreign keys specifically for known tables
    if (table === 'apt_lessons') {
      const { data: nullM } = await supabase.from(table).select('id').is('module_id', null);
      console.log(`Null module_id: ${nullM?.length || 0}`);
    } else if (table === 'apt_questions') {
      const { data: nullL } = await supabase.from(table).select('id').is('lesson_id', null);
      console.log(`Null lesson_id: ${nullL?.length || 0}`);
    } else if (table === 'apt_company_tags') {
      const { data: nullQ } = await supabase.from(table).select('id').is('question_id', null);
      console.log(`Null question_id: ${nullQ?.length || 0}`);
    } else if (table === 'apt_formulas') {
      const { data: nullT } = await supabase.from(table).select('id').is('topic_id', null);
      console.log(`Null topic_id: ${nullT?.length || 0}`);
    }
    console.log("");
  }

  // Duplicate IDs (Basic check for questions)
  console.log("--- Additional Checks ---");
  const { data: questions } = await supabase.from('apt_questions').select('id, lesson_id');
  if (questions) {
    const ids = new Set();
    let dupes = 0;
    const byLesson: Record<string, number> = {};
    for (const q of questions) {
      if (ids.has(q.id)) dupes++;
      ids.add(q.id);
      byLesson[q.lesson_id] = (byLesson[q.lesson_id] || 0) + 1;
    }
    console.log(`Duplicate Question IDs: ${dupes}`);
    
    console.log("\nQuestion Distribution by Lesson:");
    const { data: lessons } = await supabase.from('apt_lessons').select('id, title, module_id');
    const { data: modules } = await supabase.from('apt_modules').select('id, title');
    
    if (lessons && modules) {
      const moduleMap = new Map(modules.map(m => [m.id, m.title]));
      const moduleDist: Record<string, number> = {};
      
      lessons.forEach(l => {
        const count = byLesson[l.id] || 0;
        const modTitle = moduleMap.get(l.module_id) || l.module_id;
        moduleDist[modTitle] = (moduleDist[modTitle] || 0) + count;
      });
      
      console.log("\nQuestion Distribution by Module:");
      for (const [mod, count] of Object.entries(moduleDist)) {
        console.log(` - ${mod}: ${count} questions`);
      }
    }
  }

  const { data: cTags } = await supabase.from('apt_company_tags').select('company_name');
  if (cTags) {
    const byCompany: Record<string, number> = {};
    cTags.forEach(t => {
      byCompany[t.company_name] = (byCompany[t.company_name] || 0) + 1;
    });
    console.log("\nQuestion Distribution by Company:");
    for (const [comp, count] of Object.entries(byCompany)) {
      console.log(` - ${comp}: ${count} questions tagged`);
    }
  }
}

verify().catch(console.error);
