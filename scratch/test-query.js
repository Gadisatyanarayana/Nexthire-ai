const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://mniuklnrgfcpusuijuyz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const lessonId = 'lesson-apt-0';
  let res = await supabase
      .from("apt_questions")
      .select("*, apt_company_tags (company_name)")
      .eq("lesson_id", lessonId);
  console.log("Error:", res.error);
  console.log("Data count:", res.data ? res.data.length : null);
}

main().catch(console.error);
