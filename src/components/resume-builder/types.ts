export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  employmentType: string;
  isRemote: boolean;
  startDate: string;
  endDate: string;
  current: boolean;
  techStack?: string;
  achievements: string[];
}

export interface Project {
  id: string;
  name: string;
  category: string;
  techStack: string;
  github: string;
  liveUrl: string;
  duration: string;
  role: string;
  description: string;
  achievements: string[];
}

export interface Education {
  id: string;
  institute: string;
  degree: string;
  branch?: string;
  cgpa: string;
  startDate: string;
  endDate: string;
  coursework: string[];
  activities: string;
  achievements: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  skills: string;
}

export interface ThemeSettings {
  id: string;
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number; // base size
  lineHeight: number;
}

export interface ResumeData {
  id?: string;
  // Global Settings
  templateId: string;
  themeId: string;
  typography: TypographySettings;
  
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  
  // Summaries
  targetRole: string;
  summary: string;
  careerObjective: string;
  
  // Structured Sections
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillCategory[];
  
  // Legacy / Additional
  leadership: string;
  openSource: string;
  achievements: string; // generic
  certifications: string;
  languages: string;
  interests: string;
}

export const defaultResumeData: ResumeData = {
  templateId: "jakes-resume",
  themeId: "classic",
  typography: {
    fontFamily: "Times New Roman, serif",
    fontSize: 12,
    lineHeight: 1.5,
  },
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  portfolio: "",
  targetRole: "",
  summary: "",
  careerObjective: "",
  experiences: [],
  projects: [],
  education: [],
  skills: [
    { id: "1", name: "Programming Languages", skills: "" },
    { id: "2", name: "Frameworks & Libraries", skills: "" },
    { id: "3", name: "Tools & Cloud", skills: "" }
  ],
  leadership: "",
  openSource: "",
  achievements: "",
  certifications: "",
  languages: "",
  interests: ""
};
