import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Vapi from "@vapi-ai/web";
import {
  Briefcase, Building2, GraduationCap, ChevronRight, ChevronLeft,
  MessageCircle, Mic, MicOff, Play, CheckCircle2, XCircle, Star, Trophy,
  TrendingUp, Target, Clock, Sparkles, FileText, BarChart3,
  ArrowRight, Loader2, RefreshCw, Award, AlertCircle, Lightbulb, Phone, PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// VAPI keys fetched securely from server

// ── Types ──
interface InterviewConfig {
  jobCategory: "private" | "government";
  govSubCategory: string;
  examStage: string;
  topic: string;
  language: "en" | "bn";
  questionCount: number;
  privateIndustry: string;
  privateRole: string;
}

interface QuestionData {
  question: string;
  hint: string;
  difficulty: string;
  category: string;
}

interface EvaluationData {
  score: number;
  feedback: string;
  modelAnswer: string;
  strengths: string[];
  weaknesses: string[];
  improvement: string;
}

interface HistoryEntry {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  modelAnswer: string;
  strengths: string[];
  weaknesses: string[];
  difficulty: string;
  category: string;
}

interface ReportData {
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  topicBreakdown: { topic: string; score: number; comment: string }[];
  recommendations: string[];
  readinessLevel: string;
  nextSteps: string[];
  motivationalNote: string;
}

// ── Data constants ──
const GOV_SUB_CATEGORIES = [
  { value: "bcs", en: "BCS (Bangladesh Civil Service)", bn: "বিসিএস (বাংলাদেশ সিভিল সার্ভিস)" },
  { value: "bank", en: "Bank Jobs", bn: "ব্যাংক চাকরি" },
  { value: "psc", en: "PSC / Union & District Level", bn: "পিএসসি / ইউনিয়ন ও জেলা পর্যায়" },
  { value: "education", en: "Education Ministry", bn: "শিক্ষা মন্ত্রণালয়" },
  { value: "health", en: "Health Ministry", bn: "স্বাস্থ্য মন্ত্রণালয়" },
  { value: "railways", en: "Railways", bn: "রেলওয়ে" },
  { value: "police", en: "Police / Defense", bn: "পুলিশ / প্রতিরক্ষা" },
  { value: "others", en: "Other Ministries", bn: "অন্যান্য মন্ত্রণালয়" },
];

const EXAM_STAGES: Record<string, { value: string; en: string; bn: string }[]> = {
  bcs: [
    { value: "prelims", en: "Preliminary", bn: "প্রিলিমিনারি" },
    { value: "written", en: "Written", bn: "লিখিত" },
    { value: "viva", en: "Viva Voce", bn: "ভাইভা" },
  ],
  bank: [
    { value: "written", en: "Written Exam", bn: "লিখিত পরীক্ষা" },
    { value: "viva", en: "Viva / Interview", bn: "ভাইভা / সাক্ষাৎকার" },
    { value: "english", en: "English Proficiency", bn: "ইংরেজি দক্ষতা" },
  ],
  psc: [
    { value: "written", en: "Written", bn: "লিখিত" },
    { value: "oral", en: "Oral / Viva", bn: "মৌখিক / ভাইভা" },
  ],
  default: [
    { value: "written", en: "Written", bn: "লিখিত" },
    { value: "viva", en: "Viva / Interview", bn: "ভাইভা / সাক্ষাৎকার" },
  ],
};

const TOPICS: Record<string, { value: string; en: string; bn: string }[]> = {
  bcs: [
    { value: "current_affairs", en: "Current Affairs", bn: "সমসাময়িক বিষয়" },
    { value: "bangla_literature", en: "Bangla Literature", bn: "বাংলা সাহিত্য" },
    { value: "history", en: "Bangladesh History", bn: "বাংলাদেশের ইতিহাস" },
    { value: "governance", en: "Governance & Constitution", bn: "শাসন ও সংবিধান" },
    { value: "technology", en: "Science & Technology", bn: "বিজ্ঞান ও প্রযুক্তি" },
    { value: "geography", en: "Geography & Environment", bn: "ভূগোল ও পরিবেশ" },
    { value: "economics", en: "Economics", bn: "অর্থনীতি" },
    { value: "international", en: "International Affairs", bn: "আন্তর্জাতিক বিষয়" },
    { value: "general", en: "General Knowledge", bn: "সাধারণ জ্ঞান" },
  ],
  bank: [
    { value: "general_knowledge", en: "General Knowledge", bn: "সাধারণ জ্ঞান" },
    { value: "accounting", en: "Accounting & Finance", bn: "হিসাবরক্ষণ ও অর্থায়ন" },
    { value: "computer", en: "Computer Literacy", bn: "কম্পিউটার সাক্ষরতা" },
    { value: "reasoning", en: "Reasoning & Aptitude", bn: "যুক্তি ও দক্ষতা" },
    { value: "english", en: "English Language", bn: "ইংরেজি ভাষা" },
    { value: "banking", en: "Banking Knowledge", bn: "ব্যাংকিং জ্ঞান" },
    { value: "economics", en: "Economics", bn: "অর্থনীতি" },
  ],
  default: [
    { value: "general", en: "General Knowledge", bn: "সাধারণ জ্ঞান" },
    { value: "current_affairs", en: "Current Affairs", bn: "সমসাময়িক বিষয়" },
    { value: "subject_specific", en: "Subject Specific", bn: "বিষয় ভিত্তিক" },
  ],
};

const PRIVATE_INDUSTRIES = [
  { value: "software_it", en: "Software & IT", bn: "সফটওয়্যার ও আইটি" },
  { value: "electronics", en: "Electronics & Engineering", bn: "ইলেকট্রনিক্স ও ইঞ্জিনিয়ারিং" },
  { value: "banking_finance", en: "Banking & Finance", bn: "ব্যাংকিং ও ফিন্যান্স" },
  { value: "telecom", en: "Telecommunications", bn: "টেলিকমিউনিকেশন" },
  { value: "fmcg", en: "FMCG", bn: "এফএমসিজি" },
  { value: "pharma", en: "Pharmaceuticals", bn: "ফার্মাসিউটিক্যালস" },
  { value: "garments", en: "Garments & Textile", bn: "গার্মেন্টস ও টেক্সটাইল" },
  { value: "ecommerce", en: "E-commerce", bn: "ই-কমার্স" },
  { value: "consulting", en: "Consulting", bn: "কনসাল্টিং" },
  { value: "media", en: "Media & Marketing", bn: "মিডিয়া ও মার্কেটিং" },
  { value: "ngo", en: "NGO / Development", bn: "এনজিও / উন্নয়ন" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

const PRIVATE_ROLES = [
  { value: "software_engineer", en: "Software Engineer", bn: "সফটওয়্যার ইঞ্জিনিয়ার" },
  { value: "business_analyst", en: "Business Analyst", bn: "বিজনেস অ্যানালিস্ট" },
  { value: "marketing", en: "Marketing Executive", bn: "মার্কেটিং এক্সিকিউটিভ" },
  { value: "hr", en: "HR Officer", bn: "এইচআর অফিসার" },
  { value: "accountant", en: "Accountant", bn: "হিসাবরক্ষক" },
  { value: "sales", en: "Sales Manager", bn: "সেলস ম্যানেজার" },
  { value: "project_manager", en: "Project Manager", bn: "প্রজেক্ট ম্যানেজার" },
  { value: "data_analyst", en: "Data Analyst", bn: "ডাটা অ্যানালিস্ট" },
  { value: "designer", en: "Designer", bn: "ডিজাইনার" },
  { value: "operations", en: "Operations Manager", bn: "অপারেশনস ম্যানেজার" },
  { value: "management_trainee", en: "Management Trainee", bn: "ম্যানেজমেন্ট ট্রেইনি" },
  { value: "other", en: "Other", bn: "অন্যান্য" },
];

const QUESTION_COUNTS = [5, 7, 10, 15];

// ── Component ──
const MockInterviewPage = () => {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const answerRef = useRef<HTMLTextAreaElement>(null);

  // Phases: "setup" | "interviewing" | "answering" | "evaluated" | "report" | "voiceViva" | "voiceVivaReport"
  const [phase, setPhase] = useState<"setup" | "interviewing" | "answering" | "evaluated" | "report" | "voiceViva" | "voiceVivaReport">("setup");
  const [setupStep, setSetupStep] = useState(0); // 0-3 for multi-step config
  const [config, setConfig] = useState<InterviewConfig>({
    jobCategory: "government",
    govSubCategory: "",
    examStage: "",
    topic: "",
    language: (lang as "en" | "bn") || "bn",
    questionCount: 7,
    privateIndustry: "",
    privateRole: "",
  });

  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice Viva state
  const vapiRef = useRef<Vapi | null>(null);
  const [vapiConnected, setVapiConnected] = useState(false);
  const [vapiSpeaking, setVapiSpeaking] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState<{ role: string; text: string }[]>([]);
  const voiceTranscriptRef = useRef<{ role: string; text: string }[]>([]);
  const [voiceTimeLeft, setVoiceTimeLeft] = useState(0);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [voiceVivaLoading, setVoiceVivaLoading] = useState(false);
  const [voiceVivaReport, setVoiceVivaReport] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer for answering
  useEffect(() => {
    if (phase === "answering" && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    }
    if (phase === "answering" && timeLeft === 0 && currentQuestion) {
      // Auto-submit if time runs out
      if (userAnswer.trim()) handleEvaluate();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, timeLeft]);

  const selectClass = "w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-ring outline-none text-sm";

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "ask_question",
          ...config,
          questionNumber,
          totalQuestions: config.questionCount,
          conversationHistory: history,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCurrentQuestion(data);
      setPhase("answering");
      setUserAnswer("");
      setTimeLeft(config.examStage === "prelims" ? 60 : 120); // 1 or 2 min
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [config, questionNumber, history]);

  const handleEvaluate = useCallback(async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate_answer",
          ...config,
          currentQuestion: currentQuestion.question,
          userAnswer,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEvaluation(data);
      setHistory(prev => [...prev, {
        question: currentQuestion.question,
        answer: userAnswer,
        score: data.score || 0,
        feedback: data.feedback || "",
        modelAnswer: data.modelAnswer || "",
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        difficulty: currentQuestion.difficulty,
        category: currentQuestion.category,
      }]);
      setPhase("evaluated");
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [currentQuestion, userAnswer, config]);

  const handleNextQuestion = () => {
    if (questionNumber >= config.questionCount) {
      generateReport();
    } else {
      setQuestionNumber(q => q + 1);
      setEvaluation(null);
      setCurrentQuestion(null);
      setPhase("interviewing");
    }
  };

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "generate_report",
          ...config,
          conversationHistory: history,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data);
      setPhase("report");
      // Save interview results
      if (user) {
        supabase.from("mock_interview_results").insert({
          user_id: user.id,
          config: config as any,
          questions: history.map(h => ({ question: h.question, difficulty: h.difficulty, category: h.category })) as any,
          history: history as any,
          overall_score: data.overallScore || 0,
          total_questions: config.questionCount,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [config, history]);

  const startInterview = () => {
    setPhase("interviewing");
    setQuestionNumber(1);
    setHistory([]);
    setReport(null);
    setEvaluation(null);
    setCurrentQuestion(null);
  };

  // ── Voice Viva with Vapi ──
  const startVoiceViva = () => {
    setPhase("voiceViva");
    setVoiceTranscript([]);
    voiceTranscriptRef.current = [];
    setVoiceVivaReport(null);
    setVoiceTimeLeft(15 * 60); // 15 min session
    initVapiAndStart();
  };

  const initVapiAndStart = async () => {
    try {
      // Fetch VAPI key from server
      const { data: vapiData, error: vapiError } = await supabase.functions.invoke("vapi-token", {
        body: { type: "interview" },
      });
      if (vapiError || !vapiData?.apiKey) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Could not get voice credentials", "ভয়েস ক্রেডেনশিয়াল পাওয়া যায়নি"), variant: "destructive" });
        return;
      }

      const vapi = new Vapi(vapiData.apiKey);
      
      vapi.on("call-start", () => {
        setVapiConnected(true);
        // Start timer
        voiceTimerRef.current = setInterval(() => {
          setVoiceTimeLeft(prev => {
            if (prev <= 1) {
              endVoiceViva();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      });

      vapi.on("call-end", () => {
        setVapiConnected(false);
        setVapiSpeaking(false);
        if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      });

      vapi.on("speech-start", () => setVapiSpeaking(true));
      vapi.on("speech-end", () => setVapiSpeaking(false));
      vapi.on("volume-level", (level: number) => setVoiceVolume(level));

      vapi.on("message", (msg: any) => {
        if (msg.type === "transcript" && msg.transcriptType === "final" && msg.transcript?.trim()) {
          const role = msg.role === "assistant" ? "examiner" : "candidate";
          const entry = { role, text: msg.transcript.trim() };
          voiceTranscriptRef.current = [...voiceTranscriptRef.current, entry];
          setVoiceTranscript([...voiceTranscriptRef.current]);
        }
      });

      vapiRef.current = vapi;
      vapi.start(vapiData.assistantId);
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    }
  };

  const endVoiceViva = async () => {
    if (vapiRef.current) {
      try { vapiRef.current.stop(); } catch {}
      vapiRef.current = null;
    }
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    setVapiConnected(false);
    setVapiSpeaking(false);

    // Generate report from transcript
    const transcript = voiceTranscriptRef.current;
    if (transcript.length < 2) {
      toast({ title: t("Too Short", "খুব ছোট"), description: t("The viva session was too short to evaluate.", "মূল্যায়ন করার জন্য ভাইভা সেশন খুব ছোট ছিল।"), variant: "destructive" });
      setPhase("setup");
      return;
    }

    setVoiceVivaLoading(true);
    setPhase("voiceVivaReport");

    try {
      const conversationHistory = transcript.map((t, i) => ({
        question: t.role === "examiner" ? t.text : "",
        answer: t.role === "candidate" ? t.text : "",
        score: 0,
        feedback: "",
      })).filter(h => h.question || h.answer);

      // Build Q&A pairs
      const qaPairs: { question: string; answer: string; score: number; feedback: string }[] = [];
      let currentQ = "";
      for (const entry of transcript) {
        if (entry.role === "examiner") {
          if (currentQ && qaPairs.length > 0) {
            // Previous question had no answer
          }
          currentQ = entry.text;
        } else if (entry.role === "candidate" && currentQ) {
          qaPairs.push({ question: currentQ, answer: entry.text, score: 0, feedback: "" });
          currentQ = "";
        }
      }

      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "generate_report",
          jobCategory: "government",
          govSubCategory: "bcs",
          examStage: "viva",
          language: config.language,
          conversationHistory: qaPairs,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVoiceVivaReport(data);

      // Save to DB
      if (user) {
        supabase.from("mock_interview_results").insert({
          user_id: user.id,
          config: { jobCategory: "government", govSubCategory: "bcs", examStage: "viva", language: config.language, mode: "voice" } as any,
          questions: qaPairs.map(q => ({ question: q.question, difficulty: "viva", category: "BCS Viva Voice" })) as any,
          history: qaPairs as any,
          overall_score: data.overallScore || 0,
          total_questions: qaPairs.length,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
      setPhase("setup");
    } finally {
      setVoiceVivaLoading(false);
    }
  };

  // Cleanup Vapi on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) { try { vapiRef.current.stop(); } catch {} }
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [voiceTranscript]);

  const resetAll = () => {
    setPhase("setup");
    setSetupStep(0);
    setQuestionNumber(1);
    setHistory([]);
    setReport(null);
    setEvaluation(null);
    setCurrentQuestion(null);
    setVoiceTranscript([]);
    setVoiceVivaReport(null);
    if (vapiRef.current) { try { vapiRef.current.stop(); } catch {} vapiRef.current = null; }
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
  };

  // Fetch question when entering interviewing phase
  useEffect(() => {
    if (phase === "interviewing") fetchQuestion();
  }, [phase, questionNumber]);

  const getStages = () => EXAM_STAGES[config.govSubCategory] || EXAM_STAGES.default;
  const getTopics = () => TOPICS[config.govSubCategory] || TOPICS.default;

  const canProceedSetup = () => {
    if (setupStep === 0) return !!config.jobCategory;
    if (setupStep === 1) {
      if (config.jobCategory === "government") return !!config.govSubCategory;
      return !!config.privateIndustry && !!config.privateRole;
    }
    if (setupStep === 2) {
      if (config.jobCategory === "government") return !!config.examStage;
      return true;
    }
    return true;
  };

  const avgScore = history.length > 0 ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length * 10) : 0;

  // ── SETUP PHASE ──
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use Mock Interview", "মক ইন্টারভিউ ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageCircle className="w-7 h-7 text-primary" />
              {t("AI Mock Interview", "AI মক ইন্টারভিউ")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Practice with AI-powered realistic interviews for any job", "যেকোনো চাকরির জন্য AI-চালিত বাস্তবসম্মত ইন্টারভিউ অনুশীলন করো")}
            </p>
          </div>
          <HistoryDrawer
            config={{
              table: "mock_interview_results",
              titleField: "config",
              pageTitle: t("Interview Results", "ইন্টারভিউ ফলাফল"),
              icon: "🎤",
              formatSubtitle: (row: any) => `${row.total_questions} questions`,
              formatBadge: (row: any) => ({
                text: `Score: ${row.overall_score}%`,
                color: row.overall_score >= 70 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600",
              }),
            }}
            onSelect={(item) => {
              setConfig(item.config || config);
              setHistory(item.history || []);
              setReport({ overallScore: item.overall_score, grade: "", summary: "", strengths: [], weaknesses: [], topicBreakdown: [], recommendations: [], readinessLevel: "", nextSteps: [], motivationalNote: "" });
              setPhase("report");
            }}
          />
        </motion.div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i === setupStep ? "bg-primary text-primary-foreground scale-110" :
                i < setupStep ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>{i + 1}</div>
              {i < 3 && <div className={`w-6 h-0.5 ${i < setupStep ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card className="card-gradient border-border shadow-glow-primary">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              <motion.div key={setupStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

                {setupStep === 0 && (
                  <>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      {t("Select Job Category", "চাকরির ধরন নির্বাচন করো")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { value: "government" as const, icon: Building2, en: "Government (সরকারি)", bn: "সরকারি চাকরি", desc: t("BCS, Bank, PSC & more", "বিসিএস, ব্যাংক, পিএসসি ও আরো") },
                        { value: "private" as const, icon: Briefcase, en: "Private Sector", bn: "বেসরকারি চাকরি", desc: t("Corporate, IT, Business", "কর্পোরেট, আইটি, ব্যবসা") },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setConfig(c => ({ ...c, jobCategory: opt.value, govSubCategory: "", examStage: "", privateIndustry: "", privateRole: "" }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            config.jobCategory === opt.value ? "border-primary bg-primary/5 shadow-glow-primary" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <opt.icon className={`w-6 h-6 mb-2 ${config.jobCategory === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="font-semibold text-foreground">{t(opt.en, opt.bn)}</div>
                          <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {setupStep === 1 && config.jobCategory === "government" && (
                  <>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      {t("Select Government Job Type", "সরকারি চাকরির ধরন নির্বাচন করো")}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {GOV_SUB_CATEGORIES.map(opt => (
                        <button key={opt.value} onClick={() => setConfig(c => ({ ...c, govSubCategory: opt.value, examStage: "" }))}
                          className={`p-3 rounded-lg border text-left text-sm transition-all ${
                            config.govSubCategory === opt.value ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/40"
                          }`}
                        >
                          {t(opt.en, opt.bn)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {setupStep === 1 && config.jobCategory === "private" && (
                  <>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      {t("Select Industry & Role", "শিল্পখাত ও পদ নির্বাচন করো")}
                    </h3>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Industry", "শিল্পখাত")} *</label>
                      <select value={config.privateIndustry} onChange={e => setConfig(c => ({ ...c, privateIndustry: e.target.value }))} className={selectClass}>
                        <option value="">{t("Select industry", "শিল্পখাত নির্বাচন করো")}</option>
                        {PRIVATE_INDUSTRIES.map(o => <option key={o.value} value={o.value}>{t(o.en, o.bn)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Target Role", "লক্ষ্য পদ")} *</label>
                      <select value={config.privateRole} onChange={e => setConfig(c => ({ ...c, privateRole: e.target.value }))} className={selectClass}>
                        <option value="">{t("Select role", "পদ নির্বাচন করো")}</option>
                        {PRIVATE_ROLES.map(o => <option key={o.value} value={o.value}>{t(o.en, o.bn)}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {setupStep === 2 && (
                  <>
                    {config.jobCategory === "government" && (
                      <div>
                        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                          <Target className="w-5 h-5 text-primary" />
                          {t("Select Exam Stage", "পরীক্ষার ধাপ নির্বাচন করো")}
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {getStages().map(s => (
                            <button key={s.value} onClick={() => setConfig(c => ({ ...c, examStage: s.value }))}
                              className={`p-3 rounded-lg border text-sm text-center transition-all ${
                                config.examStage === s.value ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/40"
                              }`}
                            >{t(s.en, s.bn)}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-primary" />
                        {t("Topic Focus", "টপিক ফোকাস")}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button onClick={() => setConfig(c => ({ ...c, topic: "" }))}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${!config.topic ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}
                        >{t("Mixed / All", "মিশ্র / সব")}</button>
                        {(config.jobCategory === "government" ? getTopics() : []).map(tp => (
                          <button key={tp.value} onClick={() => setConfig(c => ({ ...c, topic: tp.value }))}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-all ${config.topic === tp.value ? "border-primary bg-primary/10 font-semibold" : "border-border"}`}
                          >{t(tp.en, tp.bn)}</button>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">{t("Or type your own topic", "অথবা নিজের টপিক লেখো")}</label>
                        <input
                          type="text"
                          value={config.topic && !getTopics().some(tp => tp.value === config.topic) && config.topic !== "" ? config.topic : ""}
                          onChange={e => setConfig(c => ({ ...c, topic: e.target.value }))}
                          placeholder={t("e.g. Bangladesh Liberation War, Monetary Policy...", "যেমন: বাংলাদেশের মুক্তিযুদ্ধ, মুদ্রানীতি...")}
                          className="mt-1 w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-ring outline-none text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                {setupStep === 3 && (
                  <>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {t("Interview Settings", "ইন্টারভিউ সেটিংস")}
                    </h3>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Language", "ভাষা")}</label>
                      <div className="flex gap-2 mt-1">
                        {[
                          { value: "bn" as const, label: "বাংলা" },
                          { value: "en" as const, label: "English" },
                        ].map(l => (
                          <button key={l.value} onClick={() => setConfig(c => ({ ...c, language: l.value }))}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                              config.language === l.value ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >{l.label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Number of Questions", "প্রশ্ন সংখ্যা")}</label>
                      <div className="flex gap-2 mt-1">
                        {QUESTION_COUNTS.map(n => (
                          <button key={n} onClick={() => setConfig(c => ({ ...c, questionCount: n }))}
                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                              config.questionCount === n ? "border-primary bg-primary/5" : "border-border"
                            }`}
                          >{n}</button>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-accent/30 rounded-xl p-4 space-y-1 mt-4">
                      <p className="text-sm font-semibold text-foreground">{t("Interview Summary", "ইন্টারভিউ সারাংশ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.jobCategory === "government"
                          ? `${GOV_SUB_CATEGORIES.find(c => c.value === config.govSubCategory)?.[lang === "bn" ? "bn" : "en"] || ""} → ${getStages().find(s => s.value === config.examStage)?.[lang === "bn" ? "bn" : "en"] || ""}`
                          : `${PRIVATE_INDUSTRIES.find(i => i.value === config.privateIndustry)?.[lang === "bn" ? "bn" : "en"] || ""} → ${PRIVATE_ROLES.find(r => r.value === config.privateRole)?.[lang === "bn" ? "bn" : "en"] || ""}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">{config.questionCount} {t("questions", "প্রশ্ন")} • {config.language === "bn" ? "বাংলা" : "English"}</p>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setSetupStep(s => s - 1)} disabled={setupStep === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
              </Button>
              {setupStep < 3 ? (
                <Button onClick={() => setSetupStep(s => s + 1)} disabled={!canProceedSetup()}>
                  {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <div className="flex gap-2">
                  {config.jobCategory === "government" && config.govSubCategory === "bcs" && config.examStage === "viva" && (
                    <Button onClick={startVoiceViva} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700">
                      <Mic className="w-4 h-4 mr-1" />
                      {t("🎙 Voice Viva", "🎙 ভয়েস ভাইভা")}
                    </Button>
                  )}
                  <Button onClick={startInterview} className="bg-hero-gradient text-primary-foreground">
                    <Play className="w-4 h-4 mr-1" />
                    {t("Start Interview", "ইন্টারভিউ শুরু করো")}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── INTERVIEW / ANSWERING / EVALUATED PHASE ──
  if (phase === "interviewing" || phase === "answering" || phase === "evaluated") {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t(`Question ${questionNumber} of ${config.questionCount}`, `প্রশ্ন ${questionNumber}/${config.questionCount}`)}
            </h2>
            <p className="text-xs text-muted-foreground">
              {config.jobCategory === "government"
                ? `${GOV_SUB_CATEGORIES.find(c => c.value === config.govSubCategory)?.[lang === "bn" ? "bn" : "en"]} • ${getStages().find(s => s.value === config.examStage)?.[lang === "bn" ? "bn" : "en"]}`
                : `${PRIVATE_INDUSTRIES.find(i => i.value === config.privateIndustry)?.[lang === "bn" ? "bn" : "en"]} • ${PRIVATE_ROLES.find(r => r.value === config.privateRole)?.[lang === "bn" ? "bn" : "en"]}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">{t("Avg Score", "গড় স্কোর")}: {avgScore}%</div>
          </div>
        </div>

        <Progress value={(questionNumber / config.questionCount) * 100} className="h-2" />

        {/* Loading question */}
        {loading && !currentQuestion && (
          <Card className="card-gradient border-border">
            <CardContent className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("AI Interviewer is preparing your question...", "AI ইন্টারভিউয়ার প্রশ্ন প্রস্তুত করছে...")}</p>
            </CardContent>
          </Card>
        )}

        {/* Question + Answer */}
        {currentQuestion && (phase === "answering" || phase === "evaluated") && (
          <Card className="card-gradient border-border">
            <CardContent className="pt-5 space-y-4">
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      currentQuestion.difficulty === "hard" ? "bg-destructive/10 text-destructive" :
                      currentQuestion.difficulty === "medium" ? "bg-secondary/10 text-secondary" :
                      "bg-primary/10 text-primary"
                    }`}>{currentQuestion.difficulty?.toUpperCase()}</span>
                    <span className="text-[10px] text-muted-foreground">{currentQuestion.category}</span>
                  </div>
                  <p className="text-foreground font-medium">{currentQuestion.question}</p>
                  {currentQuestion.hint && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> {currentQuestion.hint}
                    </p>
                  )}
                </div>
              </div>

              {/* Answer area */}
              {phase === "answering" && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">{t("Your Answer", "তোমার উত্তর")}</label>
                    <div className={`flex items-center gap-1 text-xs font-mono ${timeLeft < 30 ? "text-destructive" : "text-muted-foreground"}`}>
                      <Clock className="w-3 h-3" />
                      {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                    </div>
                  </div>
                  <Textarea
                    ref={answerRef}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    placeholder={t("Type your answer here... Be detailed and confident.", "তোমার উত্তর এখানে লেখো... বিস্তারিত ও আত্মবিশ্বাসী হও।")}
                    className="min-h-[120px] text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleEvaluate} disabled={loading || !userAnswer.trim()} className="flex-1 bg-hero-gradient text-primary-foreground">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      {t("Submit Answer", "উত্তর জমা দাও")}
                    </Button>
                    <Button variant="outline" onClick={() => { setUserAnswer(t("I don't know / Skip", "আমি জানি না / স্কিপ")); }} disabled={loading}>
                      {t("Skip", "স্কিপ")}
                    </Button>
                  </div>
                </>
              )}

              {/* Evaluation result */}
              {phase === "evaluated" && evaluation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Your answer */}
                  <div className="bg-accent/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{t("Your Answer:", "তোমার উত্তর:")}</p>
                    <p className="text-sm text-foreground">{userAnswer}</p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-center gap-4 py-3">
                    <div className={`text-4xl font-bold ${evaluation.score >= 7 ? "text-primary" : evaluation.score >= 5 ? "text-secondary" : "text-destructive"}`}>
                      {evaluation.score}/10
                    </div>
                    <div className="flex">
                      {Array.from({ length: 10 }, (_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < evaluation.score ? "text-secondary fill-secondary" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-sm text-foreground">{evaluation.feedback}</p>
                  </div>

                  {/* Model Answer */}
                  <div className="bg-accent/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3" /> {t("Model Answer:", "আদর্শ উত্তর:")}
                    </p>
                    <p className="text-sm text-foreground">{evaluation.modelAnswer}</p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/5 rounded-lg p-2">
                      <p className="text-xs font-semibold text-primary mb-1">✅ {t("Strengths", "শক্তি")}</p>
                      {evaluation.strengths?.map((s, i) => <p key={i} className="text-xs text-foreground">• {s}</p>)}
                    </div>
                    <div className="bg-destructive/5 rounded-lg p-2">
                      <p className="text-xs font-semibold text-destructive mb-1">⚠️ {t("Improve", "উন্নতি")}</p>
                      {evaluation.weaknesses?.map((w, i) => <p key={i} className="text-xs text-foreground">• {w}</p>)}
                    </div>
                  </div>

                  {/* Improvement tip */}
                  {evaluation.improvement && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-accent/30 rounded-lg p-2">
                      <Lightbulb className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <span>{evaluation.improvement}</span>
                    </div>
                  )}

                  <Button onClick={handleNextQuestion} className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {questionNumber >= config.questionCount
                      ? t("Generate Performance Report", "পারফরম্যান্স রিপোর্ট তৈরি করো")
                      : t("Next Question", "পরবর্তী প্রশ্ন")
                    }
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── REPORT PHASE ──
  if (phase === "report" && report) {
    const scoreColor = report.overallScore >= 70 ? "text-primary" : report.overallScore >= 50 ? "text-secondary" : "text-destructive";
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="card-gradient border-border shadow-glow-primary">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-xl">{t("Performance Report", "পারফরম্যান্স রিপোর্ট")}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {config.jobCategory === "government"
                  ? `${GOV_SUB_CATEGORIES.find(c => c.value === config.govSubCategory)?.[lang === "bn" ? "bn" : "en"]} • ${getStages().find(s => s.value === config.examStage)?.[lang === "bn" ? "bn" : "en"]}`
                  : `${PRIVATE_INDUSTRIES.find(i => i.value === config.privateIndustry)?.[lang === "bn" ? "bn" : "en"]} • ${PRIVATE_ROLES.find(r => r.value === config.privateRole)?.[lang === "bn" ? "bn" : "en"]}`}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Overall Score */}
              <div className="text-center py-4">
                <div className={`text-6xl font-bold ${scoreColor}`}>{report.overallScore}<span className="text-lg text-muted-foreground">/100</span></div>
                <div className="text-2xl font-bold text-foreground mt-1">{t("Grade", "গ্রেড")}: {report.grade}</div>
                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                  report.readinessLevel === "Excellent" || report.readinessLevel === "Interview Ready"
                    ? "bg-primary/10 text-primary"
                    : report.readinessLevel === "Almost Ready"
                      ? "bg-secondary/10 text-secondary"
                      : "bg-destructive/10 text-destructive"
                }`}>
                  {report.readinessLevel}
                </span>
              </div>

              {/* Summary */}
              <div className="bg-accent/30 rounded-xl p-4">
                <p className="text-sm text-foreground">{report.summary}</p>
              </div>

              {/* Topic Breakdown */}
              {report.topicBreakdown?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {t("Topic Breakdown", "টপিক বিশ্লেষণ")}
                  </h3>
                  <div className="space-y-2">
                    {report.topicBreakdown.map((tb, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground font-medium">{tb.topic}</span>
                          <span className="text-muted-foreground">{tb.score}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${tb.score}%` }} transition={{ duration: 1, delay: i * 0.15 }}
                            className={`h-full rounded-full ${tb.score >= 70 ? "bg-primary" : tb.score >= 50 ? "bg-secondary" : "bg-destructive"}`}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{tb.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {t("Strengths", "শক্তিশালী দিক")}
                  </h4>
                  {report.strengths?.map((s, i) => <p key={i} className="text-xs text-foreground mb-1">• {s}</p>)}
                </div>
                <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
                  <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {t("Weaknesses", "দুর্বল দিক")}
                  </h4>
                  {report.weaknesses?.map((w, i) => <p key={i} className="text-xs text-foreground mb-1">• {w}</p>)}
                </div>
              </div>

              {/* Recommendations */}
              {report.recommendations?.length > 0 && (
                <div className="bg-accent/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-secondary" /> {t("Recommendations", "সুপারিশ")}
                  </h4>
                  {report.recommendations.map((r, i) => <p key={i} className="text-xs text-foreground mb-1">📌 {r}</p>)}
                </div>
              )}

              {/* Next Steps */}
              {report.nextSteps?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">{t("Next Steps", "পরবর্তী পদক্ষেপ")}</h4>
                  {report.nextSteps.map((ns, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <p className="text-xs text-foreground">{ns}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Motivational Note */}
              {report.motivationalNote && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 text-center border border-primary/10">
                  <Sparkles className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <p className="text-sm font-medium text-foreground italic">"{report.motivationalNote}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={resetAll} variant="outline" className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-1" /> {t("New Interview", "নতুন ইন্টারভিউ")}
                </Button>
                <Button onClick={() => { resetAll(); startInterview(); }} className="flex-1 bg-hero-gradient text-primary-foreground">
                  <Play className="w-4 h-4 mr-1" /> {t("Retry Same", "আবার চেষ্টা")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── VOICE VIVA PHASE ──
  if (phase === "voiceViva") {
    const mins = Math.floor(voiceTimeLeft / 60);
    const secs = voiceTimeLeft % 60;
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Mic className="w-6 h-6 text-primary" />
                {t("BCS Voice Viva", "বিসিএস ভয়েস ভাইভা")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("Live AI-powered BCS Viva Board", "লাইভ AI চালিত বিসিএস ভাইভা বোর্ড")}</p>
            </div>
            <div className={`text-sm font-mono font-bold ${voiceTimeLeft < 120 ? "text-destructive" : "text-foreground"}`}>
              <Clock className="w-4 h-4 inline mr-1" />
              {mins}:{String(secs).padStart(2, "0")}
            </div>
          </div>

          {/* Voice Orb */}
          <Card className="card-gradient border-border">
            <CardContent className="py-8 flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div
                  animate={{
                    scale: vapiConnected ? 1 + voiceVolume * 0.5 : 1,
                    boxShadow: vapiSpeaking
                      ? "0 0 40px 15px hsl(var(--primary) / 0.3)"
                      : vapiConnected
                        ? "0 0 20px 8px hsl(var(--primary) / 0.15)"
                        : "0 0 0px 0px transparent",
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                >
                  {vapiSpeaking ? (
                    <MessageCircle className="w-12 h-12 text-primary-foreground animate-pulse" />
                  ) : vapiConnected ? (
                    <Mic className="w-12 h-12 text-primary-foreground" />
                  ) : (
                    <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                  )}
                </motion.div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {!vapiConnected
                  ? t("Connecting to Viva Board...", "ভাইভা বোর্ডে সংযোগ হচ্ছে...")
                  : vapiSpeaking
                    ? t("🎙 Examiner is speaking...", "🎙 পরীক্ষক কথা বলছেন...")
                    : t("🎤 Your turn — speak now", "🎤 তোমার পালা — এখন বলো")}
              </p>

              <Button
                onClick={endVoiceViva}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                {t("End Viva Session", "ভাইভা সেশন শেষ করো")}
              </Button>
            </CardContent>
          </Card>

          {/* Live Transcript */}
          {voiceTranscript.length > 0 && (
            <Card className="card-gradient border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {t("Live Transcript", "লাইভ ট্রান্সক্রিপ্ট")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={scrollRef} className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {voiceTranscript.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${entry.role === "examiner" ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                        entry.role === "examiner"
                          ? "bg-primary/10 text-foreground"
                          : "bg-accent text-foreground"
                      }`}>
                        <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">
                          {entry.role === "examiner" ? t("Examiner", "পরীক্ষক") : t("You", "তুমি")}
                        </span>
                        {entry.text}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    );
  }

  // ── VOICE VIVA REPORT PHASE ──
  if (phase === "voiceVivaReport") {
    if (voiceVivaLoading) {
      return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto">
          <Card className="card-gradient border-border">
            <CardContent className="py-16 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("Evaluating your BCS Viva performance...", "তোমার বিসিএস ভাইভা পারফরম্যান্স মূল্যায়ন করা হচ্ছে...")}</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (voiceVivaReport) {
      const scoreColor = voiceVivaReport.overallScore >= 70 ? "text-primary" : voiceVivaReport.overallScore >= 50 ? "text-secondary" : "text-destructive";
      return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="card-gradient border-border shadow-glow-primary">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-xl">{t("🎙 BCS Voice Viva Report", "🎙 বিসিএস ভয়েস ভাইভা রিপোর্ট")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-center py-4">
                  <div className={`text-6xl font-bold ${scoreColor}`}>{voiceVivaReport.overallScore}<span className="text-lg text-muted-foreground">/100</span></div>
                  {voiceVivaReport.grade && <div className="text-2xl font-bold text-foreground mt-1">{t("Grade", "গ্রেড")}: {voiceVivaReport.grade}</div>}
                  {voiceVivaReport.readinessLevel && (
                    <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                      voiceVivaReport.readinessLevel === "Excellent" || voiceVivaReport.readinessLevel === "Interview Ready"
                        ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                    }`}>{voiceVivaReport.readinessLevel}</span>
                  )}
                </div>

                {voiceVivaReport.summary && (
                  <div className="bg-accent/30 rounded-xl p-4">
                    <p className="text-sm text-foreground">{voiceVivaReport.summary}</p>
                  </div>
                )}

                {/* Transcript review */}
                {voiceTranscript.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-primary" /> {t("Session Transcript", "সেশন ট্রান্সক্রিপ্ট")}
                    </h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-1.5 bg-accent/20 rounded-lg p-3">
                      {voiceTranscript.map((entry, i) => (
                        <div key={i} className="text-xs">
                          <span className={`font-bold ${entry.role === "examiner" ? "text-primary" : "text-secondary"}`}>
                            {entry.role === "examiner" ? t("Examiner", "পরীক্ষক") : t("You", "তুমি")}:
                          </span>{" "}
                          <span className="text-foreground">{entry.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {voiceVivaReport.strengths?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                      <h4 className="text-sm font-semibold text-primary mb-2">✅ {t("Strengths", "শক্তিশালী দিক")}</h4>
                      {voiceVivaReport.strengths.map((s: string, i: number) => <p key={i} className="text-xs text-foreground mb-1">• {s}</p>)}
                    </div>
                    {voiceVivaReport.weaknesses?.length > 0 && (
                      <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
                        <h4 className="text-sm font-semibold text-destructive mb-2">⚠️ {t("Weaknesses", "দুর্বল দিক")}</h4>
                        {voiceVivaReport.weaknesses.map((w: string, i: number) => <p key={i} className="text-xs text-foreground mb-1">• {w}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {voiceVivaReport.recommendations?.length > 0 && (
                  <div className="bg-accent/30 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">📌 {t("Recommendations", "সুপারিশ")}</h4>
                    {voiceVivaReport.recommendations.map((r: string, i: number) => <p key={i} className="text-xs text-foreground mb-1">• {r}</p>)}
                  </div>
                )}

                {voiceVivaReport.motivationalNote && (
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 text-center border border-primary/10">
                    <Sparkles className="w-5 h-5 text-secondary mx-auto mb-1" />
                    <p className="text-sm font-medium text-foreground italic">"{voiceVivaReport.motivationalNote}"</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button onClick={resetAll} variant="outline" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-1" /> {t("New Interview", "নতুন ইন্টারভিউ")}
                  </Button>
                  <Button onClick={startVoiceViva} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                    <Mic className="w-4 h-4 mr-1" /> {t("Retry Voice Viva", "আবার ভয়েস ভাইভা")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }
  }

  return null;
};

export default MockInterviewPage;
