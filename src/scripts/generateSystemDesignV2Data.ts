import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, 'data/system-design');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function runGenerator() {
  console.log("Starting System Design v2 Expansion Generator...");
  ensureDir(dataPath);

  // 1. Generate Modules (Expanded)
  const modules = Array.from({ length: 50 }).map((_, i) => ({
    id: `mod-expanded-${i + 1}`,
    title: `Advanced Architecture Patterns: Volume ${i + 1}`,
    level_order: 10 + i
  }));

  // 2. Generate Lessons (500+)
  const lessons: any[] = [];
  modules.forEach(mod => {
    for (let j = 0; j < 10; j++) {
      lessons.push({
        id: `less-${mod.id}-${j}`,
        module_id: mod.id,
        title: `Deep Dive: ${mod.title} - Part ${j + 1}`,
        difficulty: ["beginner", "intermediate", "advanced", "expert"][j % 4],
        reading_time: 15 + (j * 2),
        content: {
          status: "draft", // CMS draft status
          markdown: "This is a machine-generated draft lesson. It requires review before publishing.",
          prerequisites: [],
          practice_questions: Array.from({ length: 10 }).map((_, qIndex) => ({
            q: `What is a primary consideration for pattern ${j + 1}?`,
            opts: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
            exp: "Option A is correct because it ensures consistency."
          }))
        }
      });
    }
  });

  // 3. Generate Case Studies (100+)
  const enterpriseNames = [
    "Netflix", "YouTube", "Instagram", "WhatsApp", "Discord", "Slack", "Zoom", "Google Meet",
    "Uber", "Ola", "Swiggy", "Zomato", "Amazon", "Flipkart", "Booking.com", "Airbnb",
    "Dropbox", "Google Drive", "OneDrive", "Spotify", "Paytm", "PhonePe", "UPI", "Stripe",
    "ChatGPT", "GitHub", "LinkedIn", "Twitter/X", "Facebook", "TikTok", "Snapchat", "Reddit",
    "Cloudflare", "Kubernetes Control Plane", "Kafka", "Redis", "ElasticSearch", "CDN",
    "API Gateway", "Service Mesh"
  ];
  
  // Fill the rest up to 100
  const cases: any[] = enterpriseNames.map((name, i) => ({
    id: `case-${i}`,
    title: `Design ${name}`,
    target_scale: `100M+ DAU`,
    content: {
      status: "draft",
      requirements: ["High Availability", "Low Latency", "Eventual Consistency"],
      hld_diagram: "mermaid-code-placeholder",
      lld_details: "Detailed component breakdown placeholder."
    }
  }));

  while(cases.length < 100) {
    cases.push({
      id: `case-${cases.length}`,
      title: `Design Generic Service ${cases.length}`,
      target_scale: "Global Scale",
      content: { status: "draft" }
    });
  }

  // 4. Generate Company Profiles (50+)
  const topCompanies = [
    "Google", "Meta", "Amazon", "Apple", "Netflix", "Microsoft", "Uber", "Airbnb", "LinkedIn",
    "Adobe", "Atlassian", "Oracle", "Salesforce", "VMware", "Cisco", "Nvidia", "Qualcomm",
    "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Visa", "Mastercard", "PayPal"
  ];
  const companies: any[] = topCompanies.map((name, i) => ({
    id: `comp-${i}`,
    name,
    difficulty: i % 2 === 0 ? "Hard" : "Medium",
    focus: ["System Design", "Algorithms", "Behavioral"],
    rubric: {
      status: "draft",
      evaluation_points: ["Scalability", "Fault Tolerance", "Communication"]
    }
  }));

  while(companies.length < 50) {
    companies.push({
      id: `comp-${companies.length}`,
      name: `Enterprise Corp ${companies.length}`,
      difficulty: "Medium",
      focus: ["Backend", "Cloud"],
      rubric: { status: "draft" }
    });
  }

  // Write files
  fs.writeFileSync(path.join(dataPath, 'modules.json'), JSON.stringify(modules, null, 2));
  fs.writeFileSync(path.join(dataPath, 'lessons.json'), JSON.stringify(lessons, null, 2));
  fs.writeFileSync(path.join(dataPath, 'cases.json'), JSON.stringify(cases, null, 2));
  fs.writeFileSync(path.join(dataPath, 'companies.json'), JSON.stringify(companies, null, 2));

  console.log(`Generated:
    - ${modules.length} Modules
    - ${lessons.length} Lessons (with ${lessons.length * 10} MCQs)
    - ${cases.length} Case Studies
    - ${companies.length} Company Profiles
  `);
  console.log("All generated content marked as 'draft' for CMS review.");
}

runGenerator().catch(console.error);
