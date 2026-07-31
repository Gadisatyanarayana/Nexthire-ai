import { config } from "dotenv";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function analyzeQuestions() {
  console.log("Fetching all question IDs and titles from Supabase...");
  let all: any[] = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(`${url}/rest/v1/questions?select=id,title,difficulty,topic,pattern_tags,acceptance_rate&offset=${offset}&limit=${limit}`, {
      headers: {
        "apikey": key || "",
        "Authorization": `Bearer ${key}`
      }
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    offset += data.length;
    if (data.length < limit) break;
  }

  console.log(`Total fetched: ${all.length}`);

  let setPatternCount = 0;
  let roadmapCount = 0;
  let realLeetCodeNames = 0;
  const sampleTitles: string[] = [];

  all.forEach((q, idx) => {
    if (idx < 20) sampleTitles.push(`${q.id} -> ${q.title}`);
    if (q.title.includes("Set ")) setPatternCount++;
    if (q.id.startsWith("roadmap-")) roadmapCount++;
  });

  console.log(`Questions with "Set X": ${setPatternCount}`);
  console.log(`Questions with id starting with "roadmap-": ${roadmapCount}`);
  console.log("\nSample 20 titles:");
  sampleTitles.forEach(t => console.log("  ", t));
}

analyzeQuestions();
