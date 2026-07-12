import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data: companies, error } = await supabase.from('apt_companies').select('*');
  if (error) {
    console.error("Error fetching", error);
    return;
  }
  
  for (const c of (companies || [])) {
    console.log(`Checking ${c.name}, sections:`, c.sections);
    if (!c.sections || (Array.isArray(c.sections) && c.sections.length === 0)) {
      const defaultSections = [
        { name: 'Quantitative Aptitude', num_questions: 20, duration_minutes: 25 },
        { name: 'Logical Reasoning', num_questions: 20, duration_minutes: 25 },
        { name: 'Verbal Ability', num_questions: 20, duration_minutes: 20 }
      ];
      await supabase.from('apt_companies').update({ sections: defaultSections }).eq('id', c.id);
      console.log('Fixed sections for', c.name);
    }
  }
}
run();
