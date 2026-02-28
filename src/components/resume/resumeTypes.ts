export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    portfolio: string;
    address: string;
    photoUrl?: string;
  };
  objective: string;
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  certifications: CertificationItem[];
  achievements: string[];
  extracurricular: string[];
  volunteer: string[];
  languages: string[];
  references: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
  cgpa: string;
  details: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  duration: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  tools: string;
  goal: string;
  description: string;
  bullets: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export type CareerMode =
  | "software_developer"
  | "bank_job"
  | "bcs"
  | "teacher"
  | "doctor"
  | "freelancer"
  | "marketing"
  | "abroad_masters"
  | "general";

export type TemplateId =
  | "modern_clean"
  | "corporate"
  | "academic"
  | "creative"
  | "student_onepage"
  | "experienced";

export interface ResumeTemplate {
  id: TemplateId;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  accentColor: string;
  fontFamily: string;
  headerStyle: "left" | "center" | "split";
  sectionDivider: "line" | "dot" | "none" | "bold";
}

export interface ATSScore {
  overall: number;
  keywordMatch: number;
  formatSafety: number;
  grammarScore: number;
  suggestions: string[];
  missingKeywords: string[];
  overusedWords: string[];
  passiveVoiceWarnings: string[];
}

export interface StrengthMeter {
  objective: "strong" | "improve" | "weak";
  skills: "strong" | "improve" | "weak";
  experience: "strong" | "improve" | "weak";
  education: "strong" | "improve" | "weak";
  overall: "strong" | "improve" | "weak";
}

export const WIZARD_STEPS = [
  "personal",
  "career",
  "objective",
  "education",
  "skills",
  "projects",
  "experience",
  "certifications",
  "achievements",
  "template",
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export const CAREER_MODES: { id: CareerMode; label_en: string; label_bn: string; icon: string }[] = [
  { id: "software_developer", label_en: "Software Developer", label_bn: "সফটওয়্যার ডেভেলপার", icon: "💻" },
  { id: "bank_job", label_en: "Bank Job", label_bn: "ব্যাংক চাকরি", icon: "🏦" },
  { id: "bcs", label_en: "BCS Cadre", label_bn: "বিসিএস ক্যাডার", icon: "🏛️" },
  { id: "teacher", label_en: "Teacher", label_bn: "শিক্ষক", icon: "📚" },
  { id: "doctor", label_en: "Doctor", label_bn: "ডাক্তার", icon: "🩺" },
  { id: "freelancer", label_en: "Freelancer", label_bn: "ফ্রিল্যান্সার", icon: "🌐" },
  { id: "marketing", label_en: "Marketing", label_bn: "মার্কেটিং", icon: "📊" },
  { id: "abroad_masters", label_en: "Abroad Masters/PhD", label_bn: "বিদেশে মাস্টার্স/পিএইচডি", icon: "🎓" },
  { id: "general", label_en: "General", label_bn: "সাধারণ", icon: "📄" },
];

export const TEMPLATES: ResumeTemplate[] = [
  { id: "modern_clean", name_en: "Modern Clean", name_bn: "আধুনিক ক্লিন", description_en: "Sleek minimal design", description_bn: "ন্যূনতম ডিজাইন", accentColor: "#0d9488", fontFamily: "'Space Grotesk', sans-serif", headerStyle: "left", sectionDivider: "line" },
  { id: "corporate", name_en: "Corporate", name_bn: "করপোরেট", description_en: "Traditional professional", description_bn: "পেশাদার", accentColor: "#1e40af", fontFamily: "'Georgia', serif", headerStyle: "center", sectionDivider: "bold" },
  { id: "academic", name_en: "Academic / CV", name_bn: "একাডেমিক", description_en: "Research & academic focus", description_bn: "গবেষণা কেন্দ্রিক", accentColor: "#7c3aed", fontFamily: "'Times New Roman', serif", headerStyle: "left", sectionDivider: "line" },
  { id: "creative", name_en: "Creative", name_bn: "ক্রিয়েটিভ", description_en: "Bold & colorful", description_bn: "সাহসী ও রঙিন", accentColor: "#e11d48", fontFamily: "'Space Grotesk', sans-serif", headerStyle: "split", sectionDivider: "dot" },
  { id: "student_onepage", name_en: "Student One-Page", name_bn: "ছাত্র এক পৃষ্ঠা", description_en: "Compact for students", description_bn: "ছাত্রদের জন্য সংক্ষিপ্ত", accentColor: "#059669", fontFamily: "'Space Grotesk', sans-serif", headerStyle: "center", sectionDivider: "none" },
  { id: "experienced", name_en: "Experienced Pro", name_bn: "অভিজ্ঞ প্রো", description_en: "For 5+ years experience", description_bn: "৫+ বছরের অভিজ্ঞতা", accentColor: "#0f172a", fontFamily: "'Georgia', serif", headerStyle: "left", sectionDivider: "bold" },
];

export const emptyResumeData: ResumeData = {
  personalInfo: { fullName: "", email: "", phone: "", linkedin: "", portfolio: "", address: "" },
  objective: "",
  education: [],
  skills: [],
  projects: [],
  experience: [],
  certifications: [],
  achievements: [],
  extracurricular: [],
  volunteer: [],
  languages: [],
  references: [],
};
