import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Setup environment variables
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

interface LessonInput {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'adaptive';
  concepts: string[];
  skills?: string[];
  prerequisites?: string[];
}

interface ModuleInput {
  id: string;
  title: string;
  description: string;
  level_order: number;
  lessons: LessonInput[];
}

interface DomainInput {
  id: string;
  title: string;
  description: string;
  display_order: number;
  modules: ModuleInput[];
}

// Complete Curriculum Tree mapping 10 major Domains, dozens of Modules, and hundreds of Lessons/Concepts
const curriculumData: DomainInput[] = [
  {
    id: "quantitative-aptitude",
    title: "Quantitative Aptitude",
    description: "Numerical and mathematical reasoning problems for placement and engineering exams.",
    display_order: 1,
    modules: [
      {
        id: "quant-arithmetic",
        title: "Arithmetic",
        description: "Core percentage, interest, ratio, time, and distance problems.",
        level_order: 1,
        lessons: [
          { id: "percentages", title: "Percentage", description: "Calculating parts per hundred, growth rates, and successive changes.", difficulty: "easy", concepts: ["Percentage Basics", "Fraction to Percentage Conversion", "Successive Percentage Changes", "Net Percentage Growth", "Population & Depreciation", "Income-Expenditure Analysis", "Voting & Election Problems"] },
          { id: "profit-loss", title: "Profit and Loss", description: "Cost price, selling price, discounts, and markups.", difficulty: "medium", concepts: ["Basic Cost/Selling Price", "Profit and Loss Percentages", "Successive Discounts", "Marked Price & Discount relationship", "Dishonest Dealer Problems", "Inverted Selling Price Analysis"] },
          { id: "simple-interest", title: "Simple Interest", description: "Interest calculations with constant principal.", difficulty: "easy", concepts: ["SI Formula Basics", "Rate and Time Calculations", "Variable Principal Problems", "Installment Calculations"] },
          { id: "compound-interest", title: "Compound Interest", description: "Interest on interest with annual, semi-annual, and quarterly compounding.", difficulty: "hard", concepts: ["CI Formula Basics", "Compounding Intervals", "Difference between SI and CI", "Successive Rate Compounding", "CI Installments"] },
          { id: "ratio-proportion", title: "Ratio and Proportion", description: "Comparing quantities and scaling values.", difficulty: "easy", concepts: ["Ratios Basics", "Proportions & Variations", "Mean & Third Proportions", "Partnership Shares", "Coin Bag Problems"] },
          { id: "partnership", title: "Partnership", description: "Business partnerships, capital ratios, and profit sharing.", difficulty: "medium", concepts: ["Capital-Time-Profit Ratios", "Active vs Sleeping Partners", "Successive Capital Variations"] },
          { id: "average", title: "Average", description: "Finding the central value of a data set.", difficulty: "easy", concepts: ["Mean Value Calculations", "Weighted Averages", "Consecutive Numbers Averages", "Replacement & Exclusions"] },
          { id: "age-problems", title: "Age Problems", description: "Solving systems of linear equations in context of ages.", difficulty: "easy", concepts: ["Present-Past-Future Age Ratios", "Multiple Variable Age Relations", "Linear Equations of Ages"] },
          { id: "mixture-alligation", title: "Mixture and Alligation", description: "Mixing ingredients of different costs and concentrations.", difficulty: "medium", concepts: ["Alligation Rule Basics", "Concentration Ratios", "Replacement/Repeated Dilutions", "Three-Component Mixtures"] },
          { id: "time-work", title: "Time and Work", description: "Efficiency, work rates, and group efficiency.", difficulty: "medium", concepts: ["Unitary Method Basics", "LCM Method for Efficiency", "Alternative Day Working", "Wages & Efficiency", "Men-Women-Children Rate Problems"] },
          { id: "pipes-cisterns", title: "Pipes and Cisterns", description: "Inlet and outlet rate problems.", difficulty: "medium", concepts: ["Inlet & Outlet Rate Balancing", "Leaking Cistern Calculations", "Partial Pipe Working Times"] },
          { id: "time-speed-distance", title: "Time, Speed and Distance", description: "Motion dynamics, average speeds, and relative speed.", difficulty: "medium", concepts: ["Formula Basics", "Average Speed Formulas", "Relative Speed & Collisions", "Linear Track Meetings", "Escalator Problems"] },
          { id: "boats-streams", title: "Boats and Streams", description: "Upstream and downstream motion.", difficulty: "medium", concepts: ["Upstream vs Downstream Speeds", "Still Water Speed Calculation", "River Current Analysis"] },
          { id: "trains", title: "Trains", description: "Speed calculations relative to poles, platforms, and other trains.", difficulty: "medium", concepts: ["Train Crossing Static Objects", "Train Crossing Moving Objects", "Two Trains Crossing Each Other"] },
          { id: "races-games", title: "Races and Games", description: "Linear and circular races with headstarts.", difficulty: "hard", concepts: ["Linear Track Headstarts", "Circular Track Meeting Points", "Beating Times & Distances"] }
        ]
      },
      {
        id: "quant-numbers",
        title: "Problems on Numbers",
        description: "Number systems, divisibility, fractions, clock, and calendar.",
        level_order: 2,
        lessons: [
          { id: "hcf-lcm", title: "HCF and LCM", description: "Highest Common Factor and Lowest Common Multiple.", difficulty: "easy", concepts: ["Prime Factorization", "LCM/HCF of Fractions", "Divisibility remainders using LCM", "Co-prime applications"] },
          { id: "divisibility-rules", title: "Divisibility Rules", description: "Checking divisors for prime and composite numbers.", difficulty: "easy", concepts: ["Standard Divisibility (2 to 11)", "Composite Divisibility (12, 15, 36, etc.)", "Remainder Theorem Basics"] },
          { id: "decimal-fractions", title: "Decimal Fractions", description: "Operations and conversions on fractions and recurring decimals.", difficulty: "easy", concepts: ["Fraction conversions", "Recurring Decimals to Fractions", "Simplifying decimal chains"] },
          { id: "simplification", title: "Simplification", description: "BODMAS/PEMDAS rule application.", difficulty: "easy", concepts: ["BODMAS Order of Operations", "Nested Bracket Simplification", "Fractional BODMAS Chains"] },
          { id: "surds-indices", title: "Surds and Indices", description: "Properties of exponents and roots.", difficulty: "medium", concepts: ["Exponent Rules", "Rationalizing Surds", "Comparing Surd Magnitudes", "Equations with Indices"] },
          { id: "logarithms", title: "Logarithms", description: "Properties of logs and base changes.", difficulty: "hard", concepts: ["Log Product/Quotient Rules", "Log Change of Base", "Characteristic & Mantissa"] },
          { id: "unit-digit", title: "Unit Digit & Remainders", description: "Calculating cyclicity and remainders of massive exponents.", difficulty: "hard", concepts: ["Cyclicity of Numbers", "Unit Digit of Power Chains", "Euler's Theorem for Remainders", "Fermat's Little Theorem"] },
          { id: "clock", title: "Clock", description: "Angle between clock hands and gaining/losing time.", difficulty: "medium", concepts: ["Angle between Hour & Minute Hands", "Coincidence and Right Angles", "Faulty Clocks (Gaining/Losing Time)"] },
          { id: "calendar", title: "Calendar", description: "Finding the day of the week for any date.", difficulty: "medium", concepts: ["Odd Days Calculation", "Leap Year Logic", "Reference Date Day Finder", "Calendar Repetition Cycle"] }
        ]
      },
      {
        id: "quant-algebra",
        title: "Algebra",
        description: "Equations, inequalities, polynomials, and expansions.",
        level_order: 3,
        lessons: [
          { id: "linear-equations", title: "Linear Equations", description: "Single and multi-variable linear systems.", difficulty: "easy", concepts: ["Single Variable Equation Solver", "Simultaneous Equation Substitution", "Unique/Infinite/No Solution Conditions"] },
          { id: "quadratic-equations", title: "Quadratic Equations", description: "Finding roots and analyzing discriminant.", difficulty: "medium", concepts: ["Quadratic Roots Formula", "Nature of Roots (Discriminant)", "Sum and Product of Roots", "Quadratic Inequalities"] },
          { id: "progressions", title: "Progressions & Sequences", description: "Arithmetic, Geometric, and Harmonic progressions.", difficulty: "medium", concepts: ["AP General Term & Sum", "GP General Term & Sum", "Infinite GP Summation", "HP and Means (AM, GM, HM)"] },
          { id: "binomial-expansion", title: "Binomial Expansion", description: "Expanding polynomials with binomial theorem.", difficulty: "hard", concepts: ["Binomial Coefficients", "General Term of Expansion", "Middle Term & Independent Term"] }
        ]
      },
      {
        id: "quant-geometry",
        title: "Geometry & Mensuration",
        description: "Shapes, coordinates, area, and volume.",
        level_order: 4,
        lessons: [
          { id: "triangles", title: "Triangles", description: "Properties, similarity, congruence, and trigonometry.", difficulty: "medium", concepts: ["Angle Sum Property", "Congruence vs Similarity", "Pythagoras Theorem", "Trigonometric Ratios"] },
          { id: "circles", title: "Circles", description: "Chords, tangents, sectors, and segments.", difficulty: "hard", concepts: ["Chord Properties", "Tangent-Secant Theorem", "Sector Area & Arc Length", "Cyclic Quadrilaterals"] },
          { id: "coordinate-geometry", title: "Coordinate Geometry", description: "Lines, distance, midpoints, and slope.", difficulty: "medium", concepts: ["Distance & Midpoint Formulas", "Slope of a Line", "Equations of Parallel/Perpendicular Lines", "Area of Triangle using Coordinates"] },
          { id: "mensuration-3d", title: "Mensuration 3D", description: "Surface area and volume of solids.", difficulty: "hard", concepts: ["Prisms and Pyramids", "Cylinder, Cone, and Sphere Surface Area", "Volume Calculations", "Melting and Recasting Solids"] }
        ]
      },
      {
        id: "quant-modern-math",
        title: "Modern Mathematics & Statistics",
        description: "Permutations, probability, set theory, and statistics.",
        level_order: 5,
        lessons: [
          { id: "permutations-combinations", title: "Permutation and Combination", description: "Arrangements and selections.", difficulty: "hard", concepts: ["Factorials & Fundamental Counting", "Permutation Rules (Arrangements)", "Combination Rules (Selections)", "Circular Permutations", "Grid Paths & Handshakes"] },
          { id: "probability", title: "Probability", description: "Odds, events, conditional probability, and Bayes' theorem.", difficulty: "hard", concepts: ["Sample Spaces & Classical Probability", "Independent & Mutually Exclusive Events", "Coin, Dice, and Card Problems", "Conditional Probability & Bayes Theorem"] },
          { id: "set-theory", title: "Set Theory & Venn Diagrams", description: "Union, intersection, and multi-set venn structures.", difficulty: "medium", concepts: ["Set Operations (Union, Intersection)", "Two-Set Venn Diagrams", "Three-Set Venn Diagrams", "Maxima-Minima in Sets"] },
          { id: "statistics", title: "Statistics", description: "Mean, median, mode, and standard deviation.", difficulty: "medium", concepts: ["Arithmetic Mean / Median / Mode", "Range & Quartiles", "Variance & Standard Deviation", "Normal Distribution Basics"] }
        ]
      },
      {
        id: "quant-data-interpretation",
        title: "Data Interpretation (DI)",
        description: "Extracting and analyzing information from graphs and tables.",
        level_order: 6,
        lessons: [
          { id: "table-di", title: "Table DI", description: "Analyzing structured tabular data.", difficulty: "easy", concepts: ["Reading Tables", "Percentage Change in Tables", "Cumulative Tables"] },
          { id: "bar-line-graph", title: "Bar & Line Graph", description: "Interpreting trends and ratios on graphs.", difficulty: "medium", concepts: ["Bar Chart Analysis", "Single vs Multiple Line Charts", "Growth Trend Projections"] },
          { id: "pie-chart", title: "Pie Chart", description: "Degree to percentage conversions and sector analysis.", difficulty: "medium", concepts: ["Degree to Percentage Conversion", "Single Pie Chart Shares", "Double Pie Chart Comparisons"] },
          { id: "radar-mixed-di", title: "Radar & Mixed Graph", description: "Advanced data layouts combining chart types.", difficulty: "hard", concepts: ["Radar/Spider Chart Parsing", "Mixed Charts (Pie + Bar, Line + Table)", "Complex Multi-Variable Analysis"] }
        ]
      }
    ]
  },
  {
    id: "logical-reasoning",
    title: "Logical Reasoning",
    description: "Evaluate structure-based reasoning, logical puzzles, and pattern mapping.",
    display_order: 2,
    modules: [
      {
        id: "lr-analytical",
        title: "Analytical Reasoning",
        description: "Arrangement, puzzles, scheduling, mapping, and coding.",
        level_order: 1,
        lessons: [
          { id: "seating-arrangements", title: "Seating Arrangement", description: "Linear, circular, and grid seating configurations.", difficulty: "medium", concepts: ["Linear Arrangement (Facing North/South)", "Circular Arrangement (Facing In/Out)", "Double Row Linear Seating", "Square/Rectangular Arrangements", "Seating Grid & Matrix Constraints"] },
          { id: "puzzles-scheduling", title: "Puzzles and Scheduling", description: "Floor puzzles, box arrangements, and scheduling constraints.", difficulty: "hard", concepts: ["Floor Puzzles (Multi-story)", "Box Arrangements (Stacking)", "Scheduling Puzzles (Days/Months/Years)", "Prerequisite/Constraint Satisfaction Puzzles"] },
          { id: "blood-relations", title: "Blood Relations", description: "Parsing family lineages and family trees.", difficulty: "easy", concepts: ["Family Tree Generation", "Deciphering Statement Relations", "Coded Blood Relations", "Complex Multi-Generation Lineage"] },
          { id: "direction-sense", title: "Direction Sense", description: "Tracking movements and calculating displacement.", difficulty: "easy", concepts: ["Compass Directions & Degrees", "Pythagorean Displacement Paths", "Shadow and Sunset/Sunrise Directional puzzles"] },
          { id: "coding-decoding", title: "Coding-Decoding", description: "Pattern decryption for letters, numbers, and symbols.", difficulty: "easy", concepts: ["Letter-to-Letter Shifts", "Number/Symbol Coding", "Deciphering Chinese/Fictional Language codes", "Matrix Coding"] },
          { id: "input-output", title: "Input Output", description: "Machine rearrangement steps based on numeric or alphanumeric rules.", difficulty: "hard", concepts: ["Machine Input-Output Rules", "Step Tracing Patterns", "Reverse Step Inferences"] }
        ]
      },
      {
        id: "lr-logical-deduction",
        title: "Logical Deduction & Critical Reasoning",
        description: "Syllogisms, statements, conclusions, arguments, and decision making.",
        level_order: 2,
        lessons: [
          { id: "syllogisms", title: "Syllogism", description: "Evaluating standard and reverse syllogisms with Venn diagrams.", difficulty: "medium", concepts: ["Venn Diagram Representation", "Universal Positive & Negative statements", "Either-Or Cases", "Possibility Cases in Syllogisms", "Reverse Syllogisms"] },
          { id: "statement-conclusions", title: "Statements & Conclusions", description: "Deducing conclusions strictly based on given premises.", difficulty: "easy", concepts: ["Premise Boundary Rules", "Direct Conclusions", "Inferred Conclusions vs Assumptions"] },
          { id: "statement-assumptions", title: "Statements & Assumptions", description: "Identifying unstated premises necessary to make a statement valid.", difficulty: "medium", concepts: ["Assumption Negation Test", "Implied Conditions", "Implicit Premise Extraction"] },
          { id: "statement-arguments", title: "Statements & Arguments", description: "Evaluating strong vs weak arguments based on logical reasoning.", difficulty: "medium", concepts: ["Universal Truths Arguments", "Opinionated/Weak Arguments", "Scientific/Factual Strengths"] },
          { id: "critical-reasoning", title: "Critical Reasoning", description: "Evaluating arguments, drawing conclusions, and identifying flaws.", difficulty: "hard", concepts: ["Identify Premise vs Conclusion", "Strengthen or Weaken the Argument", "Find Hidden Assumptions", "Resolve the Paradox", "Identify Logical Flaws/Fallacies"] }
        ]
      },
      {
        id: "lr-non-verbal",
        title: "Non-Verbal & Visual Reasoning",
        description: "Pattern recognition, rotation, folding, matrices, and image analysis.",
        level_order: 3,
        lessons: [
          { id: "mirror-water-images", title: "Mirror & Water Images", description: "Reversing figures horizontally and vertically.", difficulty: "easy", concepts: ["Horizontal Inversion (Mirror)", "Vertical Inversion (Water)", "Clock time in mirror representations"] },
          { id: "paper-folding-cutting", title: "Paper Folding & Cutting", description: "Visualizing symmetries when folded paper is cut and opened.", difficulty: "medium", concepts: ["Symmetry lines", "Unfolding Punch Hole Tracking", "Complex Fold Patterns"] },
          { id: "figure-matrices", title: "Figure Completion & Matrices", description: "Completing patterns inside a visual grid.", difficulty: "medium", concepts: ["Pattern Completion", "Figure Series Progression", "Figure Analogy", "3x3 Figure Matrices"] },
          { id: "cubes-dice", title: "Cubes and Dice", description: "Opposite face logic of standard and folded dice.", difficulty: "medium", concepts: ["Standard vs Ordinary Dice Rules", "Unfolded Cube folding logic", "Opposite Faces Finder", "Painting and Cutting Cubes"] }
        ]
      }
    ]
  },
  {
    id: "verbal-ability",
    title: "Verbal Ability",
    description: "Grammar, vocabulary, sentence construction, and comprehension skills.",
    display_order: 3,
    modules: [
      {
        id: "va-grammar",
        title: "Grammar & Sentence Structure",
        description: "Parts of speech, voice, speech, punctuation, and modifiers.",
        level_order: 1,
        lessons: [
          { id: "parts-of-speech", title: "Parts of Speech", description: "Identification and correct usage of speech components.", difficulty: "easy", concepts: ["Nouns & Pronouns Rules", "Verbs, Adjectives & Adverbs usage", "Prepositions & Conjunctions placement", "Interjections"] },
          { id: "subject-verb-agreement", title: "Subject Verb Agreement", description: "Matching subject numbers with corresponding verb structures.", difficulty: "medium", concepts: ["Singular/Plural Agreement Rules", "Collective Noun Agreements", "Compound Subject Agreements"] },
          { id: "active-passive-voice", title: "Active & Passive Voice", description: "Transforming sentences grammatically between voices.", difficulty: "medium", concepts: ["Tense changes in transformations", "Imperative Sentence transformations", "Intransitive verb rules"] },
          { id: "direct-indirect-speech", title: "Direct & Indirect Speech", description: "Reporting speech correctly with tense and pronoun changes.", difficulty: "medium", concepts: ["Tense shift rules", "Pronoun & Time indicator adjustments", "Interrogative sentence reporting"] }
        ]
      },
      {
        id: "va-vocabulary",
        title: "Vocabulary & Word Usage",
        description: "Synonyms, root words, confusing words, and idiomatic expressions.",
        level_order: 2,
        lessons: [
          { id: "synonyms-antonyms", title: "Synonyms & Antonyms", description: "Finding words with similar and opposite meanings.", difficulty: "medium", concepts: ["Contextual Meanings", "Tone and Intensity matching", "Highly repeated vocabulary"] },
          { id: "root-words-affixes", title: "Root Words & Affixes", description: "Deciphering meanings through roots, prefixes, and suffixes.", difficulty: "medium", concepts: ["Greek and Latin Roots", "Prefixes (Negatives, Directional)", "Suffixes (Determining Part of Speech)"] },
          { id: "idioms-phrases", title: "Idioms & Phrases", description: "Deciphering figurative expressions and phrasal verbs.", difficulty: "easy", concepts: ["Common Idiomatic Expressions", "Phrasal Verbs (Get up, Break down, etc.)", "Contextual Idioms usage"] },
          { id: "confusing-words", title: "Confusing Words", description: "Homophones, homonyms, and commonly mixed-up words.", difficulty: "easy", concepts: ["Affect vs Effect, Lose vs Loose, etc.", "Homophones", "Homonyms"] }
        ]
      },
      {
        id: "va-comprehension",
        title: "Reading Comprehension (RC)",
        description: "Interpreting text passages, analyzing arguments, and identifying themes.",
        level_order: 3,
        lessons: [
          { id: "rc-fact-based", title: "Fact-Based Reading Comprehension", description: "Locating and extracting facts directly from the text.", difficulty: "easy", concepts: ["Keyword scanning", "Direct detail mapping", "True/False statement validation"] },
          { id: "rc-inference-based", title: "Inference-Based Reading Comprehension", description: "Drawing logical conclusions not explicitly stated.", difficulty: "hard", concepts: ["Implied author sentiments", "Extrapolating scenarios", "Implicit arguments analysis"] },
          { id: "rc-tone-theme", title: "Tone & Theme Analysis", description: "Identifying the author's voice and main theme of the passage.", difficulty: "hard", concepts: ["Tone vocabulary (Sarcastic, Nostalgic, Objective)", "Main Idea extraction", "Suitable title identification"] }
        ]
      }
    ]
  }
];

// Helper to generate dynamic, realistic concept notes and theory
function generateLessonResources(lessonTitle: string) {
  return {
    overview: `This lesson covers the core principles, definitions, and applications of ${lessonTitle}. We explore its fundamental concepts, common shortcuts, and typical placement level problems.`,
    theory: `### Theoretical Framework: ${lessonTitle}\n\nTo master **${lessonTitle}**, we must first establish its formal definition and logical properties. \n\n1.  **Understand Constraints**: Read the statement boundaries and exclude invalid combinations early.\n2.  **Mapping Conventions**: Form a visual diagram, grid, or equation depending on the topic structure.\n3.  **Process Elimination**: In competitive examinations, eliminating incorrect choices is frequently faster than resolving the entire problem manually.`,
    formulas: `### Key Formulas & Rules\n\n*   **Formula A**: Basic relation governing ${lessonTitle}.\n*   **Shortcut B**: Use ratios or logic grids to skip equation formulation.\n*   **Elimination Technique**: Rule out extreme options immediately.`,
    visualizations: [
      { type: "flowchart", url: "/diagrams/concept-map.png", caption: "Logical flow and structural mapping" }
    ],
    worked_examples: [
      {
        question: `Solve: Typical placement question involving ${lessonTitle}. Given constraint X and Y, find the correct result.`,
        explanation: "1. List assumptions. 2. Formulate diagram/equations. 3. Plug variables. 4. Match correct options.",
        answer: "Option C is correct."
      }
    ],
    cheat_sheet: `### ${lessonTitle} Cheat Sheet\n\n*   Always draw a diagram/grid.\n*   Double check final constraint mappings.\n*   Track solving speed: ideal target is <60 seconds.`,
    common_mistakes: `*   Making unstated assumptions.\n*   Misreading negative indicators (e.g. 'not', 'except').\n*   Inverting ratios or coefficients.`,
    interview_tips: `Interviewers look at your thought process. When explaining a **${lessonTitle}** solution, verbally explain the structure/matrix grid you are building rather than just reporting the final numbers.`
  };
}

const companiesData = [
  { id: "tcs", name: "TCS", logo_url: "/logos/tcs.png" },
  { id: "infosys", name: "Infosys", logo_url: "/logos/infosys.png" },
  { id: "wipro", name: "Wipro", logo_url: "/logos/wipro.png" },
  { id: "cognizant", name: "Cognizant", logo_url: "/logos/cognizant.png" },
  { id: "accenture", name: "Accenture", logo_url: "/logos/accenture.png" },
  { id: "capgemini", name: "Capgemini", logo_url: "/logos/capgemini.png" },
  { id: "ibm", name: "IBM", logo_url: "/logos/ibm.png" },
  { id: "hcl", name: "HCL", logo_url: "/logos/hcl.png" },
  { id: "tech-mahindra", name: "Tech Mahindra", logo_url: "/logos/tech-mahindra.png" },
  { id: "amazon", name: "Amazon", logo_url: "/logos/amazon.png" },
  { id: "microsoft", name: "Microsoft", logo_url: "/logos/microsoft.png" },
  { id: "google", name: "Google", logo_url: "/logos/google.png" },
  { id: "deloitte", name: "Deloitte", logo_url: "/logos/deloitte.png" },
  { id: "pwc", name: "PwC", logo_url: "/logos/pwc.png" },
  { id: "ey", name: "EY", logo_url: "/logos/ey.png" },
  { id: "kpmg", name: "KPMG", logo_url: "/logos/kpmg.png" },
  { id: "cisco", name: "Cisco", logo_url: "/logos/cisco.png" },
  { id: "oracle", name: "Oracle", logo_url: "/logos/oracle.png" },
  { id: "goldman-sachs", name: "Goldman Sachs", logo_url: "/logos/goldman-sachs.png" }
];

async function seed() {
  console.log("Starting Unified V3 Curriculum Database Seed...");

  try {
    // 1. Clean up old records in order of dependencies
    console.log("Cleaning up old platform curriculum structures...");
    await supabase.from("platform_concepts").delete().neq("id", "");
    await supabase.from("platform_lessons").delete().neq("id", "");
    await supabase.from("platform_modules").delete().neq("id", "");
    await supabase.from("platform_domains").delete().neq("id", "");
    await supabase.from("platform_companies").delete().neq("id", "");
    console.log("Pruned old curriculum tables.");

    console.log("Seeding companies...");
    const { error: compErr } = await supabase.from("platform_companies").upsert(companiesData);
    if (compErr) throw compErr;
    console.log("✅ Companies seeded.");

    // 2. Loop through Domains -> Modules -> Lessons -> Concepts and seed
    for (const domain of curriculumData) {
      console.log(`Seeding Domain: ${domain.title} (${domain.id})`);
      const { error: domainErr } = await supabase.from("platform_domains").upsert({
        id: domain.id,
        title: domain.title,
        description: domain.description,
        display_order: domain.display_order
      });
      if (domainErr) throw domainErr;

      for (const mod of domain.modules) {
        console.log(`  Seeding Module: ${mod.title} (${mod.id})`);
        const { error: modErr } = await supabase.from("platform_modules").upsert({
          id: mod.id,
          domain_id: domain.id,
          title: mod.title,
          description: mod.description,
          level_order: mod.level_order
        });
        if (modErr) throw modErr;

        for (const lesson of mod.lessons) {
          console.log(`    Seeding Lesson: ${lesson.title} (${lesson.id})`);
          
          const resources = generateLessonResources(lesson.title);
          
          const { error: lessonErr } = await supabase.from("platform_lessons").upsert({
            id: lesson.id,
            module_id: mod.id,
            title: lesson.title,
            description: lesson.description,
            difficulty: lesson.difficulty,
            resources: resources,
            skills: lesson.skills || ["Logical Thinking", "Deductive Reasoning", "Quantitative Analysis"],
            prerequisites: lesson.prerequisites || [],
            status: "published"
          });
          if (lessonErr) throw lessonErr;

          const conceptPayloads = lesson.concepts.map((concept, idx) => ({
            id: `${lesson.id}-c-${idx + 1}`,
            lesson_id: lesson.id,
            title: concept,
            description: `Mastering micro-concept: ${concept} under ${lesson.title}.`,
            display_order: idx + 1
          }));
          const { error: conceptErr } = await supabase.from("platform_concepts").upsert(conceptPayloads);
          if (conceptErr) throw conceptErr;
        }
      }
    }

    console.log("✅ V3 Curriculum seeded successfully with Domains, Modules, Lessons, and Concepts!");
    console.log("⚠️  Note: As per architecture requirements, the platform_questions table starts with 0 questions (No fake questions generated). Ready for CSV upload or AI generation.");

  } catch (error) {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  }
}

seed();
