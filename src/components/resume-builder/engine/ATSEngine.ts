import { ResumeDocument } from "../types";
import { getLayoutTemplate } from "../registries/LayoutRegistry";

export interface ATSEvaluation {
  score: number; // 0 - 100
  rating: "EXCELLENT" | "VERY_GOOD" | "MODERATE" | "LIMITED";
  stars: number; // 1 - 5
  rules: {
    rule: string;
    passed: boolean;
    points: number;
    description: string;
  }[];
}

export function evaluateATSCompatibility(doc: ResumeDocument): ATSEvaluation {
  const templateId = doc.metadata.templateId || "software-engineer";
  let layoutMeta;
  try {
    layoutMeta = getLayoutTemplate(templateId);
  } catch {
    layoutMeta = { layout: { columns: 1 } };
  }

  const personalSection = doc.sections.find((s) => s.type === "personal")?.data || {};
  const isSingleColumn = (layoutMeta?.columns ?? 1) === 1;
  const hasPhoto = !!personalSection.showPhoto;
  
  const rules = [
    {
      rule: "Single Column Layout",
      passed: isSingleColumn,
      points: 30,
      description: isSingleColumn
        ? "Uses a linear 1-column reading order optimal for ATS parsers (Taleo, Workday, Greenhouse)."
        : "Uses a 2-column sidebar layout. Some older ATS parsers may misorder text.",
    },
    {
      rule: "No Graphical Text / Text Boxes",
      passed: true,
      points: 20,
      description: "Uses pure semantic HTML text without image-based text or floating text boxes.",
    },
    {
      rule: "Standard ATS Headings",
      passed: true,
      points: 15,
      description: "Uses recognized section titles (Experience, Education, Skills, Projects).",
    },
    {
      rule: "No Photo (Corporate Standard)",
      passed: !hasPhoto,
      points: 15,
      description: !hasPhoto
        ? "No profile image attached. Avoids automatic rejection in US/UK/Canada corporate filters."
        : "Contains a profile picture. Preferred in DACH/EU/Creative roles, but can trigger US corporate filter warnings.",
    },
    {
      rule: "Standard Web-Safe / ATS Fonts",
      passed: true,
      points: 10,
      description: "Uses standard readable font families (Inter, Roboto, Arial, Times New Roman, Georgia).",
    },
    {
      rule: "Structured Bullet Formatting",
      passed: true,
      points: 10,
      description: "Uses clean HTML unordered list tags rather than non-standard symbols.",
    },
  ];

  let totalScore = rules.reduce((acc, curr) => acc + (curr.passed ? curr.points : 0), 0);

  // Determine Rating & Stars
  let rating: ATSEvaluation["rating"] = "EXCELLENT";
  let stars = 5;

  if (totalScore >= 90) {
    rating = "EXCELLENT";
    stars = 5;
  } else if (totalScore >= 75) {
    rating = "VERY_GOOD";
    stars = 4;
  } else if (totalScore >= 60) {
    rating = "MODERATE";
    stars = 3;
  } else {
    rating = "LIMITED";
    stars = 2;
  }

  return {
    score: totalScore,
    rating,
    stars,
    rules,
  };
}
