import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://mniuklnrgfcpusuijuyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaXVrbG5yZ2ZjcHVzdWlqdXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg3NDEyMywiZXhwIjoyMDkwNDUwMTIzfQ.y4CGOAp-6cU8Svmn7byYJQ_NTee8AeG9jC4NYhoCnoY');

const companyProfiles = {
  tcs: {
    "Profit & Loss": 0.3,
    "Time & Work": 0.3,
    "Percentage": 0.2,
    "Ratio & Proportion": 0.2
  },
  infosys: {
    "Alphabetical Sequences": 0.4,
    "Alphanumeric Puzzle Sets": 0.4,
    "Average": 0.2
  },
  wipro: {
    "Profit & Loss": 0.3,
    "Time & Work": 0.2,
    "Percentage": 0.3,
    "Ratio & Proportion": 0.2
  },
  cognizant: {
    "Percentage": 0.3,
    "Ratio & Proportion": 0.3,
    "Time & Work": 0.2,
    "Average": 0.2
  },
  accenture: {
    "Alphabetical Sequences": 0.3,
    "Alphanumeric Puzzle Sets": 0.3,
    "Percentage": 0.2,
    "Average": 0.2
  },
  capgemini: {
    "Time & Work": 0.3,
    "Time & Distance": 0.3,
    "Profit & Loss": 0.2,
    "Percentage": 0.2
  },
  ibm: {
    "Simple & Compound Interest": 0.3,
    "Time & Work": 0.3,
    "Time & Distance": 0.2,
    "Average": 0.2
  },
  hcl: {
    "Percentage": 0.3,
    "Profit & Loss": 0.3,
    "Average": 0.2,
    "Ratio & Proportion": 0.2
  },
  "tech-mahindra": {
    "Percentage": 0.4,
    "Profit & Loss": 0.3,
    "Time & Work": 0.2,
    "Average": 0.1
  },
  amazon: {
    "Time & Work": 0.4,
    "Time & Distance": 0.3,
    "Simple & Compound Interest": 0.3
  },
  microsoft: {
    "Time & Work": 0.3,
    "Time & Distance": 0.4,
    "Problems on Ages": 0.3
  },
  google: {
    "Simple & Compound Interest": 0.4,
    "Time & Work": 0.3,
    "Time & Distance": 0.3
  },
  deloitte: {
    "Alphabetical Sequences": 0.3,
    "Average": 0.3,
    "Percentage": 0.2,
    "Ratio & Proportion": 0.2
  },
  pwc: {
    "Alphabetical Sequences": 0.4,
    "Ratio & Proportion": 0.3,
    "Percentage": 0.3
  },
  ey: {
    "Alphanumeric Puzzle Sets": 0.4,
    "Average": 0.3,
    "Ratio & Proportion": 0.3
  },
  kpmg: {
    "Alphanumeric Puzzle Sets": 0.3,
    "Alphabetical Sequences": 0.3,
    "Percentage": 0.2,
    "Ratio & Proportion": 0.2
  },
  cisco: {
    "Time & Work": 0.4,
    "Simple & Compound Interest": 0.3,
    "Average": 0.3
  },
  oracle: {
    "Time & Distance": 0.4,
    "Problems on Ages": 0.3,
    "Ratio & Proportion": 0.3
  },
  "goldman-sachs": {
    "Simple & Compound Interest": 0.5,
    "Ratio & Proportion": 0.3,
    "Average": 0.2
  }
};

async function run() {
  console.log("Fetching all lessons...");
  const { data: lessons, error: lesErr } = await supabase
    .from('apt_lessons')
    .select('id, title');
    
  if (lesErr || !lessons) {
    console.error("Failed to fetch lessons:", lesErr);
    return;
  }
  
  // Map lesson_id to topic name by checking lesson title contents
  const lessonToTopic = {};
  const topicMap = {
    "Time & Work": "Time & Work",
    "Time & Distance": "Time & Distance",
    "Profit & Loss": "Profit & Loss",
    "Percentage": "Percentage",
    "Simple & Compound Interest": "Simple & Compound Interest",
    "Problems on Ages": "Problems on Ages",
    "Average": "Average",
    "Ratio & Proportion": "Ratio & Proportion",
    "Alphabetical Sequences": "Alphabetical Sequences",
    "Alphanumeric Puzzle Sets": "Alphanumeric Puzzle Sets"
  };

  for (const l of lessons) {
    let resolvedTopic = null;
    for (const [key, value] of Object.entries(topicMap)) {
      // Normalize comparison (e.g. "Profit and Loss" vs "Profit & Loss")
      const normTitle = l.title.toLowerCase().replace(/&/g, "and");
      const normKey = key.toLowerCase().replace(/&/g, "and");
      if (normTitle.includes(normKey)) {
        resolvedTopic = value;
        break;
      }
    }
    lessonToTopic[l.id] = resolvedTopic || "Average"; // fallback
  }

  console.log("Fetching all questions (paginated)...");
  const allQuestions = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data: questions, error } = await supabase
      .from('apt_questions')
      .select('id, lesson_id')
      .range(from, from + limit - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    
    if (!questions || questions.length === 0) break;
    allQuestions.push(...questions);
    
    if (questions.length < limit) break;
    from += limit;
  }
  
  console.log(`Fetched ${allQuestions.length} questions.`);
  
  // Group questions by resolved topic
  const topicQuestions = {};
  for (const q of allQuestions) {
    const topic = lessonToTopic[q.lesson_id];
    if (!topicQuestions[topic]) {
      topicQuestions[topic] = [];
    }
    topicQuestions[topic].push(q.id);
  }

  console.log("Deleteting all existing company tags to start fresh...");
  const { error: delErr } = await supabase
    .from('apt_company_tags')
    .delete()
    .neq('company_name', 'DELETE_ALL_SAFEGUARD_DONT_MATCH');
    
  if (delErr) {
    console.error("Failed to delete existing tags:", delErr);
    return;
  }
  
  console.log("Successfully cleared old tags.");

  const tagsToInsert = [];
  const targetQuestionsPerCompany = 300; // robust number of questions per company
  
  const { data: companies } = await supabase.from('apt_companies').select('id, name');
  
  for (const c of (companies || [])) {
    const profile = companyProfiles[c.id];
    if (!profile) {
      console.log(`No profile found for ${c.name} (${c.id}), skipping tag seeding.`);
      continue;
    }
    
    console.log(`Generating tags for ${c.name} based on focus areas...`);
    for (const [topic, pct] of Object.entries(profile)) {
      const qIds = topicQuestions[topic] || [];
      if (qIds.length === 0) continue;
      
      const numToSelect = Math.round(targetQuestionsPerCompany * pct);
      const shuffled = qIds.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numToSelect);
      
      for (const qId of selected) {
        tagsToInsert.push({
          question_id: qId,
          company_name: c.name
        });
      }
    }
  }
  
  console.log(`Total tags prepared: ${tagsToInsert.length}`);
  
  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < tagsToInsert.length; i += batchSize) {
    const batch = tagsToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('apt_company_tags')
      .upsert(batch, { onConflict: 'question_id, company_name' });
      
    if (insertError) {
      console.error(`Failed to insert batch starting at ${i}:`, insertError);
    } else {
      console.log(`Successfully upserted batch starting at ${i}`);
    }
  }
  
  console.log("Finished reseeding real world company tags!");
}

run();
