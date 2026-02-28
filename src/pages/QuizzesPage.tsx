import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Lock, Gamepad2, Brain, Clock, ChevronRight, CheckCircle2, XCircle, RotateCcw, Loader2, Trophy, Target, Zap, AlertTriangle, GraduationCap, Briefcase } from "lucide-react";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

// ── University department subjects ──
const DEPT_SUBJECTS: Record<string, { nameEn: string; nameBn: string }[]> = {
  CSE: [
    { nameEn: "Data Structures & Algorithms", nameBn: "ডেটা স্ট্রাকচার ও অ্যালগরিদম" },
    { nameEn: "Computer Networks", nameBn: "কম্পিউটার নেটওয়ার্ক" },
    { nameEn: "Database Management", nameBn: "ডেটাবেস ম্যানেজমেন্ট" },
    { nameEn: "Operating Systems", nameBn: "অপারেটিং সিস্টেম" },
    { nameEn: "Artificial Intelligence", nameBn: "কৃত্রিম বুদ্ধিমত্তা" },
    { nameEn: "Discrete Mathematics", nameBn: "বিচ্ছিন্ন গণিত" },
    { nameEn: "Cyber Security", nameBn: "সাইবার সিকিউরিটি" },
    { nameEn: "Software Engineering", nameBn: "সফটওয়্যার ইঞ্জিনিয়ারিং" },
  ],
  EEE: [
    { nameEn: "Circuit Analysis", nameBn: "সার্কিট বিশ্লেষণ" },
    { nameEn: "Signal Processing", nameBn: "সিগন্যাল প্রসেসিং" },
    { nameEn: "Power Systems", nameBn: "পাওয়ার সিস্টেম" },
    { nameEn: "Telecommunications", nameBn: "টেলিযোগাযোগ" },
    { nameEn: "Control Systems", nameBn: "কন্ট্রোল সিস্টেম" },
    { nameEn: "Electronics", nameBn: "ইলেকট্রনিক্স" },
  ],
  ME: [
    { nameEn: "Thermodynamics", nameBn: "তাপগতিবিদ্যা" },
    { nameEn: "Mechanics of Solids", nameBn: "কঠিন পদার্থের বলবিদ্যা" },
    { nameEn: "Manufacturing Process", nameBn: "ম্যানুফ্যাকচারিং প্রসেস" },
    { nameEn: "Fluid Mechanics", nameBn: "তরল বলবিদ্যা" },
    { nameEn: "Machine Design", nameBn: "মেশিন ডিজাইন" },
  ],
  CE: [
    { nameEn: "Structural Engineering", nameBn: "স্ট্রাকচারাল ইঞ্জিনিয়ারিং" },
    { nameEn: "Hydraulics", nameBn: "হাইড্রোলিক্স" },
    { nameEn: "Construction Management", nameBn: "কনস্ট্রাকশন ম্যানেজমেন্ট" },
    { nameEn: "Geotechnical Engineering", nameBn: "ভূপ্রকৌশল" },
    { nameEn: "Transportation Engineering", nameBn: "পরিবহন প্রকৌশল" },
  ],
  BBA: [
    { nameEn: "Principles of Management", nameBn: "ব্যবস্থাপনার মূলনীতি" },
    { nameEn: "Financial Accounting", nameBn: "আর্থিক হিসাববিজ্ঞান" },
    { nameEn: "Marketing Management", nameBn: "মার্কেটিং ম্যানেজমেন্ট" },
    { nameEn: "Business Finance", nameBn: "ব্যবসায় ফিন্যান্স" },
    { nameEn: "Human Resource Management", nameBn: "মানবসম্পদ ব্যবস্থাপনা" },
    { nameEn: "Business Statistics", nameBn: "ব্যবসায় পরিসংখ্যান" },
  ],
  Economics: [
    { nameEn: "Microeconomics", nameBn: "ব্যষ্টিক অর্থনীতি" },
    { nameEn: "Macroeconomics", nameBn: "সামষ্টিক অর্থনীতি" },
    { nameEn: "Econometrics", nameBn: "অর্থমিতি" },
    { nameEn: "Development Economics", nameBn: "উন্নয়ন অর্থনীতি" },
    { nameEn: "International Trade", nameBn: "আন্তর্জাতিক বাণিজ্য" },
  ],
  English: [
    { nameEn: "English Literature", nameBn: "ইংরেজি সাহিত্য" },
    { nameEn: "Linguistics", nameBn: "ভাষাতত্ত্ব" },
    { nameEn: "Academic Writing", nameBn: "একাডেমিক রাইটিং" },
    { nameEn: "Drama & Poetry", nameBn: "নাটক ও কবিতা" },
  ],
  Physics: [
    { nameEn: "Quantum Mechanics", nameBn: "কোয়ান্টাম বলবিদ্যা" },
    { nameEn: "Classical Mechanics", nameBn: "ধ্রুপদী বলবিদ্যা" },
    { nameEn: "Electromagnetism", nameBn: "তড়িৎচুম্বকত্ব" },
    { nameEn: "Statistical Physics", nameBn: "পরিসংখ্যান পদার্থবিজ্ঞান" },
    { nameEn: "Nuclear Physics", nameBn: "পারমাণবিক পদার্থবিজ্ঞান" },
  ],
  Mathematics: [
    { nameEn: "Calculus", nameBn: "ক্যালকুলাস" },
    { nameEn: "Linear Algebra", nameBn: "রৈখিক বীজগণিত" },
    { nameEn: "Probability & Statistics", nameBn: "সম্ভাবনা ও পরিসংখ্যান" },
    { nameEn: "Real Analysis", nameBn: "বাস্তব বিশ্লেষণ" },
    { nameEn: "Abstract Algebra", nameBn: "বিমূর্ত বীজগণিত" },
  ],
  Chemistry: [
    { nameEn: "Organic Chemistry", nameBn: "জৈব রসায়ন" },
    { nameEn: "Inorganic Chemistry", nameBn: "অজৈব রসায়ন" },
    { nameEn: "Physical Chemistry", nameBn: "ভৌত রসায়ন" },
    { nameEn: "Analytical Chemistry", nameBn: "বিশ্লেষণী রসায়ন" },
  ],
  Pharmacy: [
    { nameEn: "Pharmacology", nameBn: "ফার্মাকোলজি" },
    { nameEn: "Pharmaceutical Chemistry", nameBn: "ফার্মাসিউটিক্যাল কেমিস্ট্রি" },
    { nameEn: "Clinical Pharmacy", nameBn: "ক্লিনিক্যাল ফার্মেসি" },
    { nameEn: "Microbiology", nameBn: "অণুজীববিজ্ঞান" },
  ],
  Law: [
    { nameEn: "Constitutional Law", nameBn: "সাংবিধানিক আইন" },
    { nameEn: "Criminal Law", nameBn: "ফৌজদারি আইন" },
    { nameEn: "Civil Law", nameBn: "দেওয়ানী আইন" },
    { nameEn: "International Law", nameBn: "আন্তর্জাতিক আইন" },
  ],
  Marketing: [
    { nameEn: "Digital Marketing", nameBn: "ডিজিটাল মার্কেটিং" },
    { nameEn: "Consumer Behavior", nameBn: "ভোক্তা আচরণ" },
    { nameEn: "Brand Management", nameBn: "ব্র্যান্ড ম্যানেজমেন্ট" },
    { nameEn: "Market Research", nameBn: "মার্কেট রিসার্চ" },
  ],
  Finance: [
    { nameEn: "Corporate Finance", nameBn: "কর্পোরেট ফিন্যান্স" },
    { nameEn: "Banking & Insurance", nameBn: "ব্যাংকিং ও বীমা" },
    { nameEn: "Investment Analysis", nameBn: "বিনিয়োগ বিশ্লেষণ" },
    { nameEn: "Financial Management", nameBn: "আর্থিক ব্যবস্থাপনা" },
  ],
  Accounting: [
    { nameEn: "Cost Accounting", nameBn: "ব্যয় হিসাববিজ্ঞান" },
    { nameEn: "Auditing", nameBn: "নিরীক্ষা" },
    { nameEn: "Tax Accounting", nameBn: "কর হিসাববিজ্ঞান" },
    { nameEn: "Management Accounting", nameBn: "ব্যবস্থাপনা হিসাববিজ্ঞান" },
  ],
};

// ── HSC subjects (Science, Commerce, Arts groups) ──
const HSC_GROUPS: Record<string, { nameEn: string; nameBn: string }[]> = {
  Science: [
    { nameEn: "Physics", nameBn: "পদার্থবিজ্ঞান" },
    { nameEn: "Chemistry", nameBn: "রসায়ন" },
    { nameEn: "Mathematics", nameBn: "গণিত" },
    { nameEn: "Biology", nameBn: "জীববিজ্ঞান" },
    { nameEn: "Higher Math", nameBn: "উচ্চতর গণিত" },
    { nameEn: "ICT", nameBn: "আইসিটি" },
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
  ],
  Commerce: [
    { nameEn: "Accounting", nameBn: "হিসাববিজ্ঞান" },
    { nameEn: "Business Organization", nameBn: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা" },
    { nameEn: "Finance & Banking", nameBn: "ফিন্যান্স ও ব্যাংকিং" },
    { nameEn: "Production Management", nameBn: "উৎপাদন ব্যবস্থাপনা" },
    { nameEn: "Economics", nameBn: "অর্থনীতি" },
    { nameEn: "ICT", nameBn: "আইসিটি" },
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
  ],
  Arts: [
    { nameEn: "History", nameBn: "ইতিহাস" },
    { nameEn: "Islamic Studies", nameBn: "ইসলাম শিক্ষা" },
    { nameEn: "Civics", nameBn: "পৌরনীতি ও সুশাসন" },
    { nameEn: "Economics", nameBn: "অর্থনীতি" },
    { nameEn: "Geography", nameBn: "ভূগোল" },
    { nameEn: "Logic", nameBn: "যুক্তিবিদ্যা" },
    { nameEn: "Sociology", nameBn: "সমাজবিজ্ঞান" },
    { nameEn: "Social Work", nameBn: "সমাজকর্ম" },
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "ICT", nameBn: "আইসিটি" },
  ],
};

// ── Job candidate classes/tracks ──
const JOB_CLASSES: { id: string; nameEn: string; nameBn: string }[] = [
  { id: "BCS", nameEn: "BCS (Bangladesh Civil Service)", nameBn: "বিসিএস (বাংলাদেশ সিভিল সার্ভিস)" },
  { id: "Bank", nameEn: "Bank Job", nameBn: "ব্যাংক চাকরি" },
  { id: "Primary", nameEn: "Primary Teacher (NAPE)", nameBn: "প্রাইমারি শিক্ষক (নেপ)" },
  { id: "NTRCA", nameEn: "NTRCA (Non-Govt Teacher)", nameBn: "এনটিআরসিএ (বেসরকারি শিক্ষক)" },
  { id: "Railway", nameEn: "Railway", nameBn: "রেলওয়ে" },
  { id: "Judiciary", nameEn: "Judiciary", nameBn: "বিচার বিভাগ" },
  { id: "Private", nameEn: "Private Job / Corporate", nameBn: "প্রাইভেট চাকরি / কর্পোরেট" },
];

// ── Job candidate subjects ──
const JOB_SUBJECTS: Record<string, { nameEn: string; nameBn: string }[]> = {
  BCS: [
    { nameEn: "Bangla Language & Literature", nameBn: "বাংলা ভাষা ও সাহিত্য" },
    { nameEn: "English Language & Literature", nameBn: "ইংরেজি ভাষা ও সাহিত্য" },
    { nameEn: "Bangladesh Affairs", nameBn: "বাংলাদেশ বিষয়াবলি" },
    { nameEn: "International Affairs", nameBn: "আন্তর্জাতিক বিষয়াবলি" },
    { nameEn: "Geography & Environment", nameBn: "ভূগোল ও পরিবেশ" },
    { nameEn: "General Science & Technology", nameBn: "সাধারণ বিজ্ঞান ও প্রযুক্তি" },
    { nameEn: "Mathematical Reasoning", nameBn: "গাণিতিক যুক্তি" },
    { nameEn: "Mental Ability", nameBn: "মানসিক দক্ষতা" },
    { nameEn: "Ethics & Good Governance", nameBn: "নৈতিকতা ও সুশাসন" },
  ],
  Bank: [
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "Mathematics", nameBn: "গণিত" },
    { nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
    { nameEn: "Computer & ICT", nameBn: "কম্পিউটার ও আইসিটি" },
    { nameEn: "Banking Knowledge", nameBn: "ব্যাংকিং জ্ঞান" },
    { nameEn: "Analytical Ability", nameBn: "বিশ্লেষণমূলক দক্ষতা" },
  ],
  Primary: [
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "Mathematics", nameBn: "গণিত" },
    { nameEn: "General Knowledge & Science", nameBn: "সাধারণ জ্ঞান ও বিজ্ঞান" },
    { nameEn: "Child Psychology", nameBn: "শিশু মনোবিজ্ঞান" },
  ],
  NTRCA: [
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "Mathematics", nameBn: "গণিত" },
    { nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
    { nameEn: "Education & Teaching", nameBn: "শিক্ষা ও শিক্ষণ" },
  ],
  Railway: [
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "Mathematics", nameBn: "গণিত" },
    { nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
    { nameEn: "Technical Knowledge", nameBn: "প্রযুক্তিগত জ্ঞান" },
  ],
  Judiciary: [
    { nameEn: "Constitutional Law", nameBn: "সাংবিধানিক আইন" },
    { nameEn: "Criminal Law & Procedure", nameBn: "ফৌজদারি আইন ও পদ্ধতি" },
    { nameEn: "Civil Law & Procedure", nameBn: "দেওয়ানী আইন ও পদ্ধতি" },
    { nameEn: "Evidence Law", nameBn: "সাক্ষ্য আইন" },
    { nameEn: "Bangla", nameBn: "বাংলা" },
    { nameEn: "English", nameBn: "ইংরেজি" },
    { nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
  ],
  Private: [
    { nameEn: "Aptitude & Reasoning", nameBn: "যোগ্যতা ও যুক্তি" },
    { nameEn: "English Proficiency", nameBn: "ইংরেজি দক্ষতা" },
    { nameEn: "Quantitative Analysis", nameBn: "পরিমাণগত বিশ্লেষণ" },
    { nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
    { nameEn: "Computer Literacy", nameBn: "কম্পিউটার সাক্ষরতা" },
    { nameEn: "Communication Skills", nameBn: "যোগাযোগ দক্ষতা" },
  ],
};

const GENERIC_UNI_SUBJECTS = [
  { nameEn: "Core Subject Studies", nameBn: "মূল বিষয় পড়াশোনা" },
  { nameEn: "Research Methodology", nameBn: "গবেষণা পদ্ধতি" },
  { nameEn: "Academic Writing", nameBn: "একাডেমিক রাইটিং" },
  { nameEn: "Computer Skills", nameBn: "কম্পিউটার দক্ষতা" },
  { nameEn: "Communication Skills", nameBn: "যোগাযোগ দক্ষতা" },
  { nameEn: "Statistics & Data", nameBn: "পরিসংখ্যান ও ডেটা" },
];

interface QuizQuestion {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: string;
  explanation: string;
}

interface QuizResult {
  score: number;
  correct: number;
  total: number;
  details: { id: number; correct: boolean; userAnswer: string; correctAnswer: string }[];
  feedback: string;
}

type Phase = "setup" | "loading" | "quiz" | "results";
type UserType = "school" | "university" | "job";

// ── Class options for quiz ──
const QUIZ_CLASS_OPTIONS = [
  { value: "6", en: "Class 6", bn: "৬ষ্ঠ শ্রেণি" },
  { value: "7", en: "Class 7", bn: "৭ম শ্রেণি" },
  { value: "8", en: "Class 8", bn: "৮ম শ্রেণি" },
  { value: "9", en: "Class 9", bn: "৯ম শ্রেণি" },
  { value: "10", en: "Class 10", bn: "১০ম শ্রেণি" },
  { value: "HSC", en: "HSC (Class 11-12) 📚", bn: "এইচএসসি (একাদশ-দ্বাদশ) 📚" },
  { value: "University", en: "University 🎓", bn: "বিশ্ববিদ্যালয় 🎓" },
  { value: "Job Candidate", en: "Job Candidate 💼", bn: "চাকরি প্রার্থী 💼" },
];

// ── University departments for quiz ──
const UNI_DEPARTMENTS = Object.keys(DEPT_SUBJECTS);

const QuizzesPage = () => {
  const { t, lang } = useLanguage();
  const { userPlan, user, profile } = useAuth();
  const locked = userPlan === "free";

  // Setup state
  const [selectedClass, setSelectedClass] = useState(() => {
    if (profile?.is_job_candidate) return "Job Candidate";
    if (profile?.class_level === "University") return "University";
    return profile?.class_level || "9";
  });
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    if (profile?.interests) {
      const dept = profile.interests.find((i: string) => Object.keys(DEPT_SUBJECTS).includes(i));
      if (dept) return dept;
    }
    return "";
  });

  const userType: UserType = selectedClass === "Job Candidate" ? "job" : (selectedClass === "University" || selectedClass === "HSC") ? "university" : "school";

  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [selectedJobClass, setSelectedJobClass] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState("10");

  // Quiz state
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const classLevel = selectedClass;

  // Get department/job sector for non-school users
  const getDepartment = () => selectedDepartment || null;

  const getJobSector = (): string => {
    if (userType === "job" && selectedJobClass) return selectedJobClass;
    return "Private";
  };

  // Build subject list based on user type
  const getSubjectOptions = () => {
    if (selectedClass === "HSC") {
      const group = selectedDepartment;
      const base = group ? HSC_GROUPS[group] : [];
      return [...base, { nameEn: "__other__", nameBn: "__other__" }];
    }
    if (userType === "university") {
      const dept = getDepartment();
      const base = (dept && dept !== "__other__") ? (DEPT_SUBJECTS[dept] || GENERIC_UNI_SUBJECTS) : GENERIC_UNI_SUBJECTS;
      return [...base, { nameEn: "__other__", nameBn: "__other__" }];
    }
    if (userType === "job") {
      const sector = selectedJobClass || getJobSector();
      const base = JOB_SUBJECTS[sector] || JOB_SUBJECTS.Private;
      return [...base, { nameEn: "__other__", nameBn: "__other__" }];
    }
    return []; // school uses DB-driven subjects
  };

  const staticSubjects = getSubjectOptions();

  // Fetch subjects for school students from DB
  useEffect(() => {
    if (userType !== "school") return;
    const load = async () => {
      const { data } = await supabase.from("subjects").select("*").eq("class_level", classLevel).order("sort_order");
      if (data) setSubjects(data);
    };
    load();
  }, [classLevel, userType]);

  // Fetch chapters when subject changes (school only)
  useEffect(() => {
    if (userType !== "school" || !selectedSubject) { setChapters([]); setTopics([]); return; }
    const load = async () => {
      const { data } = await supabase.from("chapters").select("*").eq("subject_id", selectedSubject).order("sort_order");
      if (data) setChapters(data);
    };
    load();
    setSelectedChapter("");
    setSelectedTopic("");
    setTopics([]);
  }, [selectedSubject, userType]);

  // Fetch topics when chapter changes (school only)
  useEffect(() => {
    if (userType !== "school" || !selectedChapter) { setTopics([]); return; }
    const load = async () => {
      const { data } = await supabase.from("topics").select("*").eq("chapter_id", selectedChapter).order("sort_order");
      if (data) setTopics(data);
    };
    load();
    setSelectedTopic("");
  }, [selectedChapter, userType]);

  const handleSubmitRef = useRef<() => void>(() => {});

  // Timer
  useEffect(() => {
    if (phase !== "quiz" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Resolve subject name for AI prompt
  const getSubjectNameForAI = () => {
    if (selectedSubject === "__other__") return customSubject;
    if (userType === "school") {
      const sub = subjects.find((s) => s.id === selectedSubject);
      return lang === "bn" ? sub?.name_bn : sub?.name_en;
    }
    if (lang === "bn") {
      const match = staticSubjects.find((s) => s.nameEn === selectedSubject);
      return match?.nameBn || selectedSubject;
    }
    return selectedSubject;
  };

  const getChapterNameForAI = () => {
    if (userType !== "school" || selectedSubject === "__other__") return undefined;
    const ch = chapters.find((c) => c.id === selectedChapter);
    return ch ? (lang === "bn" ? ch.name_bn : ch.name_en) : undefined;
  };

  const getTopicNameForAI = () => {
    if (selectedTopic === "__other__" || selectedSubject === "__other__") return customTopic || undefined;
    if (userType !== "school") return customTopic || undefined;
    const tp = topics.find((t) => t.id === selectedTopic);
    return tp ? (lang === "bn" ? tp.name_bn : tp.name_en) : undefined;
  };

  const startQuiz = async () => {
    if (!selectedSubject || (selectedSubject === "__other__" && !customSubject.trim())) {
      toast({ title: t("Select a subject", "একটি বিষয় নির্বাচন করো"), variant: "destructive" }); return;
    }
    setPhase("loading");
    try {
      const contextHint = selectedClass === "HSC"
        ? `HSC (Class 11-12) student, Bangladesh NCTB curriculum, Group: ${selectedDepartment || "General"}`
        : userType === "university"
        ? `University level, Department: ${selectedDepartment === "__other__" ? customSubject : (getDepartment() || "General")}`
        : userType === "job"
        ? `Job preparation for ${selectedJobClass || getJobSector()} exam in Bangladesh`
        : `Class ${selectedClass} student, Bangladesh NCTB curriculum`;

      const { data, error } = await supabase.functions.invoke("quiz-engine", {
        body: {
          action: "generate",
          subject: getSubjectNameForAI(),
          chapter: getChapterNameForAI(),
          topic: getTopicNameForAI(),
          difficulty,
          questionCount: parseInt(questionCount),
          language: lang,
          contextHint,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setQuestions(data.questions);
      setAnswers({});
      setCurrentQ(0);
      setReviewing(false);
      const secs = parseInt(questionCount) * 60;
      setTimeLeft(secs);
      setTotalTime(secs);
      setPhase("quiz");
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
      setPhase("setup");
    }
  };

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("loading");
    try {
      const { data, error } = await supabase.functions.invoke("quiz-engine", {
        body: {
          action: "analyze",
          subject: getSubjectNameForAI(),
          topic: getTopicNameForAI() || getChapterNameForAI() || "",
          answers,
          questions,
          language: lang,
        },
      });
      if (error) throw error;
      setResult(data);
      setPhase("results");
      if (user) {
        supabase.from("quiz_results").insert({
          user_id: user.id,
          subject: getSubjectNameForAI(),
          chapter: getChapterNameForAI() || null,
          topic: getTopicNameForAI() || null,
          difficulty,
          question_count: parseInt(questionCount),
          score: data.score,
          correct_count: data.correct,
          total_count: data.total,
          questions: questions as any,
          answers: answers as any,
          feedback: data.feedback || null,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
      setPhase("quiz");
    }
  }, [answers, questions, lang, selectedSubject, selectedChapter, selectedTopic, customTopic, userType, subjects, chapters, topics, staticSubjects, t]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── LOCKED ──
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use Quizzes", "কুইজ ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Plus Plan Required", "প্লাস প্ল্যান প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Take topic-wise exams with instant AI feedback and earn XP!", "টপিক-ভিত্তিক পরীক্ষা দাও, তাৎক্ষণিক AI ফিডব্যাক পাও এবং XP অর্জন করো!")}</p>
        <Link to="/pricing" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Upgrade Now", "এখনই আপগ্রেড করো")}
        </Link>
      </div>
    );
  }

  // ── LOADING ──
  if (phase === "loading") {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-20 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-semibold text-foreground">{t("AI is preparing your quiz...", "AI তোমার কুইজ তৈরি করছে...")}</p>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === "results" && result) {
    const scoreColor = result.score >= 70 ? "text-green-600 dark:text-green-400" : result.score >= 40 ? "text-yellow-600 dark:text-yellow-400" : "text-destructive";
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <Card className="card-gradient border-0 shadow-glow-primary">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <Trophy className="w-14 h-14 text-secondary mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">{t("Quiz Complete!", "কুইজ শেষ!")}</h2>
            <div className={`text-6xl font-extrabold ${scoreColor}`}>{result.score}%</div>
            <p className="text-muted-foreground">{result.correct}/{result.total} {t("correct", "সঠিক")} • {t("Time used", "সময় ব্যয়")}: {formatTime(totalTime - timeLeft)}</p>
            <Progress value={result.score} className="h-3 max-w-xs mx-auto" />
          </CardContent>
        </Card>

        {result.feedback && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />{t("AI Feedback", "AI মূল্যায়ন")}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{result.feedback}</p></CardContent>
          </Card>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => { setReviewing(true); setCurrentQ(0); setPhase("quiz"); }} variant="outline" className="gap-2"><Target className="w-4 h-4" />{t("Review Answers", "উত্তর দেখো")}</Button>
          <Button onClick={() => { setPhase("setup"); setResult(null); setQuestions([]); setAnswers({}); }} className="gap-2 bg-hero-gradient text-primary-foreground"><RotateCcw className="w-4 h-4" />{t("New Quiz", "নতুন কুইজ")}</Button>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">{t("Question Breakdown", "প্রশ্ন বিশ্লেষণ")}</h3>
          {questions.map((q, i) => {
            const d = result.details.find((x) => x.id === q.id);
            return (
              <Card key={q.id} className={`border-l-4 ${d?.correct ? "border-l-green-500" : "border-l-destructive"}`}>
                <CardContent className="py-3 px-4">
                  <p className="text-sm font-medium text-foreground">{i + 1}. {q.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {d?.correct
                      ? <span className="text-green-600 dark:text-green-400">✓ {t("Correct", "সঠিক")}</span>
                      : <span className="text-destructive">✗ {t("Your answer", "তোমার উত্তর")}: {d?.userAnswer || "—"} | {t("Correct", "সঠিক")}: {d?.correctAnswer}</span>
                    }
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── QUIZ IN PROGRESS (or REVIEW) ──
  if (phase === "quiz" && questions.length > 0) {
    const q = questions[currentQ];
    const allAnswered = Object.keys(answers).length === questions.length;
    const progress = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span>{currentQ + 1}/{questions.length}</span>
          </div>
          {!reviewing && (
            <div className={`flex items-center gap-1 font-mono text-sm font-semibold ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-foreground"}`}>
              <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />

        <Card className="card-gradient">
          <CardContent className="pt-6 space-y-5">
            <h3 className="text-lg font-semibold text-foreground leading-snug">{q.question}</h3>
            <RadioGroup
              value={answers[q.id] || ""}
              onValueChange={(v) => { if (!reviewing) setAnswers((p) => ({ ...p, [q.id]: v })); }}
              className="space-y-3"
            >
              {(["A", "B", "C", "D"] as const).map((key) => {
                const isSelected = answers[q.id] === key;
                const isCorrect = reviewing && key === q.correct;
                const isWrong = reviewing && isSelected && key !== q.correct;
                return (
                  <Label
                    key={key}
                    htmlFor={`q${q.id}-${key}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isCorrect ? "border-green-500 bg-green-50 dark:bg-green-900/20" :
                      isWrong ? "border-destructive bg-red-50 dark:bg-red-900/20" :
                      isSelected ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={key} id={`q${q.id}-${key}`} disabled={reviewing} />
                    <span className="font-semibold text-muted-foreground mr-1">{key}.</span>
                    <span className="text-foreground text-sm">{q.options[key]}</span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                    {isWrong && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                  </Label>
                );
              })}
            </RadioGroup>
            {reviewing && (
              <div className="p-3 rounded-lg bg-accent/50 text-sm text-muted-foreground">
                <strong>{t("Explanation", "ব্যাখ্যা")}:</strong> {q.explanation}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between gap-3">
          <Button variant="outline" disabled={currentQ === 0} onClick={() => setCurrentQ((p) => p - 1)}>
            {t("Previous", "পূর্ববর্তী")}
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button onClick={() => setCurrentQ((p) => p + 1)} className="gap-1">
              {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4" />
            </Button>
          ) : reviewing ? (
            <Button onClick={() => { setPhase("results"); setReviewing(false); }} className="bg-hero-gradient text-primary-foreground gap-1">
              {t("Back to Results", "ফলাফলে ফিরে যাও")}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered} className="bg-hero-gradient text-primary-foreground gap-1">
              <Zap className="w-4 h-4" /> {t("Submit", "জমা দাও")}
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                i === currentQ ? "bg-primary text-primary-foreground scale-110" :
                answers[qq.id] ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── SETUP ──
  const headerIcon = userType === "university" ? <GraduationCap className="w-12 h-12 text-primary mx-auto" /> : userType === "job" ? <Briefcase className="w-12 h-12 text-primary mx-auto" /> : <Gamepad2 className="w-12 h-12 text-primary mx-auto" />;
  const headerTitle = t("AI Quiz Engine", "AI কুইজ ইঞ্জিন");
  const headerDesc = t("Select your class, subject and let AI generate a personalized quiz", "তোমার শ্রেণি, বিষয় বেছে নাও, AI তোমার জন্য কুইজ তৈরি করবে");

  const handleClassChange = (val: string) => {
    setSelectedClass(val);
    setSelectedSubject("");
    setCustomSubject("");
    setSelectedChapter("");
    setSelectedTopic("");
    setCustomTopic("");
    setSelectedJobClass("");
    setSelectedDepartment("");
    setChapters([]);
    setTopics([]);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="text-center flex-1 space-y-2">
          {headerIcon}
          <h1 className="text-2xl font-bold text-foreground">{headerTitle}</h1>
          <p className="text-muted-foreground text-sm">{headerDesc}</p>
        </div>
        <HistoryDrawer
          config={{
            table: "quiz_results",
            titleField: "subject",
            pageTitle: t("Quiz Results", "কুইজ ফলাফল"),
            icon: "🎮",
            formatSubtitle: (row: any) => `${row.correct_count}/${row.total_count} correct • ${row.difficulty}`,
            formatBadge: (row: any) => ({
              text: `${row.score}%`,
              color: row.score >= 70 ? "bg-green-500/10 text-green-600" : row.score >= 40 ? "bg-yellow-500/10 text-yellow-600" : "bg-destructive/10 text-destructive",
            }),
          }}
          onSelect={(item) => {
            setQuestions(item.questions || []);
            setAnswers(item.answers || {});
            setResult({ score: item.score, correct: item.correct_count, total: item.total_count, details: [], feedback: item.feedback || "" });
            setReviewing(true);
            setCurrentQ(0);
            setPhase("results");
          }}
        />
      </div>

      <Card className="card-gradient">
        <CardContent className="pt-6 space-y-5">
          {/* Class selection */}
          <div className="space-y-2">
            <Label className="font-semibold">{t("Class / Level", "শ্রেণি / লেভেল")} *</Label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder={t("Choose class", "শ্রেণি নির্বাচন করো")} /></SelectTrigger>
              <SelectContent>
                {QUIZ_CLASS_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{lang === "bn" ? c.bn : c.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* HSC group selection */}
          {selectedClass === "HSC" && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Group", "বিভাগ")} *</Label>
              <Select value={selectedDepartment} onValueChange={(v) => { setSelectedDepartment(v); setSelectedSubject(""); setCustomSubject(""); }}>
                <SelectTrigger><SelectValue placeholder={t("Choose group", "বিভাগ নির্বাচন করো")} /></SelectTrigger>
                <SelectContent>
                  {Object.keys(HSC_GROUPS).map((g) => (
                    <SelectItem key={g} value={g}>{g === "Science" ? t("Science", "বিজ্ঞান") : g === "Commerce" ? t("Commerce", "ব্যবসায়") : t("Arts", "মানবিক")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* University department selection */}
          {selectedClass === "University" && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Department", "বিভাগ")} *</Label>
              <Select value={selectedDepartment} onValueChange={(v) => { setSelectedDepartment(v); setSelectedSubject(""); setCustomSubject(""); }}>
                <SelectTrigger><SelectValue placeholder={t("Choose department", "বিভাগ নির্বাচন করো")} /></SelectTrigger>
                <SelectContent>
                  {UNI_DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                  <SelectItem value="__other__">📝 {t("Other (type your own)", "অন্যান্য (নিজে লিখো)")}</SelectItem>
                </SelectContent>
              </Select>
              {selectedDepartment === "__other__" && (
                <Input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={t("Type your department/subject name...", "তোমার বিভাগ/বিষয়ের নাম লিখো...")}
                  className="mt-2"
                />
              )}
            </div>
          )}

          {/* Job exam category */}
          {userType === "job" && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Exam Category", "পরীক্ষার ক্যাটাগরি")} *</Label>
              <Select value={selectedJobClass} onValueChange={(v) => { setSelectedJobClass(v); setSelectedSubject(""); setCustomSubject(""); }}>
                <SelectTrigger><SelectValue placeholder={t("Choose exam category", "পরীক্ষার ক্যাটাগরি নির্বাচন করো")} /></SelectTrigger>
                <SelectContent>
                  {JOB_CLASSES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{lang === "bn" ? c.nameBn : c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject selection */}
          <div className="space-y-2">
            <Label className="font-semibold">{t("Subject", "বিষয়")} *</Label>
            {userType === "school" ? (
              <>
                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); if (v !== "__other__") setCustomSubject(""); }}>
                  <SelectTrigger><SelectValue placeholder={t("Choose subject", "বিষয় নির্বাচন করো")} /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.icon} {lang === "bn" ? s.name_bn : s.name_en}</SelectItem>
                    ))}
                    <SelectItem value="__other__">📝 {t("Other (type your own)", "অন্যান্য (নিজে লিখো)")}</SelectItem>
                  </SelectContent>
                </Select>
                {selectedSubject === "__other__" && (
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder={t("Type subject name...", "বিষয়ের নাম লিখো...")}
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <>
                <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); if (v !== "__other__") setCustomSubject(""); }}>
                  <SelectTrigger><SelectValue placeholder={t("Choose subject", "বিষয় নির্বাচন করো")} /></SelectTrigger>
                  <SelectContent>
                    {staticSubjects.filter(s => s.nameEn !== "__other__").map((s) => (
                      <SelectItem key={s.nameEn} value={s.nameEn}>{lang === "bn" ? s.nameBn : s.nameEn}</SelectItem>
                    ))}
                    <SelectItem value="__other__">📝 {t("Other (type your own)", "অন্যান্য (নিজে লিখো)")}</SelectItem>
                  </SelectContent>
                </Select>
                {selectedSubject === "__other__" && (
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder={t("Type subject name...", "বিষয়ের নাম লিখো...")}
                    className="mt-2"
                  />
                )}
              </>
            )}
          </div>

          {/* Chapter (school only, not for __other__ subject) */}
          {userType === "school" && selectedSubject !== "__other__" && chapters.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Chapter (optional)", "অধ্যায় (ঐচ্ছিক)")}</Label>
              <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                <SelectTrigger><SelectValue placeholder={t("All chapters", "সকল অধ্যায়")} /></SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{lang === "bn" ? c.name_bn : c.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Topic */}
          {userType === "school" && selectedSubject !== "__other__" && topics.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Topic (optional)", "টপিক (ঐচ্ছিক)")}</Label>
              <Select value={selectedTopic} onValueChange={(v) => { setSelectedTopic(v); if (v !== "__other__") setCustomTopic(""); }}>
                <SelectTrigger><SelectValue placeholder={t("All topics", "সকল টপিক")} /></SelectTrigger>
                <SelectContent>
                  {topics.map((tp) => (
                    <SelectItem key={tp.id} value={tp.id}>{lang === "bn" ? tp.name_bn : tp.name_en}</SelectItem>
                  ))}
                  <SelectItem value="__other__">📝 {t("Other (type your own)", "অন্যান্য (নিজে লিখো)")}</SelectItem>
                </SelectContent>
              </Select>
              {selectedTopic === "__other__" && (
                <Input
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder={t("Type topic name...", "টপিকের নাম লিখো...")}
                  className="mt-2"
                />
              )}
            </div>
          )}

          {/* Custom topic for non-school OR school with __other__ subject */}
          {(userType !== "school" || selectedSubject === "__other__") && (
            <div className="space-y-2">
              <Label className="font-semibold">{t("Topic (optional)", "টপিক (ঐচ্ছিক)")}</Label>
              <Input
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={t("e.g. Binary Search Tree, Ohm's Law...", "যেমন: বাইনারি সার্চ ট্রি, ওহমের সূত্র...")}
              />
            </div>
          )}

          {/* Difficulty */}
          <div className="space-y-2">
            <Label className="font-semibold">{t("Difficulty", "কঠিনতা")}</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">{t("Easy", "সহজ")} 🟢</SelectItem>
                <SelectItem value="medium">{t("Medium", "মাঝারি")} 🟡</SelectItem>
                <SelectItem value="hard">{t("Hard", "কঠিন")} 🔴</SelectItem>
                <SelectItem value="mixed">{t("Mixed", "মিশ্র")} 🎯</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question count */}
          <div className="space-y-2">
            <Label className="font-semibold">{t("Number of Questions", "প্রশ্ন সংখ্যা")}</Label>
            <Select value={questionCount} onValueChange={setQuestionCount}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startQuiz} className="w-full bg-hero-gradient text-primary-foreground h-12 text-base font-bold gap-2">
            <Zap className="w-5 h-5" /> {t("Start Quiz", "কুইজ শুরু করো")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">{t("Tips", "টিপস")}</p>
            <p>{t("• Each question gets 1 minute. Timer stops on submission.", "• প্রতিটি প্রশ্নের জন্য ১ মিনিট। জমা দিলে টাইমার বন্ধ হয়।")}</p>
            <p>{t("• Answer all questions before submitting for full analysis.", "• সম্পূর্ণ বিশ্লেষণের জন্য সব প্রশ্নের উত্তর দাও।")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizzesPage;
