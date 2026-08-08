export interface FullTemplateConfig {
  id: string;
  name: string;
  tagline: string;
  category: "TECHNICAL" | "CORPORATE" | "STUDENT" | "ACADEMIC" | "CREATIVE" | "EXECUTIVE";
  recommendedRoles: string[];
  supportsPhoto: boolean;
  supportsMultiplePages: boolean;
  columns: 1 | 2;
  layout: {
    headerAlignment: "left" | "center" | "split" | "block";
    sectionDivider: "none" | "thin" | "thick" | "double" | "accent-bar";
    dateAlignment: "right" | "inline";
    sidebarPosition?: "left" | "right";
    sidebarWidth?: string; // e.g. "30%"
    techTagStyle: "pills" | "inline" | "bold";
  };
  defaultFontId: string;
  defaultPaletteId: string;
  sectionOrder: string[];
}

export const ProductionTemplates: Record<string, FullTemplateConfig> = {
  "software-engineer": {
    id: "software-engineer",
    name: "Software Engineer",
    tagline: "Dense, ATS-optimized layout for SWE, Full Stack, Backend & Data Engineering roles.",
    category: "TECHNICAL",
    recommendedRoles: ["Software Engineer", "Full Stack Developer", "Backend Engineer", "Data Engineer"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "center",
      sectionDivider: "thin",
      dateAlignment: "right",
      techTagStyle: "pills",
    },
    defaultFontId: "inter",
    defaultPaletteId: "navy",
    sectionOrder: ["personal", "summary", "skills", "experience", "projects", "education", "certifications"],
  },

  "classic-ats": {
    id: "classic-ats",
    name: "Classic ATS",
    tagline: "Traditional single-column format guaranteed for enterprise ATS systems (Workday, Taleo).",
    category: "CORPORATE",
    recommendedRoles: ["Software Engineer", "Finance Analyst", "Consultant", "Corporate Roles"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "center",
      sectionDivider: "thin",
      dateAlignment: "right",
      techTagStyle: "inline",
    },
    defaultFontId: "arial",
    defaultPaletteId: "monochrome",
    sectionOrder: ["personal", "education", "experience", "projects", "skills"],
  },

  "graduate-placement": {
    id: "graduate-placement",
    name: "Campus Placement (No Photo)",
    tagline: "Standard single-column ATS resume for college placements & campus hiring (B.Tech, Degree, MCA).",
    category: "STUDENT",
    recommendedRoles: ["Campus Placement", "Engineering Graduate", "Internship Candidate", "Entry-Level SWE"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "left",
      sectionDivider: "thin",
      dateAlignment: "right",
      techTagStyle: "pills",
    },
    defaultFontId: "roboto",
    defaultPaletteId: "royal-blue",
    sectionOrder: ["personal", "education", "skills", "projects", "experience", "certifications", "achievements"],
  },

  "student-photo-pro": {
    id: "student-photo-pro",
    name: "Student Pro Placement (With Photo)",
    tagline: "Modern student resume with profile photograph, academic qualifications (10th/12th/Degree) & projects.",
    category: "STUDENT",
    recommendedRoles: ["Student Placement", "Graduate Trainee", "Junior Engineer", "Tech Intern"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 2,
    layout: {
      headerAlignment: "left",
      sectionDivider: "accent-bar",
      dateAlignment: "right",
      sidebarPosition: "left",
      sidebarWidth: "30%",
      techTagStyle: "pills",
    },
    defaultFontId: "inter",
    defaultPaletteId: "navy",
    sectionOrder: ["personal", "education", "skills", "summary", "projects", "experience", "certifications"],
  },

  "diploma-polytechnic": {
    id: "diploma-polytechnic",
    name: "Diploma & Polytechnic Specialist",
    tagline: "Tailored for Diploma & Polytechnic students highlighting 10th Schooling, Diploma Stream & Lab Projects.",
    category: "STUDENT",
    recommendedRoles: ["Diploma Engineer", "Polytechnic Student", "Technical Trainee", "Junior Associate"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "center",
      sectionDivider: "thick",
      dateAlignment: "right",
      techTagStyle: "inline",
    },
    defaultFontId: "arial",
    defaultPaletteId: "teal",
    sectionOrder: ["personal", "education", "skills", "projects", "certifications", "experience"],
  },

  "modern-professional": {
    id: "modern-professional",
    name: "Modern Professional",
    tagline: "Clean 2-column sidebar layout balancing visual impact with structured readability.",
    category: "CORPORATE",
    recommendedRoles: ["Product Manager", "UI/UX Engineer", "Data Scientist", "Tech Lead"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 2,
    layout: {
      headerAlignment: "left",
      sectionDivider: "none",
      dateAlignment: "right",
      sidebarPosition: "left",
      sidebarWidth: "32%",
      techTagStyle: "pills",
    },
    defaultFontId: "inter",
    defaultPaletteId: "indigo",
    sectionOrder: ["personal", "skills", "education", "summary", "experience", "projects"],
  },

  "minimal": {
    id: "minimal",
    name: "Minimalist",
    tagline: "Ultra-clean typography design with generous white space and elegant layout rhythm.",
    category: "CREATIVE",
    recommendedRoles: ["Frontend Developer", "Product Designer", "Startups", "Creative Technologist"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "left",
      sectionDivider: "none",
      dateAlignment: "right",
      techTagStyle: "inline",
    },
    defaultFontId: "georgia",
    defaultPaletteId: "warm",
    sectionOrder: ["personal", "summary", "experience", "projects", "skills", "education"],
  },

  "executive": {
    id: "executive",
    name: "Executive Leadership",
    tagline: "Commanding header block with core competencies grid tailored for senior engineering leaders.",
    category: "EXECUTIVE",
    recommendedRoles: ["Engineering Manager", "VP of Engineering", "Principal Architect", "Director of Tech"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "block",
      sectionDivider: "thick",
      dateAlignment: "right",
      techTagStyle: "bold",
    },
    defaultFontId: "garamond",
    defaultPaletteId: "navy",
    sectionOrder: ["personal", "summary", "experience", "leadership", "projects", "education"],
  },

  "academic-research": {
    id: "academic-research",
    name: "Academic Research",
    tagline: "Comprehensive CV layout highlighting Publications, Research, Conferences & Teaching.",
    category: "ACADEMIC",
    recommendedRoles: ["Ph.D. Researcher", "AI Scientist", "Research Engineer", "Graduate Assistant"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "center",
      sectionDivider: "thin",
      dateAlignment: "right",
      techTagStyle: "inline",
    },
    defaultFontId: "merriweather",
    defaultPaletteId: "monochrome",
    sectionOrder: ["personal", "education", "research", "publications", "experience", "skills", "achievements"],
  },

  "corporate-slate": {
    id: "corporate-slate",
    name: "Corporate Slate",
    tagline: "Formal double-divider styling in deep slate tones for traditional enterprise applications.",
    category: "CORPORATE",
    recommendedRoles: ["Business Analyst", "IT Consultant", "Enterprise Architect", "Systems Admin"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "split",
      sectionDivider: "double",
      dateAlignment: "right",
      techTagStyle: "inline",
    },
    defaultFontId: "arial",
    defaultPaletteId: "teal",
    sectionOrder: ["personal", "summary", "experience", "education", "skills", "projects"],
  },

  "creative-portfolio": {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    tagline: "Visual accent bar with portfolio links, skill meters, and optional profile photograph.",
    category: "CREATIVE",
    recommendedRoles: ["Full Stack Creative", "Mobile App Developer", "Game Developer", "UI Developer"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 2,
    layout: {
      headerAlignment: "left",
      sectionDivider: "accent-bar",
      dateAlignment: "right",
      sidebarPosition: "right",
      sidebarWidth: "30%",
      techTagStyle: "pills",
    },
    defaultFontId: "playfair",
    defaultPaletteId: "burgundy",
    sectionOrder: ["personal", "summary", "projects", "experience", "skills", "education"],
  },

  "technical-compact": {
    id: "technical-compact",
    name: "Technical Compact",
    tagline: "Maximized space efficiency engineered to fit multi-year technical experience onto 1 page.",
    category: "TECHNICAL",
    recommendedRoles: ["DevOps Engineer", "Cloud Architect", "Security Engineer", "Backend Developer"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "left",
      sectionDivider: "thin",
      dateAlignment: "right",
      techTagStyle: "pills",
    },
    defaultFontId: "jetbrains",
    defaultPaletteId: "forest",
    sectionOrder: ["personal", "skills", "experience", "projects", "education", "certifications"],
  },

  "btech-cs-placement": {
    id: "btech-cs-placement",
    name: "B.Tech CS Campus Drive (No Photo)",
    tagline: "Designed specifically for CS/IT undergraduates with Education (10th/12th/B.Tech), Coding Links & Projects.",
    category: "STUDENT",
    recommendedRoles: ["B.Tech CS Student", "IT Graduate", "Full Stack Intern", "Software Trainee"],
    supportsPhoto: false,
    supportsMultiplePages: true,
    columns: 1,
    layout: {
      headerAlignment: "left",
      sectionDivider: "thick",
      dateAlignment: "right",
      techTagStyle: "pills",
    },
    defaultFontId: "inter",
    defaultPaletteId: "navy",
    sectionOrder: ["personal", "education", "skills", "projects", "experience", "certifications", "achievements"],
  },

  "diploma-polytechnic-pro": {
    id: "diploma-polytechnic-pro",
    name: "Diploma / Polytechnic Pro (With Photo)",
    tagline: "2-Column layout for Polytechnic & Diploma students with Photo, Schooling (10th) & Lab Skill Badges.",
    category: "STUDENT",
    recommendedRoles: ["Diploma Engineering", "Polytechnic Student", "Technical Associate", "Junior CAD/Dev"],
    supportsPhoto: true,
    supportsMultiplePages: true,
    columns: 2,
    layout: {
      headerAlignment: "left",
      sectionDivider: "accent-bar",
      dateAlignment: "right",
      sidebarPosition: "left",
      sidebarWidth: "32%",
      techTagStyle: "pills",
    },
    defaultFontId: "roboto",
    defaultPaletteId: "royal-blue",
    sectionOrder: ["personal", "education", "skills", "summary", "projects", "experience", "certifications"],
  },
};

export function getFullTemplateConfig(id?: string): FullTemplateConfig {
  return ProductionTemplates[id || "software-engineer"] || ProductionTemplates["software-engineer"];
}
