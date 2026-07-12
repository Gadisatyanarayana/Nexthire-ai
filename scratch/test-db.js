const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mniuklnrgfcpusuijuyz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking modules...");
  const { data: modules } = await supabase.from("apt_modules").select("*").limit(2);
  console.log("Modules:", modules);

  console.log("Checking lessons...");
  const { data: lessons } = await supabase.from("apt_lessons").select("*").limit(2);
  console.log("Lessons:", lessons);

  console.log("Checking questions...");
  const { data: questions } = await supabase.from("apt_questions").select("*").limit(2);
  console.log("Questions:", questions);

  console.log("Checking for question counts per lesson...");
  const { data: counts } = await supabase.rpc('get_question_counts_by_lesson');
  console.log("Counts:", counts ? "RPC exists" : "RPC not found");
  
  const { count: totalQuestions } = await supabase.from("apt_questions").select("*", { count: "exact", head: true });
  console.log("Total questions:", totalQuestions);
}

main().catch(console.error);
