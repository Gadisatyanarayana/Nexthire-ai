export type ReasoningQuestion = {
  id: string;
  category: "Logical" | "Verbal" | "Analytical";
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  companies: string[];
};

export const REASONING_TOPICS = [
  "Syllogism",
  "Blood Relations",
  "Seating Arrangement",
  "Coding-Decoding",
  "Series Completion",
  "Analogy",
  "Direction Sense",
  "Mathematical Operations",
  "Cryptarithmetic Puzzles",
  "Logical Venn Diagrams"
];

// Curated static base questions
const STATIC_QUESTIONS: ReasoningQuestion[] = [
  {
    id: "reas-static-1",
    category: "Logical",
    topic: "Syllogism",
    difficulty: "Medium",
    question: "Statements:\n1. All poets are artists.\n2. All artists are singers.\n\nConclusions:\nI. All poets are singers.\nII. All singers are artists.",
    options: ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions I and II follow", "Neither I nor II follows"],
    correctAnswer: 0,
    explanation: "Poet is a subset of Artist, which is a subset of Singer. Therefore, Poet is a subset of Singer, so Conclusion I follows. However, Singer is not necessarily a subset of Artist, so Conclusion II does not follow.",
    companies: ["TCS", "Infosys"],
  }
];

// Simple LCG deterministic random helper based on index
function getDeterministicVal(min: number, max: number, seed: number): number {
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  return Math.floor(pseudoRandom * (max - min + 1)) + min;
}

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = (seed + i) % (i + 1);
    const temp = newArr[i];
    newArr[i] = newArr[j];
    newArr[j] = temp;
  }
  return newArr;
}

// Generate dynamic reasoning variations targeting MNCs with mathematical focus
function generateDynamicQuestion(topic: string, index: number): ReasoningQuestion {
  const difficulties: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
  const diff = difficulties[index % difficulties.length];
  const companiesPool = ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Google", "Microsoft", "Capgemini", "IBM"];
  const companies = [companiesPool[index % companiesPool.length], companiesPool[(index + 2) % companiesPool.length]];
  const id = `reas-dyn-${topic.replace(/\s+/g, "").toLowerCase()}-${index}`;

  switch (topic) {
    case "Syllogism": {
      const subjects = [["cats", "mammals", "animals"], ["poets", "artists", "singers"], ["pens", "stationery", "tools"], ["ducks", "birds", "creatures"]];
      const selected = subjects[index % subjects.length];
      const [subA, subB, subC] = selected;
      
      const questionText = `Statements:\n1. All ${subA} are ${subB}.\n2. All ${subB} are ${subC}.\n\nConclusions:\nI. All ${subA} are ${subC}.\nII. Some ${subC} are ${subA}.`;
      const correctAns = "Both conclusions I and II follow";
      const choices = [
        "Only conclusion I follows",
        "Only conclusion II follows",
        "Both conclusions I and II follow",
        "Neither I nor II follows"
      ];
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        category: "Logical",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}]\n${questionText}`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Since all ${subA} belong to class ${subB}, and all ${subB} belong to class ${subC}, then all ${subA} must belong to class ${subC} (Conclusion I follows). Also, since all ${subA} are in ${subC}, there exists at least some members of ${subC} that are ${subA} (Conclusion II follows).`,
        companies
      };
    }
    case "Seating Arrangement": {
      const names = ["Anita", "Barrun", "Chitra", "Divya", "Eliza", "Faisal"];
      // Circular table seat index logic
      const targetName = names[(index + 2) % names.length];
      const leftName = names[(index + 1) % names.length];
      const rightName = names[(index + 3) % names.length];
      
      const questionText = `${names.join(", ")} sit around a circular table facing the center. ${targetName} is sitting between ${leftName} and ${rightName}. Who is sitting to the immediate right of ${leftName}?`;
      const correctAns = targetName;
      const choices = [targetName, leftName, rightName, names[(index + 4) % names.length]];
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        category: "Analytical",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] ${questionText}`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Since ${targetName} sits between ${leftName} and ${rightName}, and they face center, the relative order is ${leftName} -> ${targetName} -> ${rightName} going counter-clockwise. Thus, ${targetName} sits to the immediate right of ${leftName}.`,
        companies
      };
    }
    case "Coding-Decoding": {
      const words = ["CAT", "DOG", "FISH", "BIRD", "LION", "TIGER", "BEAR", "PANDA"];
      const word = words[index % words.length];
      const shift = (index % 3) + 1;
      
      const encodedWord = word.split("").map(char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }).join("");

      const targetWord = "HELP";
      const encodedTarget = targetWord.split("").map(char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(((code - 65 + shift) % 26) + 65);
      }).join("");

      const correctAns = encodedTarget;
      const choices = [correctAns, encodedTarget.split("").reverse().join(""), encodedTarget.replace(/./, "Z"), "KMPQ"].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push("ABCD");
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        category: "Analytical",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] If in a certain code language, "${word}" is written as "${encodedWord}", how will "${targetWord}" be written in that same code language?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Each letter of the word is shifted forward by ${shift} positions in alphabetical order. Applying the same shift of +${shift} to "HELP" yields "${encodedTarget}".`,
        companies
      };
    }
    case "Direction Sense": {
      const walkNorth = getDeterministicVal(10, 50, index);
      const walkEast = getDeterministicVal(15, 60, index + 1);
      const walkSouth = walkNorth; // forms rectangle
      const correctAns = `${walkEast} meters`;
      const choices = [correctAns, `${walkEast + 10} meters`, `${walkEast - 5} meters`, `${walkEast * 2} meters`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + 8} meters`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        category: "Analytical",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] A person walks ${walkNorth} meters North, then turns Right (East) and walks ${walkEast} meters, then turns Right (South) and walks ${walkSouth} meters. How far is the person now from the starting point?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `The path forms a rectangle. Walking ${walkNorth}m North and then ${walkSouth}m South cancels out the vertical displacement. The person is left with only a horizontal displacement of ${walkEast}m East. Thus, the distance from the start is exactly ${walkEast} meters.`,
        companies
      };
    }
    case "Analogy": {
      const analogies = [
        { q: "COAL : HEAT :: WAX : ?", a: "CANDLE", opts: ["CANDLE", "BEE", "LIGHT", "HONEY"] },
        { q: "CURD : MILK :: SHOE : ?", a: "LEATHER", opts: ["LEATHER", "COBBLER", "FOOT", "POLISH"] },
        { q: "DOCTOR : PATIENT :: LAWYER : ?", a: "CLIENT", opts: ["CLIENT", "COURT", "JUDGE", "LAW"] }
      ];
      const selection = analogies[index % analogies.length];
      const correctAns = selection.a;
      const options = shuffleDeterministic(selection.opts, index);
      return {
        id,
        category: "Verbal",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Find the word that completes the analogy relationship:\n${selection.q}`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Coal yields heat when processed/burned, and wax is the raw material used to make a candle.`,
        companies
      };
    }
    case "Blood Relations": {
      const correctAns = "Uncle";
      const choices = ["Uncle", "Brother", "Father", "Grandfather"];
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        category: "Logical",
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Introducing a man, a woman says, 'He is the only brother of my mother's brother.' How is the man related to the woman?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `My mother's brother is my maternal uncle. His only brother is my maternal uncle's brother, which is my mother's brother, or simply my Uncle.`,
        companies
      };
    }
    case "Mathematical Operations": {
      // Mathematical focus: Evaluate expressions based on custom symbol replacement rules
      const val1 = getDeterministicVal(4, 12, index);
      const val2 = getDeterministicVal(2, 6, index + 1);
      const val3 = getDeterministicVal(1, 5, index + 2);
      const result = val1 * val2 + val3;
      const correctAns = `${result}`;
      const choices = [correctAns, `${result - 2}`, `${result + 5}`, `${val1 * (val2 + val3)}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + result}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        category: "Analytical",
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] If '+' means 'multiplied by' and 'x' means 'added to', what is the value of the logical expression: ${val1} + ${val2} x ${val3}?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Replacing the operations according to the rules: '+' becomes '*' and 'x' becomes '+'. The expression translates to: ${val1} * ${val2} + ${val3} = ${val1 * val2} + ${val3} = ${result}.`,
        companies
      };
    }
    case "Cryptarithmetic Puzzles": {
      const val = getDeterministicVal(2, 8, index);
      const correctAns = `B = ${val}`;
      const choices = [`B = ${val}`, `B = ${(val + 2) % 10}`, `B = ${(val + 1) % 10}`, `B = 0`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`B = ${choices.length + 1}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        category: "Logical",
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] In the sum A + A + A = BA, where A and B represent single unique digits, solve for the digit B if A = ${val === 5 ? 5 : 5}.`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `If A = 5, then A + A + A = 5 + 5 + 5 = 15. In 15, the tens digit is 1 (B = 1) and units digit is 5 (A = 5). Thus B = 1.`,
        companies
      };
    }
    case "Logical Venn Diagrams": {
      const correctAns = "Engineers, Doctors, Professionals";
      const choices = ["Engineers, Doctors, Professionals", "Dogs, Cats, Fish", "Seconds, Minutes, Hours", "Apples, Fruits, Vehicles"];
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        category: "Logical",
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Which of the following groups of elements is best represented by a Venn Diagram with two separate circles completely enclosed within a larger circle?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Engineers and Doctors are completely distinct groups (non-overlapping circles) but both are professionals (enclosed inside the Professional category circle).`,
        companies
      };
    }
    default: {
      // Series Completion (mathematical series logic)
      const start = getDeterministicVal(2, 10, index);
      const increment = getDeterministicVal(3, 7, index);
      const seq = [start, start + increment, start + increment * 2, start + increment * 3];
      const correctAns = `${start + increment * 4}`;
      const choices = [correctAns, `${start + increment * 4 + 2}`, `${start + increment * 4 - 3}`, `${start + increment * 5}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + 10}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic: "Series Completion",
        category: "Analytical",
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Solve for the missing integer that completes the mathematical number series: ${seq.join(", ")}, ?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `The series is arithmetic, incrementing by a common difference of +${increment} at each step: ${seq.join(" -> ")} -> ${correctAns}.`,
        companies
      };
    }
  }
}

export function getReasoningQuestions(topic: string = "All Topics"): ReasoningQuestion[] {
  let questions = [...STATIC_QUESTIONS];
  
  for (const t of REASONING_TOPICS) {
    for (let i = 1; i <= 180; i++) {
      questions.push(generateDynamicQuestion(t, i));
    }
  }

  if (topic === "All Topics") {
    return questions;
  }
  return questions.filter(q => q.topic === topic);
}
