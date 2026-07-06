export type AptitudeQuestion = {
  id: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  companies: string[];
};

export const APTITUDE_TOPICS = [
  "Time & Work",
  "Time & Distance",
  "Profit & Loss",
  "Percentage",
  "Simple & Compound Interest",
  "Problems on Ages",
  "Average",
  "Ratio & Proportion",
  "Alphabetical Sequences",
  "Alphanumeric Puzzle Sets"
];

// Curated static base questions
const STATIC_QUESTIONS: AptitudeQuestion[] = [
  {
    id: "apt-static-1",
    topic: "Time & Work",
    difficulty: "Easy",
    question: "A can do a piece of work in 10 days and B can do it in 15 days. In how many days can they complete the work working together?",
    options: ["5 days", "6 days", "8 days", "12 days"],
    correctAnswer: 1,
    explanation: "A's 1-day work = 1/10. B's 1-day work = 1/15. Together they do (1/10 + 1/15) = 5/30 = 1/6 of the work in one day. Thus, together they will finish the work in 6 days.",
    companies: ["TCS", "Infosys", "Wipro"],
  }
];

// Simple deterministic LCG random generator based on index
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

// Generate dynamic question variations targeting MNCs
function generateDynamicQuestion(topic: string, index: number): AptitudeQuestion {
  const difficulties: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
  const diff = difficulties[index % difficulties.length];
  const companiesPool = ["TCS", "Infosys", "Wipro", "Cognizant", "Accenture", "Amazon", "Google", "Goldman Sachs", "Cisco", "Deloitte"];
  const companies = [companiesPool[index % companiesPool.length], companiesPool[(index + 3) % companiesPool.length]];
  const id = `apt-dyn-${topic.replace(/\s+/g, "").toLowerCase()}-${index}`;

  switch (topic) {
    case "Time & Work": {
      const x = getDeterministicVal(8, 20, index) * 2;
      const y = Math.round(x * 1.5);
      const daysTogether = Number(((x * y) / (x + y)).toFixed(1));
      const correctAns = `${daysTogether} days`;
      const choices = [correctAns, `${Math.round(daysTogether * 0.8)} days`, `${Math.round(daysTogether * 1.2)} days`, `${Math.round(daysTogether + 3)} days`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + 12} days`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] A can do a piece of work in ${x} days, and B can do the same work in ${y} days. If they work together, in how many days will the work be completed?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `A's 1-day rate = 1/${x}. B's 1-day rate = 1/${y}. Together, their combined 1-day rate = 1/${x} + 1/${y} = (${x}+${y})/(${x}*${y}). Inverting this gives the total days: (${x} * ${y}) / (${x} + ${y}) = ${daysTogether} days.`,
        companies
      };
    }
    case "Time & Distance": {
      const distance = getDeterministicVal(150, 450, index);
      const speed = getDeterministicVal(40, 80, index);
      const hours = Number((distance / speed).toFixed(2));
      const correctAns = `${hours} hours`;
      const choices = [correctAns, `${(hours * 0.9).toFixed(2)} hours`, `${(hours * 1.1).toFixed(2)} hours`, `${(hours + 1.5).toFixed(2)} hours`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + 6} hours`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] An express train covers a distance of ${distance} km between cities at a constant speed of ${speed} km/h. How much time does the trip take?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Time is calculated as Distance divided by Speed. Time = ${distance} km / ${speed} km/h = ${hours} hours.`,
        companies
      };
    }
    case "Profit & Loss": {
      const cp = getDeterministicVal(100, 2000, index);
      const margin = getDeterministicVal(5, 30, index);
      const sp = Math.round(cp * (1 + margin / 100));
      const correctAns = `$${sp}`;
      const choices = [correctAns, `$${Math.round(sp * 0.9)}`, `$${Math.round(sp * 1.1)}`, `$${sp - 15}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`$${choices.length + cp}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] A vendor buys a server cluster component for $${cp} and sells it at a profit margin of ${margin}%. What is the selling price?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Selling Price = Cost Price * (1 + Profit% / 100). SP = $${cp} * (1 + ${margin} / 100) = $${sp}.`,
        companies
      };
    }
    case "Percentage": {
      const original = getDeterministicVal(200, 1500, index);
      const percent = getDeterministicVal(10, 85, index);
      const val = Math.round((percent / 100) * original);
      const correctAns = `${val}`;
      const choices = [correctAns, `${Math.round(val * 0.9)}`, `${Math.round(val * 1.15)}`, `${val - 12}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + original}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] In a batch test, ${percent}% of the ${original} candidate servers reported zero memory faults. How many servers reported zero faults?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Compute ${percent}% of ${original}. Value = (${percent} / 100) * ${original} = ${val}.`,
        companies
      };
    }
    case "Simple & Compound Interest": {
      const principal = getDeterministicVal(1000, 10000, index * 2);
      const rate = getDeterministicVal(4, 12, index);
      const time = getDeterministicVal(2, 6, index);
      const interest = Math.round((principal * rate * time) / 100);
      const correctAns = `$${interest}`;
      const choices = [correctAns, `$${interest + 50}`, `$${interest - 40}`, `$${Math.round(interest * 1.1)}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`$${choices.length + rate}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Calculate the Simple Interest earned on a software equipment leasing security deposit of $${principal} at an annual rate of ${rate}% over ${time} years.`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Simple Interest (SI) = (P * R * T) / 100. SI = ($${principal} * ${rate} * ${time}) / 100 = $${interest}.`,
        companies
      };
    }
    case "Problems on Ages": {
      const ratioA = getDeterministicVal(3, 5, index);
      const ratioB = ratioA + 1;
      const multiplier = getDeterministicVal(3, 8, index);
      const ageA = ratioA * multiplier;
      const ageB = ratioB * multiplier;
      const yearsDiff = getDeterministicVal(4, 10, index);
      
      const correctAns = `${ageA} years`;
      const choices = [correctAns, `${ageA + yearsDiff} years`, `${ageB} years`, `${ageA - 2} years`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + ageA} years`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] The ratio of the ages of two system analysts is ${ratioA}:${ratioB}. If the difference in their ages is ${ageB - ageA} years, what is the age of the younger analyst?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Let their ages be ${ratioA}x and ${ratioB}x. Difference is (${ratioB} - ${ratioA})x = x. Given difference is ${ageB - ageA} years, so x = ${ageB - ageA}. The younger analyst's age is ${ratioA}x = ${ratioA} * ${ageB - ageA} = ${ageA} years.`,
        companies
      };
    }
    case "Average": {
      const n1 = getDeterministicVal(50, 100, index);
      const n2 = getDeterministicVal(40, 95, index + 1);
      const n3 = getDeterministicVal(60, 120, index + 2);
      const avg = Math.round((n1 + n2 + n3) / 3);
      const correctAns = `${avg}`;
      const choices = [correctAns, `${avg + 4}`, `${avg - 6}`, `${Math.round(avg * 1.1)}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`${choices.length + avg}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] An operational manager registers server response latencies of ${n1}ms, ${n2}ms, and ${n3}ms. What is the average response latency across these components?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Average is the sum divided by count. Average = (${n1} + ${n2} + ${n3}) / 3 = ${n1 + n2 + n3} / 3 = ${avg} ms.`,
        companies
      };
    }
    case "Ratio & Proportion": {
      const total = getDeterministicVal(15, 60, index) * 10;
      const shareA = Math.round(total * 0.6);
      const shareB = total - shareA;
      const correctAns = `$${shareA}`;
      const choices = [correctAns, `$${shareA - 30}`, `$${shareA + 40}`, `$${shareB}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`$${choices.length + shareA}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Divide a server bandwidth budget of $${total} between departments A and B in the ratio of 3:2. What is the budget share of A?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `Total ratio parts = 3 + 2 = 5. Share of A = (Total / 5) * 3 = ($${total} / 5) * 3 = $${shareA}.`,
        companies
      };
    }
    case "Alphabetical Sequences": {
      const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const startIdx = getDeterministicVal(0, 10, index);
      const step = getDeterministicVal(2, 4, index);
      const seq = [
        alphabets[startIdx],
        alphabets[startIdx + step],
        alphabets[startIdx + step * 2],
        alphabets[startIdx + step * 3]
      ];
      const correctAns = alphabets[startIdx + step * 4];
      const choices = [correctAns, alphabets[(startIdx + step * 4 + 2) % 26], alphabets[(startIdx + step * 4 - 1 + 26) % 26], alphabets[(startIdx + step * 4 + 3) % 26]].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(alphabets[(startIdx + choices.length) % 26]);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] Identify the next alphabetical element in the following logical sequence: ${seq.join(", ")}, ?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `The sequence progresses by shifting forward by +${step} characters in the English alphabet: ${seq.join(" -> ")} -> ${correctAns}.`,
        companies
      };
    }
    default: {
      const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const charPart = alphabets[getDeterministicVal(0, 20, index)];
      const numPart = getDeterministicVal(10, 99, index);
      const nextChar = alphabets[(alphabets.indexOf(charPart) + 1) % 26];
      const nextNum = numPart + 10;
      
      const correctAns = `${nextChar}${nextNum}`;
      const choices = [correctAns, `${nextChar}${numPart}`, `${charPart}${nextNum}`, `${alphabets[(alphabets.indexOf(charPart) + 2) % 26]}${nextNum + 10}`].filter((v, i, a) => a.indexOf(v) === i);
      while (choices.length < 4) {
        choices.push(`Z${choices.length + numPart}`);
      }
      const options = shuffleDeterministic(choices, index);
      return {
        id,
        topic,
        difficulty: diff,
        question: `[Company Target: ${companies.join("/")}] In a resource allocation queue code pattern, what is the next alphanumeric key following: ${charPart}${numPart}, ?`,
        options,
        correctAnswer: options.indexOf(correctAns),
        explanation: `The character increments by 1 step in alphabetical order, and the number increments by 10. Thus, the next key after ${charPart}${numPart} is ${correctAns}.`,
        companies
      };
    }
  }
}

export function getAptitudeQuestions(topic: string = "All Topics"): AptitudeQuestion[] {
  let questions = [...STATIC_QUESTIONS];
  
  for (const t of APTITUDE_TOPICS) {
    for (let i = 1; i <= 180; i++) {
      questions.push(generateDynamicQuestion(t, i));
    }
  }

  if (topic === "All Topics") {
    return questions;
  }
  return questions.filter(q => q.topic === topic);
}
