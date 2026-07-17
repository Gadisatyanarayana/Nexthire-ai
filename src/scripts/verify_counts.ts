import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const check = async (table: string) => {
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${count}`);
  };

  await check('apt_modules');
  await check('apt_lessons');
  await check('apt_questions');
  await check('reasoning_modules');
  await check('reasoning_lessons');
  await check('reasoning_questions');
  await check('platform_domains');
  await check('platform_modules');
  await check('platform_lessons');
  await check('platform_questions');
}
run();
