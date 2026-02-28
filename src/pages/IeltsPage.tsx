import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import Vapi from "@vapi-ai/web";
import {
  BookOpen, Headphones, PenTool, Mic, MicOff, ChevronLeft, ChevronRight,
  Play, CheckCircle2, XCircle, Star, Trophy, TrendingUp, Target,
  Clock, Sparkles, Loader2, RefreshCw, Award, Lightbulb, BarChart3,
  ArrowRight, FileText, Volume2, Square, Phone, PhoneOff,
} from "lucide-react";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// ── Types ──
type IeltsModule = "reading" | "writing" | "speaking" | "listening";
type IeltsLevel = "4-5" | "6-7" | "8+";
type Phase = "setup" | "practice" | "result";

interface WritingTask {
  taskNumber: number;
  instruction: string;
  topic: string;
  dataDescription?: string;
  wordLimit: number;
  tips: string[];
  sampleOutline: string;
  banglaHint?: string;
}

interface WritingEval {
  taskAchievement: { score: number; feedback: string };
  coherenceCohesion: { score: number; feedback: string };
  lexicalResource: { score: number; feedback: string };
  grammaticalRange: { score: number; feedback: string };
  overallBand: number;
  wordCount: number;
  strengths: string[];
  improvements: string[];
  correctedVersion: string;
  tips: string[];
  banglaFeedback?: string;
}

interface ReadingData {
  title: string;
  passage: string;
  questions: { id: number; type: string; question: string; options?: string[]; correctAnswer: string; explanation: string }[];
  banglaHint?: string;
}

interface ListeningData {
  scenario: string;
  transcript: string;
  questions: { id: number; type: string; question: string; options?: string[]; correctAnswer: string; explanation: string }[];
  banglaHint?: string;
}

interface SpeakingEval {
  fluencyCoherence: { score: number; feedback: string };
  lexicalResource: { score: number; feedback: string };
  grammaticalRange: { score: number; feedback: string };
  pronunciation: { score: number; feedback: string };
  overallBand: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  tips: string[];
  banglaFeedback?: string;
}

const MODULE_INFO = [
  { key: "reading" as IeltsModule, icon: BookOpen, en: "Reading", bn: "রিডিং", desc_en: "Academic passages & comprehension", desc_bn: "একাডেমিক প্যাসেজ ও বোধগম্যতা", color: "text-blue-500" },
  { key: "writing" as IeltsModule, icon: PenTool, en: "Writing", bn: "রাইটিং", desc_en: "Task 1 & Task 2 essays", desc_bn: "টাস্ক ১ ও টাস্ক ২ রচনা", color: "text-green-500" },
  { key: "listening" as IeltsModule, icon: Headphones, en: "Listening", bn: "লিসেনিং", desc_en: "Audio comprehension practice", desc_bn: "শ্রবণ বোধগম্যতা অনুশীলন", color: "text-purple-500" },
  { key: "speaking" as IeltsModule, icon: Mic, en: "Speaking", bn: "স্পিকিং", desc_en: "AI Voice Interview with Vapi", desc_bn: "Vapi AI ভয়েস ইন্টারভিউ", color: "text-orange-500" },
];

const LEVELS: { value: IeltsLevel; en: string; bn: string }[] = [
  { value: "4-5", en: "Band 4-5 (Beginner)", bn: "ব্যান্ড ৪-৫ (নতুন)" },
  { value: "6-7", en: "Band 6-7 (Intermediate)", bn: "ব্যান্ড ৬-৭ (মধ্যম)" },
  { value: "8+", en: "Band 8+ (Advanced)", bn: "ব্যান্ড ৮+ (উন্নত)" },
];

// Direct IELTS Vapi credentials (requested)
const VAPI_IELTS_API_KEY = "ad4afb04-15c8-4660-878d-9162e73543ee";
const VAPI_IELTS_ASSISTANT_ID = "6cc3b8b4-ef91-4e50-83d8-cd4fb3470e17";

const IeltsPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedModule, setSelectedModule] = useState<IeltsModule | null>(null);
  const [level, setLevel] = useState<IeltsLevel>("6-7");
  const [loading, setLoading] = useState(false);

  // Writing state
  const [writingTaskType, setWritingTaskType] = useState<"task1" | "task2">("task2");
  const [writingTask, setWritingTask] = useState<WritingTask | null>(null);
  const [writingAnswer, setWritingAnswer] = useState("");
  const [writingEval, setWritingEval] = useState<WritingEval | null>(null);

  // Reading state
  const [readingData, setReadingData] = useState<ReadingData | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({});
  const [readingResults, setReadingResults] = useState<any>(null);

  // Listening state
  const [listeningData, setListeningData] = useState<ListeningData | null>(null);
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, string>>({});
  const [listeningResults, setListeningResults] = useState<any>(null);
  const [listeningPlayed, setListeningPlayed] = useState(false);
  const [listeningPlaying, setListeningPlaying] = useState(false);

  // Speaking state
  const [speakingPart, setSpeakingPart] = useState<"part1" | "part2" | "part3">("part1");
  const [speakingEval, setSpeakingEval] = useState<SpeakingEval | null>(null);

  // Vapi AI state
  const [vapiConnected, setVapiConnected] = useState(false);
  const [vapiSpeaking, setVapiSpeaking] = useState(false);
  const [vapiVolume, setVapiVolume] = useState(0);
  const vapiRef = useRef<Vapi | null>(null);
  const vapiAssistantIdRef = useRef<string>("");
  const vapiTranscriptRef = useRef<{ role: "examiner" | "student"; text: string }[]>([]);

  // Test state
  const [testDuration, setTestDuration] = useState<3 | 5 | 10>(5);
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [conversationLog, setConversationLog] = useState<{ role: "examiner" | "student"; text: string }[]>([]);
  const isTestActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listening TTS refs
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (vapiRef.current) { try { vapiRef.current.stop(); } catch {} }
      stopTTSHelper();
    };
  }, []);

  // Auto-scroll conversation log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationLog]);

  const invokeAI = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("ielts-practice", { body: { ...body, language: lang } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // ══════ VAPI AI SPEAKING ══════
  const initVapi = async () => {
    if (vapiRef.current) return vapiRef.current;

    vapiAssistantIdRef.current = VAPI_IELTS_ASSISTANT_ID;
    const vapi = new Vapi(VAPI_IELTS_API_KEY);

    vapi.on("call-start", () => {
      setVapiConnected(true);
      toast({ title: t("Connected", "সংযুক্ত"), description: t("IELTS Speaking examiner is ready", "IELTS স্পিকিং পরীক্ষক প্রস্তুত") });
    });

    vapi.on("call-end", () => {
      setVapiConnected(false);
      setVapiSpeaking(false);
      if (isTestActiveRef.current) {
        finishSpeakingTest();
      }
    });

    vapi.on("speech-start", () => setVapiSpeaking(true));
    vapi.on("speech-end", () => setVapiSpeaking(false));
    vapi.on("volume-level", (vol: number) => setVapiVolume(vol));

    vapi.on("message", (msg: any) => {
      if (msg.type === "transcript") {
        const role = msg.role === "assistant" ? "examiner" : "student";
        if (msg.transcriptType === "final" && msg.transcript?.trim()) {
          vapiTranscriptRef.current.push({ role, text: msg.transcript.trim() });
          setConversationLog([...vapiTranscriptRef.current]);
        }
      }
    });

    vapi.on("error", (err: any) => {
      console.error("Vapi error:", err);
      toast({ title: t("Voice Error", "ভয়েস ত্রুটি"), description: err?.message || "Connection issue", variant: "destructive" });
    });

    vapiRef.current = vapi;
    return vapi;
  };

  const startVapiCall = async (): Promise<boolean> => {
    vapiTranscriptRef.current = [];
    setConversationLog([]);
    try {
      const vapi = await initVapi();
      await vapi.start(vapiAssistantIdRef.current);
      return true;
    } catch (e: any) {
      console.error("Vapi start error:", e);
      toast({
        title: t("Error", "Error"),
        description: t("Could not start voice call. Check microphone permissions.", "Could not start voice call. Check microphone permissions."),
        variant: "destructive",
      });
      setIsTestActive(false);
      isTestActiveRef.current = false;
      return false;
    }
  };

  const stopVapiCall = () => {
    if (vapiRef.current) {
      try { vapiRef.current.stop(); } catch {}
    }
    setVapiConnected(false);
    setVapiSpeaking(false);
  };

  const finishSpeakingTest = async () => {
    isTestActiveRef.current = false;
    setIsTestActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const transcript = vapiTranscriptRef.current;
    if (transcript.length < 2) {
      setPhase("setup");
      toast({ title: t("Too short", "খুব ছোট"), description: t("Not enough conversation to evaluate", "মূল্যায়নের জন্য যথেষ্ট কথোপকথন হয়নি") });
      return;
    }

    setLoading(true);
    try {
      const fullConversation = transcript
        .map(e => `${e.role === "examiner" ? "Examiner" : "Candidate"}: ${e.text}`)
        .join("\n\n");
      const data = await invokeAI({
        action: "evaluate_speaking",
        module: "speaking",
        level,
        userAnswer: fullConversation,
        question: `Full IELTS Speaking ${speakingPart} test with ${transcript.filter(e => e.role === "examiner").length} questions`,
        taskType: speakingPart,
      });
      setSpeakingEval(data);
      setPhase("result");
      // Save result
      if (user) {
        supabase.from("ielts_results").insert({
          user_id: user.id, module: "speaking", level, band_score: data.overallBand,
          questions: transcript.filter(e => e.role === "examiner").map(e => ({ question: e.text })) as any,
          answers: { conversation: transcript } as any, evaluation: data as any,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
      setPhase("setup");
    } finally {
      setLoading(false);
    }
  };

  // ── Timer ──
  const startTestTimer = (durationMinutes: number) => {
    const totalSeconds = durationMinutes * 60;
    setTestTimeLeft(totalSeconds);
    timerRef.current = setInterval(() => {
      setTestTimeLeft(prev => {
        if (prev <= 1) {
          // End test
          stopVapiCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── TTS helpers (for listening module) ──
  const stopTTSHelper = () => {
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  // ── START PRACTICE ──
  const startPractice = async () => {
    if (!selectedModule) return;
    setLoading(true);
    try {
      if (selectedModule === "writing") {
        const data = await invokeAI({ action: "generate_writing_task", module: "writing", level, taskType: writingTaskType });
        setWritingTask(data);
        setWritingAnswer("");
        setWritingEval(null);
      } else if (selectedModule === "reading") {
        const data = await invokeAI({ action: "generate_passage", module: "reading", level });
        setReadingData(data);
        setReadingAnswers({});
        setReadingResults(null);
      } else if (selectedModule === "listening") {
        const data = await invokeAI({ action: "generate_listening", module: "listening", level });
        setListeningData(data);
        setListeningAnswers({});
        setListeningResults(null);
      } else if (selectedModule === "speaking") {
        // Start Vapi AI call
        isTestActiveRef.current = true;
        setIsTestActive(true);
        vapiTranscriptRef.current = [];
        setConversationLog([]);
        setSpeakingEval(null);
        const started = await startVapiCall();
        if (!started) {
          setPhase("setup");
          return;
        }
        startTestTimer(testDuration);
      }
      setPhase("practice");
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── SUBMIT HANDLERS ──
  const submitWriting = async () => {
    if (!writingAnswer.trim()) return;
    setLoading(true);
    try {
      const data = await invokeAI({ action: "evaluate_writing", module: "writing", level, userAnswer: writingAnswer, question: writingTask?.instruction });
      setWritingEval(data);
      setPhase("result");
      if (user) {
        supabase.from("ielts_results").insert({
          user_id: user.id, module: "writing", level, band_score: data.overallBand,
          questions: [{ instruction: writingTask?.instruction, topic: writingTask?.topic }] as any,
          answers: { answer: writingAnswer } as any, evaluation: data as any,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitReading = async () => {
    if (!readingData) return;
    setLoading(true);
    try {
      let correct = 0;
      const results = readingData.questions.map(q => {
        const userAns = (readingAnswers[q.id] || "").trim().toLowerCase();
        const correctAns = q.correctAnswer.toLowerCase();
        const isCorrect = userAns === correctAns || correctAns.includes(userAns);
        if (isCorrect) correct++;
        return { ...q, userAnswer: readingAnswers[q.id] || "", isCorrect };
      });
      const bandMap: Record<number, number> = { 0: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 };
      setReadingResults({ results, score: correct, total: readingData.questions.length, bandEstimate: bandMap[correct] || 5 });
      setPhase("result");
      if (user) {
        supabase.from("ielts_results").insert({
          user_id: user.id, module: "reading", level, band_score: bandMap[correct] || 5,
          questions: readingData.questions as any, answers: readingAnswers as any,
          evaluation: { score: correct, total: readingData.questions.length } as any,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitListening = async () => {
    if (!listeningData) return;
    setLoading(true);
    try {
      let correct = 0;
      const results = listeningData.questions.map(q => {
        const userAns = (listeningAnswers[q.id] || "").trim().toLowerCase();
        const correctAns = q.correctAnswer.toLowerCase();
        const isCorrect = userAns === correctAns || correctAns.includes(userAns);
        if (isCorrect) correct++;
        return { ...q, userAnswer: listeningAnswers[q.id] || "", isCorrect };
      });
      const bandMap: Record<number, number> = { 0: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 };
      setListeningResults({ results, score: correct, total: listeningData.questions.length, bandEstimate: bandMap[correct] || 5 });
      setPhase("result");
      if (user) {
        supabase.from("ielts_results").insert({
          user_id: user.id, module: "listening", level, band_score: bandMap[correct] || 5,
          questions: listeningData.questions as any, answers: listeningAnswers as any,
          evaluation: { score: correct, total: listeningData.questions.length } as any,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setPhase("setup");
    setWritingTask(null); setWritingEval(null); setWritingAnswer("");
    setReadingData(null); setReadingResults(null); setReadingAnswers({});
    setListeningData(null); setListeningResults(null); setListeningAnswers({}); setListeningPlayed(false); setListeningPlaying(false);
    setSpeakingEval(null);
    isTestActiveRef.current = false;
    setIsTestActive(false);
    setConversationLog([]);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setTestTimeLeft(0);
    stopVapiCall();
    stopTTSHelper();
  };

  const wordCount = writingAnswer.trim().split(/\s+/).filter(Boolean).length;

  // ── Band Score Display ──
  const BandBadge = ({ score }: { score: number }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
      score >= 7 ? "bg-green-500/20 text-green-400" : score >= 5.5 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
    }`}>
      Band {score.toFixed(1)}
    </span>
  );

  const ScoreBar = ({ label, score }: { label: string; score: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-foreground">{score.toFixed(1)}</span>
      </div>
      <Progress value={(score / 9) * 100} className="h-2" />
    </div>
  );

  // ═══════ SETUP PHASE ═══════
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use IELTS Prep", "IELTS প্রস্তুতি ফিচার ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Award className="w-7 h-7 text-primary" />
              {t("IELTS Preparation", "IELTS প্রস্তুতি")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Practice all 4 modules with AI-powered feedback", "AI ফিডব্যাক সহ ৪টি মডিউলে অনুশীলন করো")}
            </p>
          </div>
          <HistoryDrawer
            config={{
              table: "ielts_results",
              titleField: "module",
              pageTitle: t("IELTS Results", "IELTS ফলাফল"),
              icon: "📝",
              formatSubtitle: (row: any) => `Level: ${row.level || "N/A"}`,
              formatBadge: (row: any) => row.band_score ? ({
                text: `Band ${row.band_score}`,
                color: row.band_score >= 7 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600",
              }) : null,
            }}
            onSelect={(item) => {
              toast({ title: t("Previous IELTS result loaded", "আগের IELTS ফলাফল লোড হয়েছে"), description: `${item.module} - Band ${item.band_score || "N/A"}` });
            }}
          />
        </motion.div>

        {/* Module Selection */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {t("Select Module", "মডিউল নির্বাচন করো")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MODULE_INFO.map(m => (
              <button key={m.key} onClick={() => setSelectedModule(m.key)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  selectedModule === m.key ? "border-primary bg-primary/5 shadow-glow-primary" : "border-border hover:border-primary/40"
                }`}
              >
                <m.icon className={`w-8 h-8 mx-auto mb-2 ${m.color}`} />
                <div className="font-semibold text-foreground text-sm">{t(m.en, m.bn)}</div>
                <div className="text-xs text-muted-foreground mt-1">{t(m.desc_en, m.desc_bn)}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedModule && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Level Selection */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t("Select Level", "লেভেল নির্বাচন করো")}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map(l => (
                  <button key={l.value} onClick={() => setLevel(l.value)}
                    className={`p-3 rounded-lg border text-sm text-center transition-all ${
                      level === l.value ? "border-primary bg-primary/5 font-semibold" : "border-border hover:border-primary/40"
                    }`}
                  >{t(l.en, l.bn)}</button>
                ))}
              </div>
            </div>

            {/* Module-specific options */}
            {selectedModule === "writing" && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">{t("Task Type", "টাস্কের ধরন")}</h3>
                <div className="flex gap-2">
                  {(["task1", "task2"] as const).map(tt => (
                    <button key={tt} onClick={() => setWritingTaskType(tt)}
                      className={`flex-1 p-3 rounded-lg border text-sm text-center transition-all ${
                        writingTaskType === tt ? "border-primary bg-primary/5 font-semibold" : "border-border"
                      }`}
                    >{tt === "task1" ? t("Task 1 (Graph/Chart)", "টাস্ক ১ (গ্রাফ/চার্ট)") : t("Task 2 (Essay)", "টাস্ক ২ (রচনা)")}</button>
                  ))}
                </div>
              </div>
            )}

            {selectedModule === "speaking" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t("Speaking Part", "স্পিকিং পার্ট")}</h3>
                  <div className="flex gap-2">
                    {(["part1", "part2", "part3"] as const).map(p => (
                      <button key={p} onClick={() => setSpeakingPart(p)}
                        className={`flex-1 p-3 rounded-lg border text-sm text-center transition-all ${
                          speakingPart === p ? "border-primary bg-primary/5 font-semibold" : "border-border"
                        }`}
                      >
                        {p === "part1" ? t("Part 1: Interview", "পার্ট ১: ইন্টারভিউ") : p === "part2" ? t("Part 2: Long Turn", "পার্ট ২: লং টার্ন") : t("Part 3: Discussion", "পার্ট ৩: আলোচনা")}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("Test Duration", "পরীক্ষার সময়কাল")}
                  </h3>
                  <div className="flex gap-2">
                    {([3, 5, 10] as const).map(d => (
                      <button key={d} onClick={() => setTestDuration(d)}
                        className={`flex-1 p-3 rounded-lg border text-sm text-center transition-all ${
                          testDuration === d ? "border-primary bg-primary/5 font-semibold" : "border-border"
                        }`}
                      >
                        {d} {t("min", "মিনিট")}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                    <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {t("Powered by Vapi AI — you'll have a live voice conversation with an AI IELTS examiner. Just speak naturally!", 
                         "Vapi AI দ্বারা চালিত — তুমি AI IELTS পরীক্ষকের সাথে সরাসরি কথা বলবে। স্বাভাবিকভাবে কথা বলো!")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={startPractice} disabled={loading} className="w-full" size="lg">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : selectedModule === "speaking" ? <Phone className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {selectedModule === "speaking" ? t("Start Voice Test", "ভয়েস টেস্ট শুরু করো") : t("Start Practice", "অনুশীলন শুরু করো")}
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // ═══════ PRACTICE PHASE ═══════
  if (phase === "practice") {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={resetAll} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" /> {t("Back", "পেছনে")}
          </button>
          <BandBadge score={level === "4-5" ? 4.5 : level === "6-7" ? 6.5 : 8} />
        </div>

        {/* ── WRITING PRACTICE ── */}
        {selectedModule === "writing" && writingTask && (
          <Card className="card-gradient border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PenTool className="w-5 h-5 text-green-500" />
                {t(`Writing Task ${writingTask.taskNumber}`, `রাইটিং টাস্ক ${writingTask.taskNumber}`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap">{writingTask.instruction}</div>
              {writingTask.dataDescription && (
                <div className="bg-accent/30 rounded-lg p-3 text-sm text-muted-foreground italic">
                  📊 {writingTask.dataDescription}
                </div>
              )}
              {writingTask.banglaHint && lang === "bn" && (
                <div className="bg-primary/5 rounded-lg p-3 text-sm text-primary flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" /> {writingTask.banglaHint}
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">{t("Tips", "টিপস")}:</p>
                {writingTask.tips.map((tip, i) => <p key={i} className="text-xs text-muted-foreground">• {tip}</p>)}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-foreground">{t("Your Answer", "তোমার উত্তর")}</label>
                  <span className={`text-xs font-bold ${wordCount >= writingTask.wordLimit ? "text-green-500" : "text-muted-foreground"}`}>
                    {wordCount} / {writingTask.wordLimit}+ {t("words", "শব্দ")}
                  </span>
                </div>
                <Textarea value={writingAnswer} onChange={e => setWritingAnswer(e.target.value)} rows={12} placeholder={t("Write your answer here...", "এখানে তোমার উত্তর লেখো...")} className="text-sm" />
              </div>
              <Button onClick={submitWriting} disabled={loading || wordCount < 50} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {t("Submit for AI Evaluation", "AI মূল্যায়নের জন্য জমা দাও")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── READING PRACTICE ── */}
        {selectedModule === "reading" && readingData && (
          <div className="space-y-4">
            <Card className="card-gradient border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  {readingData.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {readingData.passage}
                </div>
                {readingData.banglaHint && lang === "bn" && (
                  <div className="mt-3 bg-primary/5 rounded-lg p-3 text-sm text-primary flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" /> {readingData.banglaHint}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-gradient border-border">
              <CardHeader><CardTitle className="text-lg">{t("Questions", "প্রশ্নসমূহ")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {readingData.questions.map(q => (
                  <div key={q.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground">Q{q.id}. {q.question}</p>
                    {q.type === "multiple_choice" && q.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name={`q-${q.id}`} value={opt} checked={readingAnswers[q.id] === opt}
                          onChange={() => setReadingAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className="accent-primary"
                        />
                        {opt}
                      </label>
                    ))}
                    {q.type === "true_false_notgiven" && ["True", "False", "Not Given"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name={`q-${q.id}`} value={opt} checked={readingAnswers[q.id] === opt}
                          onChange={() => setReadingAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className="accent-primary"
                        />
                        {opt}
                      </label>
                    ))}
                    {(q.type === "fill_blank" || q.type === "short_answer") && (
                      <input type="text" value={readingAnswers[q.id] || ""} onChange={e => setReadingAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground"
                        placeholder={t("Type your answer...", "উত্তর লেখো...")}
                      />
                    )}
                  </div>
                ))}
                <Button onClick={submitReading} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  {t("Submit Answers", "উত্তর জমা দাও")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── LISTENING PRACTICE ── */}
        {selectedModule === "listening" && listeningData && (
          <div className="space-y-4">
            <Card className="card-gradient border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Headphones className="w-5 h-5 text-purple-500" />
                  {t("Listening: ", "লিসেনিং: ")}{listeningData.scenario}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!listeningPlayed ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      listeningPlaying ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted text-muted-foreground"
                    }`}>
                      {listeningPlaying ? <Volume2 className="w-10 h-10" /> : <Headphones className="w-10 h-10" />}
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {listeningPlaying
                        ? t("Listen carefully... The audio will play only once.", "মনোযোগ দিয়ে শোনো... অডিও একবারই বাজবে।")
                        : t("Press play to start listening. You will hear the audio once, then answer the questions.", "শোনা শুরু করতে প্লে চাপো। একবার শুনে প্রশ্নের উত্তর দাও।")}
                    </p>
                    {!listeningPlaying && (
                      <Button onClick={() => {
                        setListeningPlaying(true);
                        const speakListening = async () => {
                          try {
                            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ielts-voice`, {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                              },
                              body: JSON.stringify({ action: "tts", text: listeningData.transcript, voice: "nova" }),
                            });
                            const ct = response.headers.get("content-type") || "";
                            if (response.ok && ct.includes("audio")) {
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              const audio = new Audio(url);
                              audioPlayerRef.current = audio;
                              audio.onended = () => { setListeningPlaying(false); setListeningPlayed(true); };
                              audio.onerror = () => { setListeningPlaying(false); setListeningPlayed(true); };
                              await audio.play();
                              return;
                            }
                          } catch {}
                          if ("speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(listeningData.transcript);
                            utterance.lang = "en-US";
                            utterance.rate = 0.9;
                            utterance.onend = () => { setListeningPlaying(false); setListeningPlayed(true); };
                            utterance.onerror = () => { setListeningPlaying(false); setListeningPlayed(true); };
                            window.speechSynthesis.speak(utterance);
                          } else {
                            setListeningPlaying(false);
                            setListeningPlayed(true);
                          }
                        };
                        speakListening();
                      }} size="lg" className="gap-2">
                        <Play className="w-5 h-5" /> {t("Play Audio", "অডিও চালাও")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground">{t("Audio finished. Answer the questions below.", "অডিও শেষ। নিচের প্রশ্নের উত্তর দাও।")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {listeningPlayed && (
              <Card className="card-gradient border-border">
                <CardHeader><CardTitle className="text-lg">{t("Questions", "প্রশ্নসমূহ")}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {listeningData.questions.map(q => (
                    <div key={q.id} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium text-foreground">Q{q.id}. {q.question}</p>
                      {q.type === "multiple_choice" && q.options?.map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name={`lq-${q.id}`} value={opt} checked={listeningAnswers[q.id] === opt}
                            onChange={() => setListeningAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            className="accent-primary"
                          />
                          {opt}
                        </label>
                      ))}
                      {(q.type === "fill_blank" || q.type === "short_answer") && (
                        <input type="text" value={listeningAnswers[q.id] || ""} onChange={e => setListeningAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground"
                          placeholder={t("Type your answer...", "উত্তর লেখো...")}
                        />
                      )}
                    </div>
                  ))}
                  <Button onClick={submitListening} disabled={loading} className="w-full">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {t("Submit Answers", "উত্তর জমা দাও")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── SPEAKING PRACTICE — Vapi AI Voice ── */}
        {selectedModule === "speaking" && (
          <div className="space-y-4">
            {/* Timer bar */}
            <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${vapiConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium text-foreground">
                  {t("Speaking Test", "স্পিকিং টেস্ট")} — {speakingPart.replace("part", "Part ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-foreground">
                  {Math.floor(testTimeLeft / 60)}:{String(testTimeLeft % 60).padStart(2, "0")}
                </span>
                <Button variant="destructive" size="sm" onClick={() => { stopVapiCall(); }} className="text-xs h-7 px-2">
                  <PhoneOff className="w-3 h-3 mr-1" /> {t("End", "শেষ")}
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={((testDuration * 60 - testTimeLeft) / (testDuration * 60)) * 100} className="h-1.5" />

            {/* Conversation log */}
            <div className="max-h-48 overflow-y-auto space-y-2 px-1" ref={scrollRef}>
              {conversationLog.map((entry, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${entry.role === "examiner" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    entry.role === "examiner"
                      ? "bg-muted text-foreground rounded-bl-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm"
                  }`}>
                    <p className="text-xs font-semibold mb-0.5 opacity-70">
                      {entry.role === "examiner" ? t("Examiner", "পরীক্ষক") : t("You", "তুমি")}
                    </p>
                    {entry.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Central Voice Orb */}
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="relative">
                {/* Pulse rings based on volume */}
                {vapiConnected && (
                  <>
                    <div className="absolute -inset-4 rounded-full animate-ping opacity-15 bg-primary" 
                      style={{ animationDuration: vapiSpeaking ? "1.5s" : "3s" }} />
                    <div className="absolute -inset-8 rounded-full animate-pulse opacity-10 bg-primary" 
                      style={{ animationDuration: "2.5s" }} />
                    {vapiSpeaking && (
                      <div className="absolute -inset-12 rounded-full animate-pulse opacity-5 bg-primary" 
                        style={{ animationDuration: "3s" }} />
                    )}
                  </>
                )}

                {!vapiConnected && isTestActive && (
                  <>
                    <div className="absolute -inset-2 rounded-full animate-spin border-4 border-transparent border-t-primary border-r-primary/30 opacity-60" style={{ animationDuration: "1s" }} />
                  </>
                )}

                {/* Main orb */}
                <div
                  className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                    vapiConnected
                      ? vapiSpeaking
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-destructive text-destructive-foreground scale-110"
                      : isTestActive
                      ? "bg-muted text-muted-foreground scale-95"
                      : "bg-primary text-primary-foreground"
                  }`}
                  style={vapiConnected ? { transform: `scale(${1 + vapiVolume * 0.3})` } : undefined}
                >
                  {!vapiConnected && isTestActive ? (
                    <Loader2 className="w-12 h-12 animate-spin" />
                  ) : vapiSpeaking ? (
                    <Volume2 className="w-12 h-12" />
                  ) : vapiConnected ? (
                    <Mic className="w-12 h-12" />
                  ) : (
                    <Phone className="w-12 h-12" />
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {!vapiConnected && isTestActive && t("Connecting to examiner...", "পরীক্ষকের সাথে সংযোগ করা হচ্ছে...")}
                  {vapiConnected && vapiSpeaking && t("Examiner is speaking...", "পরীক্ষক বলছেন...")}
                  {vapiConnected && !vapiSpeaking && t("Your turn — speak now", "তোমার পালা — এখন বলো")}
                  {!vapiConnected && !isTestActive && t("Call ended", "কল শেষ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {vapiConnected && t("Powered by Vapi AI", "Vapi AI দ্বারা চালিত")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════ RESULT PHASE ═══════
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          {t("Results", "ফলাফল")}
        </h2>
      </div>

      {/* ── WRITING RESULT ── */}
      {selectedModule === "writing" && writingEval && (
        <div className="space-y-4">
          <Card className="card-gradient border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("Overall Band Score", "সামগ্রিক ব্যান্ড স্কোর")}</p>
                <div className="text-4xl font-bold text-primary mt-1">{writingEval.overallBand.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">{writingEval.wordCount} {t("words", "শব্দ")}</p>
              </div>
              <div className="space-y-3">
                <ScoreBar label={t("Task Achievement", "টাস্ক অর্জন")} score={writingEval.taskAchievement.score} />
                <ScoreBar label={t("Coherence & Cohesion", "সামঞ্জস্য ও যোগসূত্র")} score={writingEval.coherenceCohesion.score} />
                <ScoreBar label={t("Lexical Resource", "শব্দভাণ্ডার")} score={writingEval.lexicalResource.score} />
                <ScoreBar label={t("Grammar Range", "ব্যাকরণ পরিসর")} score={writingEval.grammaticalRange.score} />
              </div>
            </CardContent>
          </Card>

          <Card className="card-gradient border-border">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-green-500" /> {t("Strengths", "শক্তিশালী দিক")}</h3>
              {writingEval.strengths.map((s, i) => <p key={i} className="text-sm text-muted-foreground">✅ {s}</p>)}
              <h3 className="font-semibold text-foreground flex items-center gap-2 mt-3"><TrendingUp className="w-4 h-4 text-orange-500" /> {t("Improvements", "উন্নতির জায়গা")}</h3>
              {writingEval.improvements.map((s, i) => <p key={i} className="text-sm text-muted-foreground">📝 {s}</p>)}
              {writingEval.banglaFeedback && lang === "bn" && (
                <div className="bg-primary/5 rounded-lg p-3 text-sm text-primary mt-2">{writingEval.banglaFeedback}</div>
              )}
              <h3 className="font-semibold text-foreground mt-3">{t("Model Answer Excerpt", "আদর্শ উত্তরের অংশ")}</h3>
              <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">{writingEval.correctedVersion}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── READING RESULT ── */}
      {selectedModule === "reading" && readingResults && (
        <div className="space-y-4">
          <Card className="card-gradient border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("Score", "স্কোর")}</p>
              <div className="text-4xl font-bold text-primary mt-1">{readingResults.score}/{readingResults.total}</div>
              <BandBadge score={readingResults.bandEstimate} />
            </CardContent>
          </Card>
          {readingResults.results.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-lg border ${r.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-start gap-2">
                {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Q{r.id}. {r.question}</p>
                  {!r.isCorrect && <p className="text-xs text-red-400">{t("Your answer", "তোমার উত্তর")}: {r.userAnswer || "—"}</p>}
                  <p className="text-xs text-green-400">{t("Correct", "সঠিক")}: {r.correctAnswer}</p>
                  <p className="text-xs text-muted-foreground">{r.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LISTENING RESULT ── */}
      {selectedModule === "listening" && listeningResults && (
        <div className="space-y-4">
          <Card className="card-gradient border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("Score", "স্কোর")}</p>
              <div className="text-4xl font-bold text-primary mt-1">{listeningResults.score}/{listeningResults.total}</div>
              <BandBadge score={listeningResults.bandEstimate} />
            </CardContent>
          </Card>
          {listeningResults.results.map((r: any) => (
            <div key={r.id} className={`p-3 rounded-lg border ${r.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-start gap-2">
                {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 mt-0.5" />}
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">Q{r.id}. {r.question}</p>
                  {!r.isCorrect && <p className="text-xs text-red-400">{t("Your answer", "তোমার উত্তর")}: {r.userAnswer || "—"}</p>}
                  <p className="text-xs text-green-400">{t("Correct", "সঠিক")}: {r.correctAnswer}</p>
                  <p className="text-xs text-muted-foreground">{r.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SPEAKING RESULT ── */}
      {selectedModule === "speaking" && speakingEval && (
        <div className="space-y-4">
          <Card className="card-gradient border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{t(`${testDuration}-minute Speaking Test`, `${testDuration}-মিনিটের স্পিকিং টেস্ট`)}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("Overall Band Score", "সামগ্রিক ব্যান্ড স্কোর")}</p>
                <div className="text-5xl font-bold text-primary mt-1">{speakingEval.overallBand.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground mt-1">{conversationLog.filter(e => e.role === "examiner").length} {t("questions answered", "টি প্রশ্নের উত্তর")}</p>
              </div>
              <div className="space-y-3">
                <ScoreBar label={t("Fluency & Coherence", "সাবলীলতা ও সামঞ্জস্য")} score={speakingEval.fluencyCoherence.score} />
                <ScoreBar label={t("Lexical Resource", "শব্দভাণ্ডার")} score={speakingEval.lexicalResource.score} />
                <ScoreBar label={t("Grammar Range", "ব্যাকরণ পরিসর")} score={speakingEval.grammaticalRange.score} />
                <ScoreBar label={t("Pronunciation", "উচ্চারণ")} score={speakingEval.pronunciation.score} />
              </div>
            </CardContent>
          </Card>

          {/* Conversation transcript */}
          {conversationLog.length > 0 && (
            <Card className="card-gradient border-border">
              <CardHeader><CardTitle className="text-sm">{t("Test Transcript", "টেস্ট ট্রান্সক্রিপ্ট")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                {conversationLog.map((entry, i) => (
                  <div key={i} className={`flex ${entry.role === "examiner" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                      entry.role === "examiner"
                        ? "bg-muted text-foreground rounded-bl-sm"
                        : "bg-primary text-primary-foreground rounded-br-sm"
                    }`}>
                      <p className="font-semibold opacity-70 mb-0.5">{entry.role === "examiner" ? "Examiner" : "You"}</p>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="card-gradient border-border">
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-green-500" /> {t("Strengths", "শক্তিশালী দিক")}</h3>
              {speakingEval.strengths.map((s, i) => <p key={i} className="text-sm text-muted-foreground">✅ {s}</p>)}
              <h3 className="font-semibold text-foreground flex items-center gap-2 mt-3"><TrendingUp className="w-4 h-4 text-orange-500" /> {t("Improvements", "উন্নতির জায়গা")}</h3>
              {speakingEval.improvements.map((s, i) => <p key={i} className="text-sm text-muted-foreground">📝 {s}</p>)}
              {speakingEval.banglaFeedback && lang === "bn" && (
                <div className="bg-primary/5 rounded-lg p-3 text-sm text-primary mt-2">{speakingEval.banglaFeedback}</div>
              )}
              <h3 className="font-semibold text-foreground mt-3">{t("Model Answer", "আদর্শ উত্তর")}</h3>
              <p className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-lg">{speakingEval.modelAnswer}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={() => { setPhase("practice"); if (selectedModule === "writing") { setWritingEval(null); setWritingAnswer(""); } }} variant="outline" className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" /> {t("Try Again", "আবার চেষ্টা করো")}
        </Button>
        <Button onClick={() => { resetAll(); startPractice(); }} variant="outline" className="flex-1">
          <ArrowRight className="w-4 h-4 mr-2" /> {t("New Question", "নতুন প্রশ্ন")}
        </Button>
        <Button onClick={resetAll} className="flex-1">
          {t("Back to Setup", "সেটআপে ফিরে যাও")}
        </Button>
      </div>
    </div>
  );
};

export default IeltsPage;
