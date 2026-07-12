import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const modules = [
  { id: "mod-reas-0", title: "Verbal Reasoning", level_order: 0 },
  { id: "mod-reas-1", title: "Analytical Reasoning", level_order: 1 },
  { id: "mod-reas-2", title: "Non-Verbal Reasoning", level_order: 2 },
  { id: "mod-reas-3", title: "Logical Deduction", level_order: 3 }
];

const lessons = [
  {
    id: "lesson-reas-0",
    module_id: "mod-reas-0",
    title: "Syllogisms - Part 1",
    difficulty: "Medium",
    reading_time: "20 mins",
    content: {
      overview: "Understand the logic of Syllogisms using Venn Diagrams and Rules.",
      theory: "Syllogisms consist of propositions: All A are B, Some A are B, No A is B, Some A are not B. We draw Venn Diagrams to find which conclusions follow logically from the given statements.",
      mistakes: "Assuming 'Some A are B' implies 'Some A are not B' (not logically necessary)."
    },
    status: "published"
  },
  {
    id: "lesson-reas-1",
    module_id: "mod-reas-0",
    title: "Blood Relations - Part 1",
    difficulty: "Easy",
    reading_time: "15 mins",
    content: {
      overview: "Learn how to decipher complex family trees and relations.",
      theory: "Use tree diagrams where circles represent females, squares represent males, horizontal double lines represent couples, and vertical lines represent generations.",
      mistakes: "Confusing gender by name alone. Never assume gender unless explicitly mentioned in the question statement."
    },
    status: "published"
  },
  {
    id: "lesson-reas-2",
    module_id: "mod-reas-0",
    title: "Coding-Decoding - Part 1",
    difficulty: "Easy",
    reading_time: "12 mins",
    content: {
      overview: "Master letter and number pattern rules used for ciphering.",
      theory: "Memorize letter positions (A=1, Z=26) and opposites (A-Z, B-Y, C-X). Use rules like EJOTY (5, 10, 15, 20, 25) to map codes quickly.",
      mistakes: "Applying the correct logic but miscalculating the alphabet shift count."
    },
    status: "published"
  },
  {
    id: "lesson-reas-3",
    module_id: "mod-reas-1",
    title: "Seating Arrangements",
    difficulty: "Hard",
    reading_time: "30 mins",
    content: {
      overview: "Solve linear and circular arrangements of people facing various directions.",
      theory: "Circular facing inside: Right is anti-clockwise, Left is clockwise. Circular facing outside: Right is clockwise, Left is anti-clockwise. Sketch out all cases.",
      mistakes: "Mixing up left/right when the direction (inside/outside) is changed."
    },
    status: "published"
  },
  {
    id: "lesson-reas-4",
    module_id: "mod-reas-1",
    title: "Direction Sense Test",
    difficulty: "Easy",
    reading_time: "10 mins",
    content: {
      overview: "Plot paths and calculate final direction and shortest distance.",
      theory: "Draw the four cardinal directions (N, S, E, W) and ordinal directions (NE, NW, SE, SW). Use Pythagoras theorem for shortest path: a^2 + b^2 = c^2.",
      mistakes: "Taking left/right turns incorrectly when facing South or West."
    },
    status: "published"
  },
  {
    id: "lesson-reas-5",
    module_id: "mod-reas-1",
    title: "Clocks & Calendars",
    difficulty: "Hard",
    reading_time: "25 mins",
    content: {
      overview: "Master hand angles, clock gains/losses, and calendar day calculations.",
      theory: "Clock Angle formula: Theta = |30H - 5.5M|. Calendar leap year rule: Divisible by 4, but not 100 unless divisible by 400. Odd days concept.",
      mistakes: "Using 5.5M calculation error or forgetting central leap century rules (e.g. 1900 is NOT a leap year)."
    },
    status: "published"
  }
];

const formulas = [
  {
    topic_id: "lesson-reas-5",
    formula_text: "Clock Angle formula: Theta = |30H - (11/2)M|",
    example_q: "Find the angle between the hands of a clock at 3:40.",
    example_a: "H=3, M=40. Theta = |30(3) - 5.5(40)| = |90 - 220| = 130 degrees.",
    status: "published"
  },
  {
    topic_id: "lesson-reas-5",
    formula_text: "Reflex Angle: 360 - Theta",
    example_q: "What is the reflex angle at 3:40?",
    example_a: "Angle is 130 degrees. Reflex angle = 360 - 130 = 230 degrees.",
    status: "published"
  },
  {
    topic_id: "lesson-reas-4",
    formula_text: "Pythagorean Theorem: c = sqrt(a^2 + b^2)",
    example_q: "A person travels 3km North, then 4km East. How far is he from the start?",
    example_a: "a=3, b=4. Distance c = sqrt(9 + 16) = sqrt(25) = 5 km.",
    status: "published"
  }
];

const questions = [
  {
    lesson_id: "lesson-reas-0",
    question: "Statements: All bags are purses. No purse is black. All black things are beautiful. Conclusions: I. Some bags are black. II. No bag is black. III. Some beautiful things are black. IV. Some purses are bags.",
    options: ["Only II and III follow", "Only II, III and IV follow", "Only I and IV follow", "All follow"],
    correct_index: 1,
    explanation: "Since all bags are purses and no purse is black, no bag can be black. So II follows. All black things are beautiful implies some beautiful things are black (the ones that are black). So III follows. Since all bags are purses, the intersection of purses and bags is non-empty, so some purses are bags. So IV follows. Hence, II, III and IV follow.",
    difficulty: "Medium",
    status: "published",
    companies: ["TCS", "Infosys"]
  },
  {
    lesson_id: "lesson-reas-1",
    question: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
    options: ["Brother", "Uncle", "Cousin", "Father"],
    correct_index: 3,
    explanation: "The only son of Suresh's mother is Suresh himself. Therefore, the boy is the son of Suresh, making Suresh the father.",
    difficulty: "Easy",
    status: "published",
    companies: ["Wipro", "Cognizant"]
  },
  {
    lesson_id: "lesson-reas-2",
    question: "In a certain code, 'MONKEY' is written as 'XDJMNL'. How is 'TIGER' written in that code?",
    options: ["QDFHS", "SDFHS", "SHFDQ", "UJHFS"],
    correct_index: 0,
    explanation: "The pattern is reverse shift by -1. The last letter Y - 1 = X, E - 1 = D, K - 1 = J, etc. For TIGER: R - 1 = Q, E - 1 = D, G - 1 = F, I - 1 = H, T - 1 = S. Thus: QDFHS.",
    difficulty: "Medium",
    status: "published",
    companies: ["Infosys", "TCS"]
  },
  {
    lesson_id: "lesson-reas-3",
    question: "A, B, C, D, E, F and G are sitting in a circle facing the center. G is second to the left of C, who is to the immediate left of F. A is third to the left of E. B is between D and E. Who is to the immediate left of G?",
    options: ["A", "D", "B", "E"],
    correct_index: 0,
    explanation: "Placing them relative to each other: C is to the left of F. G is second left of C. A is third left of E, and B is between D and E. The circle order clockwise becomes F, C, B, D, G, A, E. The immediate left of G is A.",
    difficulty: "Hard",
    status: "published",
    companies: ["Amazon", "Google"]
  },
  {
    lesson_id: "lesson-reas-4",
    question: "A man walks 5 km toward South and then turns to the right. After walking 3 km he turns to the left and walks 5 km. Now in which direction is he from the starting place?",
    options: ["West", "South", "South-West", "North-East"],
    correct_index: 2,
    explanation: "He starts, goes 5km South. Turns right (facing West) and walks 3km. Turns left (facing South) and walks 5km. He has moved both South and West from the starting point. So he is in the South-West direction.",
    difficulty: "Easy",
    status: "published",
    companies: ["TCS", "Accenture"]
  },
  {
    lesson_id: "lesson-reas-5",
    question: "How many times do the hands of a clock coincide in a day?",
    options: ["20", "21", "22", "24"],
    correct_index: 2,
    explanation: "The hands of a clock coincide 11 times in every 12 hours (between 11 and 1 they coincide only once, at 12:00). In a 24-hour day, they coincide 22 times.",
    difficulty: "Medium",
    status: "published",
    companies: ["Microsoft", "Oracle"]
  }
];

const reasoningCompanies = [
  { id: "tcs", name: "TCS", logo_url: "/logos/tcs.png", tier: "Service-based", description: "Tata Consultancy Services placement track." },
  { id: "infosys", name: "Infosys", logo_url: "/logos/infosys.png", tier: "Service-based", description: "Infosys certification and placement test preparation." },
  { id: "wipro", name: "Wipro", logo_url: "/logos/wipro.png", tier: "Service-based", description: "Wipro Elite National Talent Hunt preparation." },
  { id: "amazon", name: "Amazon", logo_url: "/logos/amazon.png", tier: "Product-based", description: "Amazon online assessment reasoning logic path." },
  { id: "google", name: "Google", logo_url: "/logos/google.png", tier: "Product-based", description: "Google logical reasoning & cognitive analysis puzzles." },
  { id: "microsoft", name: "Microsoft", logo_url: "/logos/microsoft.png", tier: "Product-based", description: "Microsoft systems logical design evaluation track." }
];

async function seed() {
  console.log("Starting Logical Reasoning Subject Plugin Seeding...");

  // 1. Seed Companies
  console.log("Seeding companies...");
  const { error: compErr } = await supabase.from("reasoning_companies").upsert(reasoningCompanies, { onConflict: "id" });
  if (compErr) console.error("Error seeding companies:", compErr);
  else console.log("Companies seeded.");

  // 2. Seed Modules
  console.log("Seeding modules...");
  const { error: modErr } = await supabase.from("reasoning_modules").upsert(modules, { onConflict: "id" });
  if (modErr) console.error("Error seeding modules:", modErr);
  else console.log("Modules seeded.");

  // 3. Seed Lessons
  console.log("Seeding lessons...");
  const { error: lesErr } = await supabase.from("reasoning_lessons").upsert(lessons, { onConflict: "id" });
  if (lesErr) console.error("Error seeding lessons:", lesErr);
  else console.log("Lessons seeded.");

  // 4. Seed Formulas
  console.log("Seeding formulas...");
  const { error: formErr } = await supabase.from("reasoning_formulas").upsert(formulas, { onConflict: "id" });
  if (formErr) console.error("Error seeding formulas:", formErr);
  else console.log("Formulas seeded.");

  // 5. Seed Questions and tags
  console.log("Seeding questions...");
  for (const q of questions) {
    const { data: insertedQ, error: qErr } = await supabase.from("reasoning_questions").upsert({
      lesson_id: q.lesson_id,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      difficulty: q.difficulty,
      status: q.status
    }, { onConflict: "id" }).select("id").single();

    if (qErr) {
      console.error("Error seeding question:", q.question.substring(0, 30), qErr);
      continue;
    }

    if (insertedQ && q.companies.length > 0) {
      const tags = q.companies.map(c => ({
        question_id: insertedQ.id,
        company_name: c,
        frequency: 1
      }));
      const { error: tagErr } = await supabase.from("reasoning_company_tags").insert(tags);
      if (tagErr) console.error("Error seeding tags for question ID:", insertedQ.id, tagErr);
    }
  }

  console.log("Logical Reasoning database tables successfully seeded!");
}

seed().catch(err => {
  console.error("Fatal seeding error:", err);
  process.exit(1);
});
