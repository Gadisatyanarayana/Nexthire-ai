const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mniuklnrgfcpusuijuyz.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const APTITUDE_QUESTIONS = [
  {
    id: "apt-prob-coins",
    title: "Probability of Coin Tosses",
    category: "Quantitative",
    difficulty: "Easy",
    questionText: "Three unbiased coins are tossed together. What is the probability of getting at least two heads?",
    options: ["1/8", "3/8", "1/2", "3/4"],
    correctOptionIndex: 2,
    explanation: "When 3 coins are tossed, the sample space S has 2^3 = 8 outcomes:\nS = {HHH, HHT, HTH, HTT, THH, THT, TTH, TTT}.\nGetting 'at least two heads' means getting 2 or 3 heads.\nFavorable outcomes (E) = {HHH, HHT, HTH, THH}.\nNumber of favorable outcomes = 4.\nProbability P(E) = n(E) / n(S) = 4/8 = 1/2.",
    companyTags: ["TCS", "Wipro", "Infosys"],
    year: 2025
  },
  {
    id: "apt-time-work-1",
    title: "Time and Work efficiency",
    category: "Quantitative",
    difficulty: "Medium",
    questionText: "A is twice as efficient as B. If A and B together can complete a piece of work in 18 days, in how many days can A alone finish the work?",
    options: ["27 days", "36 days", "54 days", "45 days"],
    correctOptionIndex: 0,
    explanation: "Let the work efficiency of B be 1 unit/day. Since A is twice as efficient as B, A's efficiency = 2 units/day.\nCombined efficiency of A and B = 1 + 2 = 3 units/day.\nTotal work = Combined efficiency * Number of days = 3 units/day * 18 days = 54 units.\nTime taken by A alone = Total work / A's efficiency = 54 / 2 = 27 days.",
    companyTags: ["Accenture", "Cognizant", "TCS"],
    year: 2026
  },
  {
    id: "apt-profit-loss-1",
    title: "Successive Discounts",
    category: "Quantitative",
    difficulty: "Medium",
    questionText: "An article is sold at a markup of 40% and then two successive discounts of 10% and 20% are given. What is the overall profit or loss percentage?",
    options: ["0.8% Profit", "0.8% Loss", "2% Profit", "2% Loss"],
    correctOptionIndex: 0,
    explanation: "Let Cost Price (CP) = 100.\nMarked Price (MP) = CP * 1.40 = 140.\nFirst discount of 10% is given: price becomes 140 * 0.90 = 126.\nSecond discount of 20% is given: Selling Price (SP) = 126 * 0.80 = 100.8.\nOverall profit/loss percentage = (SP - CP)/CP * 100 = (100.8 - 100)/100 * 100 = 0.8% Profit.",
    companyTags: ["Infosys", "Wipro"],
    year: 2025
  },
  {
    id: "apt-blood-relations-1",
    title: "Blood Relations Connection",
    category: "Logical Reasoning",
    difficulty: "Easy",
    questionText: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?",
    options: ["Brother", "Uncle", "Cousin", "Father"],
    correctOptionIndex: 3,
    explanation: "Suresh's mother's only son is Suresh himself.\nTherefore, the boy in the photograph is Suresh's son.\nThus, Suresh is the father of the boy.",
    companyTags: ["Accenture", "TCS", "Cognizant"],
    year: 2026
  },
  {
    id: "apt-seating-arr-1",
    title: "Circular Seating Arrangement",
    category: "Logical Reasoning",
    difficulty: "Hard",
    questionText: "A, B, C, D, E, and F are sitting around a circular table facing the center. A is between E and F, B is opposite to E, and C is to the immediate right of E. Who is opposite to C?",
    options: ["D", "F", "A", "B"],
    correctOptionIndex: 1,
    explanation: "Let's place the people in circular order. \n1. Place E at position 1. Since C is to the immediate right of E, C is at position 2.\n2. B is opposite to E, so B is at position 4 (assuming 6 positions: 1 to 6).\n3. A is between E (position 1) and F. Since C is at position 2, the other side of E is position 6. So A must be at position 6, and F must be at position 5.\n4. The only remaining position is 3, which must be occupied by D.\nSo the positions are: 1:E, 2:C, 3:D, 4:B, 5:F, 6:A.\nThe opposite of C (position 2) is position 5 (F). Thus, F is opposite to C.",
    companyTags: ["Amazon", "Infosys"],
    year: 2026
  },
  {
    id: "apt-syllogism-1",
    title: "Syllogisms Statement Validity",
    category: "Logical Reasoning",
    difficulty: "Medium",
    questionText: "Statements:\nI. All mangoes are golden.\nII. Some golden objects are heavy.\nConclusions:\n1. All mangoes are heavy.\n2. Some golden objects are mangoes.\nWhich conclusions logically follow?",
    options: ["Only conclusion 1 follows", "Only conclusion 2 follows", "Both 1 and 2 follow", "Neither 1 nor 2 follows"],
    correctOptionIndex: 1,
    explanation: "From Statement I, since all mangoes are golden, it implies that some golden objects must be mangoes. Hence, Conclusion 2 logically follows.\nHowever, there is no direct link connecting mangoes and heavy objects, so Conclusion 1 does not necessarily follow. Therefore, only conclusion 2 follows.",
    companyTags: ["Wipro", "TCS", "Capgemini"],
    year: 2025
  },
  {
    id: "apt-verbal-synonym-1",
    title: "Sentence Correction & Vocabulary",
    category: "Verbal",
    difficulty: "Easy",
    questionText: "Choose the word that is most opposite in meaning to the word 'ABUNDANT'.",
    options: ["Scarce", "Ample", "Plentiful", "Generous"],
    correctOptionIndex: 0,
    explanation: "'Abundant' means existing or available in large quantities; overflowing. The opposite is 'Scarce', which means insufficient for the demand or hard to find.",
    companyTags: ["TCS", "Infosys", "Accenture"],
    year: 2025
  }
];

async function seed() {
  const payload = APTITUDE_QUESTIONS.map((q) => ({
    id: q.id,
    title: q.title,
    difficulty: q.difficulty,
    function_name: "solve",
    input_type: "aptitude",
    output_type: "aptitude",
    topic: ["aptitude", q.category.toLowerCase().replace(" ", "-")],
    company_tags: q.companyTags,
    pattern_tags: [String(q.year)],
    acceptance_rate: 0,
    description: q.questionText,
    examples: q.options.map((opt, idx) => ({ input: `Option ${String.fromCharCode(65 + idx)}`, output: opt })),
    testcases: [{ input: "choice", expectedOutput: String(q.correctOptionIndex) }],
    starter_code: {
      options: q.options,
      explanation: q.explanation,
    },
  }));

  console.log(`Upserting ${payload.length} aptitude questions...`);
  const { error } = await supabase.from("questions").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("Seed failed:", error.message);
  } else {
    console.log("Seed completed successfully!");
  }
}

seed();
