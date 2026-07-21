require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Verifying Database Tables...");
  const tables = [
    'learning_progress',
    'learning_events',
    'daily_activity',
    'user_stats',
    'xp_transactions',
    'user_achievements'
  ];

  let allPassed = true;

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code === '42P01') {
        console.error(`❌ Table '${table}' does NOT exist.`);
        allPassed = false;
      } else if (error) {
        console.error(`❌ Error querying table '${table}': ${error.message}`);
        allPassed = false;
      } else {
        console.log(`✅ Table '${table}' exists.`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error for table '${table}': ${err.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\\n✅ All expected tables are present.");
  } else {
    console.log("\\n❌ Some tables are missing.");
  }
}

main().catch(console.error);
