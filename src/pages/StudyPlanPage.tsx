import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Lock, Brain, CalendarDays, Clock, BookOpen, Target, Upload, ChevronRight, ChevronLeft, CheckCircle2, Circle, Flame, TrendingUp, RotateCcw, Sparkles, FileText, AlertTriangle, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { format, addDays, isToday, isBefore, isAfter, differenceInDays } from "date-fns";
import { bn } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface StudyTask {
  id: string;
  plan_id: string;
  user_id: string;
  task_date: string;
  subject: string;
  chapter: string | null;
  task_type: string;
  duration_minutes: number;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

interface StudyPlan {
  id: string;
  user_id: string;
  class_level: string;
  target_exam: string;
  exam_date: string;
  daily_hours: number;
  weak_subjects: string[];
  strong_subjects: string[];
  syllabus_text: string | null;
  plan_data: any;
  status: string;
  created_at: string;
}

const SUBJECTS_LIST = [
  "বাংলা", "English", "গণিত", "পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান",
  "ইতিহাস", "ভূগোল", "তথ্য ও যোগাযোগ প্রযুক্তি", "সাধারণ বিজ্ঞান",
  "ব্যবসায় শিক্ষা", "হিসাববিজ্ঞান", "অর্থনীতি", "পৌরনীতি",
  "উচ্চতর গণিত", "পরিসংখ্যান"
];

const JOB_SUBJECTS: Record<string, string[]> = {
  BCS: ["বাংলা", "English", "গণিত", "সাধারণ জ্ঞান (বাংলাদেশ)", "সাধারণ জ্ঞান (আন্তর্জাতিক)", "সাধারণ বিজ্ঞান", "মানসিক দক্ষতা", "ভূগোল", "নৈতিকতা", "কম্পিউটার ও তথ্যপ্রযুক্তি"],
  Bank: ["বাংলা", "English", "গণিত", "সাধারণ জ্ঞান", "কম্পিউটার ও তথ্যপ্রযুক্তি", "Analytical Ability", "ব্যাংকিং জ্ঞান", "অর্থনীতি"],
  "Primary Teacher": ["বাংলা", "English", "গণিত", "সাধারণ জ্ঞান", "শিশু মনোবিজ্ঞান"],
  NTRCA: ["বাংলা", "English", "গণিত", "সাধারণ জ্ঞান", "শিক্ষা বিজ্ঞান"],
  "Private IT": ["Data Structures", "Algorithms", "System Design", "Web Development", "Database", "Networking", "Problem Solving", "Communication"],
  "Private General": ["English Communication", "Analytical Skills", "MS Office", "General Knowledge", "Industry Knowledge", "Presentation Skills"],
  default: ["বাংলা", "English", "গণিত", "সাধারণ জ্ঞান", "কম্পিউটার"],
};

const getJobSubjects = (examType: string): string[] => {
  if (examType.includes("BCS")) return JOB_SUBJECTS.BCS;
  if (examType.includes("Bank")) return JOB_SUBJECTS.Bank;
  if (examType.includes("Primary")) return JOB_SUBJECTS["Primary Teacher"];
  if (examType.includes("NTRCA")) return JOB_SUBJECTS.NTRCA;
  if (examType.includes("Software") || examType.includes("IT")) return JOB_SUBJECTS["Private IT"];
  if (examType.includes("Private")) return JOB_SUBJECTS["Private General"];
  return JOB_SUBJECTS.default;
};

const UNI_SUBJECTS_LIST: Record<string, string[]> = {
  CSE: ["Data Structures", "Algorithms", "Database", "Networks", "OS", "AI/ML", "Software Engineering", "Web Development", "Cyber Security", "Discrete Math"],
  EEE: ["Circuit Analysis", "Signal Processing", "Power Systems", "Electronics", "Control Systems", "Telecommunications", "Microprocessor", "VLSI"],
  ME: ["Thermodynamics", "Fluid Mechanics", "Solid Mechanics", "Manufacturing", "Machine Design", "Heat Transfer", "Dynamics"],
  CE: ["Structural Engineering", "Hydraulics", "Geotechnical", "Transportation", "Construction Management", "Surveying"],
  BBA: ["Management", "Marketing", "Finance", "Accounting", "HR Management", "Business Statistics", "Operations Management", "Strategic Management"],
  Economics: ["Microeconomics", "Macroeconomics", "Econometrics", "Development Economics", "International Trade", "Public Finance"],
  Physics: ["Quantum Mechanics", "Classical Mechanics", "Electromagnetism", "Statistical Physics", "Optics", "Nuclear Physics"],
  Mathematics: ["Calculus", "Linear Algebra", "Real Analysis", "Abstract Algebra", "Probability", "Differential Equations"],
  Chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Biochemistry"],
  Law: ["Constitutional Law", "Criminal Law", "Civil Law", "International Law", "Commercial Law"],
  English: ["Literature", "Linguistics", "Academic Writing", "Translation Studies", "Phonetics"],
  default: ["Core Subject 1", "Core Subject 2", "Core Subject 3", "Lab/Practical", "Thesis/Research", "Elective 1"],
};

const TASK_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string; labelBn: string }> = {
  study: { icon: "📖", color: "bg-primary/10 text-primary", label: "Study", labelBn: "পড়া" },
  revision: { icon: "🔁", color: "bg-secondary/10 text-secondary", label: "Revision", labelBn: "রিভিশন" },
  mcq: { icon: "✍️", color: "bg-accent text-accent-foreground", label: "MCQ Practice", labelBn: "MCQ অনুশীলন" },
  mock_test: { icon: "📝", color: "bg-destructive/10 text-destructive", label: "Mock Test", labelBn: "মক টেস্ট" },
};

const StudyPlanPage = () => {
  const { t, lang } = useLanguage();
  const { user, userPlan } = useAuth();
  const locked = userPlan === "free";

  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [adaptMessage, setAdaptMessage] = useState("");

  // Setup wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [classLevel, setClassLevel] = useState("");
  const [targetExam, setTargetExam] = useState("");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("3");
  const [weakSubjects, setWeakSubjects] = useState<string[]>([]);
  const [strongSubjects, setStrongSubjects] = useState<string[]>([]);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [syllabusText, setSyllabusText] = useState("");

  // Load active plan
  useEffect(() => {
    if (!user || locked) { setLoading(false); return; }
    loadActivePlan();
  }, [user, locked]);

  // Load tasks when plan or date changes
  useEffect(() => {
    if (activePlan) loadTasks();
  }, [activePlan, selectedDate]);

  // Calculate streak
  useEffect(() => {
    if (tasks.length > 0) calculateStreak();
  }, [tasks]);

  const loadActivePlan = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setActivePlan(data[0] as any);
    }
    setLoading(false);
  };

  const loadTasks = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("plan_id", activePlan!.id)
      .eq("task_date", dateStr)
      .order("sort_order");

    setTasks((data || []) as any);
  };

  const calculateStreak = async () => {
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 60; i++) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const { data } = await supabase
        .from("study_tasks")
        .select("is_completed")
        .eq("user_id", user!.id)
        .eq("task_date", dateStr);

      if (!data || data.length === 0) {
        if (i > 0) break;
        checkDate = addDays(checkDate, -1);
        continue;
      }

      const allDone = data.every((t: any) => t.is_completed);
      if (allDone) {
        currentStreak++;
        checkDate = addDays(checkDate, -1);
      } else {
        if (i > 0) break;
        checkDate = addDays(checkDate, -1);
      }
    }
    setStreak(currentStreak);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase
      .from("study_tasks")
      .update({
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: completed, completed_at: completed ? new Date().toISOString() : null } : t));

    if (completed) {
      toast({ title: t("✅ Task completed!", "✅ কাজ সম্পন্ন!") });
    }
  };

  const handleSyllabusUpload = async (file: File) => {
    setSyllabusFile(file);
    // For text extraction, read as text if possible
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const text = await file.text();
      setSyllabusText(text);
    } else {
      // For PDF/image, we'll send a note to AI about the file
      setSyllabusText(`Uploaded file: ${file.name} (${file.type}). The student has uploaded their syllabus.`);
    }
  };

  const toggleSubject = (subject: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(subject)) {
      setList(list.filter(s => s !== subject));
    } else {
      setList([...list, subject]);
    }
  };

  const generatePlan = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("study-planner", {
        body: {
          action: "generate_plan",
          classLevel,
          targetExam,
          examDate,
          dailyHours: parseFloat(dailyHours),
          weakSubjects,
          strongSubjects,
          syllabusText: syllabusText || null,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const planResult = data.result;

      // Save plan
      const { data: planData, error: planError } = await supabase
        .from("study_plans")
        .insert({
          user_id: user.id,
          class_level: classLevel,
          target_exam: targetExam,
          exam_date: examDate,
          daily_hours: parseFloat(dailyHours),
          weak_subjects: weakSubjects,
          strong_subjects: strongSubjects,
          syllabus_text: syllabusText,
          plan_data: planResult,
          status: "active",
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create daily tasks from plan
      const today = new Date();
      const taskInserts: any[] = [];

      planResult.weeks?.forEach((week: any) => {
        week.days?.forEach((day: any) => {
          const taskDate = format(addDays(today, day.day_offset), "yyyy-MM-dd");
          day.tasks?.forEach((task: any, idx: number) => {
            taskInserts.push({
              plan_id: planData.id,
              user_id: user.id,
              task_date: taskDate,
              subject: task.subject,
              chapter: task.chapter,
              task_type: task.task_type,
              duration_minutes: task.duration_minutes,
              description: task.description,
              sort_order: idx,
            });
          });
        });
      });

      if (taskInserts.length > 0) {
        const { error: taskError } = await supabase.from("study_tasks").insert(taskInserts);
        if (taskError) console.error("Task insert error:", taskError);
      }

      setActivePlan(planData as any);
      toast({ title: t("🎉 Study plan created!", "🎉 স্টাডি প্ল্যান তৈরি হয়েছে!") });
    } catch (err: any) {
      console.error(err);
      toast({ title: t("Error creating plan", "প্ল্যান তৈরিতে সমস্যা"), description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const adaptPlan = async () => {
    if (!activePlan || !user) return;

    const yesterday = format(addDays(new Date(), -1), "yyyy-MM-dd");
    const { data: incomplete } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("plan_id", activePlan.id)
      .eq("is_completed", false)
      .lte("task_date", yesterday);

    if (!incomplete || incomplete.length === 0) {
      toast({ title: t("All caught up!", "সব কাজ হয়ে গেছে! 🎉") });
      return;
    }

    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");
    const { data: upcoming } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("plan_id", activePlan.id)
      .gte("task_date", tomorrow)
      .lte("task_date", nextWeek)
      .eq("is_completed", false);

    try {
      const { data, error } = await supabase.functions.invoke("study-planner", {
        body: {
          action: "adapt_plan",
          incompleteTasks: incomplete,
          upcomingTasks: upcoming || [],
          dailyHours: activePlan.daily_hours,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const result = data.result;
      setAdaptMessage(result.message || "");

      // Insert adapted tasks
      const today = new Date();
      const adaptedInserts = result.adapted_tasks?.map((task: any, idx: number) => ({
        plan_id: activePlan.id,
        user_id: user.id,
        task_date: format(addDays(today, task.day_offset), "yyyy-MM-dd"),
        subject: task.subject,
        chapter: task.chapter,
        task_type: task.task_type,
        duration_minutes: task.duration_minutes,
        description: task.description,
        sort_order: 100 + idx,
      })) || [];

      if (adaptedInserts.length > 0) {
        await supabase.from("study_tasks").insert(adaptedInserts);
      }

      loadTasks();
      toast({ title: t("Plan adapted!", "প্ল্যান অ্যাডজাস্ট হয়েছে! 🔄") });
    } catch (err: any) {
      toast({ title: t("Error adapting plan", "প্ল্যান অ্যাডজাস্টে সমস্যা"), variant: "destructive" });
    }
  };

  const deletePlan = async () => {
    if (!activePlan) return;
    await supabase.from("study_plans").update({ status: "archived" }).eq("id", activePlan.id);
    setActivePlan(null);
    setTasks([]);
    toast({ title: t("Plan archived", "প্ল্যান আর্কাইভ হয়েছে") });
  };

  // ---- LOCKED STATE ----
  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <main className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Please sign up first to use Study Planner", "স্টাডি প্ল্যানার ব্যবহার করতে আগে সাইন আপ করুন")}</p>
            <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              {t("Sign Up", "সাইন আপ")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <main className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Plus Plan Required", "প্লাস প্ল্যান প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Upload your syllabus and let AI create your perfect study plan.", "তোমার সিলেবাস আপলোড করো এবং AI তোমার পারফেক্ট স্টাডি প্ল্যান তৈরি করুক।")}</p>
            <Link to="/pricing" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              {t("Upgrade Now", "এখনই আপগ্রেড করো")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- SETUP WIZARD ----
  if (!activePlan) {
    return <SetupWizard
      step={wizardStep} setStep={setWizardStep}
      classLevel={classLevel} setClassLevel={setClassLevel}
      targetExam={targetExam} setTargetExam={setTargetExam}
      examDate={examDate} setExamDate={setExamDate}
      dailyHours={dailyHours} setDailyHours={setDailyHours}
      weakSubjects={weakSubjects} setWeakSubjects={setWeakSubjects}
      strongSubjects={strongSubjects} setStrongSubjects={setStrongSubjects}
      syllabusText={syllabusText} setSyllabusText={setSyllabusText}
      onSyllabusUpload={handleSyllabusUpload}
      syllabusFile={syllabusFile}
      generating={generating}
      onGenerate={generatePlan}
      t={t} lang={lang}
    />;
  }

  // ---- DAILY DASHBOARD ----
  const todayTasks = tasks;
  const completedCount = todayTasks.filter(t => t.is_completed).length;
  const totalMinutes = todayTasks.reduce((s, t) => s + t.duration_minutes, 0);
  const completedMinutes = todayTasks.filter(t => t.is_completed).reduce((s, t) => s + t.duration_minutes, 0);
  const progressPercent = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;
  const daysToExam = differenceInDays(new Date(activePlan.exam_date), new Date());

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-none shadow-glow-primary">
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 text-secondary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{streak}</div>
            <div className="text-xs text-muted-foreground">{t("Day Streak", "দিনের স্ট্রিক")}</div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{daysToExam}</div>
            <div className="text-xs text-muted-foreground">{t("Days to Exam", "পরীক্ষার বাকি দিন")}</div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{completedCount}/{todayTasks.length}</div>
            <div className="text-xs text-muted-foreground">{t("Tasks Done", "কাজ সম্পন্ন")}</div>
          </CardContent>
        </Card>
        <Card className="border-none">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-secondary mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{completedMinutes}/{totalMinutes}</div>
            <div className="text-xs text-muted-foreground">{t("Minutes", "মিনিট")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Adaptive Message */}
      {adaptMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{adaptMessage}</p>
              <Button variant="ghost" size="sm" onClick={() => setAdaptMessage("")} className="shrink-0">✕</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Date Navigation */}
      <Card className="border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, -1))}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">
                {isToday(selectedDate) ? t("📌 Today's Tasks", "📌 আজকের কাজ") : format(selectedDate, "dd MMMM yyyy", { locale: lang === "bn" ? bn : undefined })}
              </h2>
              {!isToday(selectedDate) && (
                <Button variant="link" size="sm" onClick={() => setSelectedDate(new Date())} className="text-xs">
                  {t("Go to today", "আজকে যাও")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Progress value={progressPercent} className="h-2 mb-1" />
          <p className="text-xs text-muted-foreground text-right">{progressPercent}%</p>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("No tasks for this day", "এই দিনে কোনো কাজ নেই")}</p>
              </CardContent>
            </Card>
          ) : (
            todayTasks.map((task, i) => {
              const config = TASK_TYPE_CONFIG[task.task_type] || TASK_TYPE_CONFIG.study;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`transition-all ${task.is_completed ? "opacity-60" : "shadow-sm hover:shadow-md"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className={`text-xs ${config.color}`}>
                              {config.icon} {lang === "bn" ? config.labelBn : config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {task.duration_minutes} {t("min", "মিনিট")}
                            </span>
                          </div>
                          <h4 className={`font-semibold text-foreground ${task.is_completed ? "line-through" : ""}`}>
                            {task.subject} {task.chapter && `— ${task.chapter}`}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* All done celebration */}
      {todayTasks.length > 0 && progressPercent === 100 && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-secondary mx-auto mb-2" />
              <h3 className="text-xl font-bold text-foreground">{t("All tasks completed! 🎉", "সব কাজ শেষ! 🎉")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("Great job! See you tomorrow.", "দারুণ! কাল আবার দেখা হবে।")}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={adaptPlan} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> {t("Adapt Plan", "প্ল্যান অ্যাডজাস্ট করো")}
        </Button>
        <Button onClick={deletePlan} variant="ghost" className="gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" /> {t("Reset Plan", "প্ল্যান রিসেট করো")}
        </Button>
      </div>

      {/* Plan Info */}
      <Card className="border-none bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("Class", "ক্লাস")}</span>
              <p className="font-medium text-foreground">{activePlan.class_level}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Exam", "পরীক্ষা")}</span>
              <p className="font-medium text-foreground">{activePlan.target_exam}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Exam Date", "পরীক্ষার তারিখ")}</span>
              <p className="font-medium text-foreground">{activePlan.exam_date}</p>
            </div>
            <div>
              <span className="text-muted-foreground">{t("Daily Hours", "দৈনিক ঘণ্টা")}</span>
              <p className="font-medium text-foreground">{activePlan.daily_hours}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ---- SETUP WIZARD COMPONENT ----
interface WizardProps {
  step: number; setStep: (n: number) => void;
  classLevel: string; setClassLevel: (v: string) => void;
  targetExam: string; setTargetExam: (v: string) => void;
  examDate: string; setExamDate: (v: string) => void;
  dailyHours: string; setDailyHours: (v: string) => void;
  weakSubjects: string[]; setWeakSubjects: (v: string[]) => void;
  strongSubjects: string[]; setStrongSubjects: (v: string[]) => void;
  syllabusText: string; setSyllabusText: (v: string) => void;
  onSyllabusUpload: (f: File) => void;
  syllabusFile: File | null;
  generating: boolean;
  onGenerate: () => void;
  t: (en: string, bn: string) => string;
  lang: string;
}

const WIZARD_STEPS = [
  { icon: "🎓", titleEn: "Class & Exam", titleBn: "ক্লাস ও পরীক্ষা" },
  { icon: "📅", titleEn: "Schedule", titleBn: "সময়সূচি" },
  { icon: "📚", titleEn: "Subjects", titleBn: "বিষয়সমূহ" },
  { icon: "📄", titleEn: "Syllabus", titleBn: "সিলেবাস" },
];

const SetupWizard = (props: WizardProps) => {
  const { step, setStep, t, lang, generating, onGenerate } = props;

  const canNext = () => {
    if (step === 0) return props.classLevel && props.targetExam;
    if (step === 1) return props.examDate && props.dailyHours;
    if (step === 2) return props.weakSubjects.length > 0 || props.strongSubjects.length > 0;
    return true;
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Brain className="w-12 h-12 text-primary mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-foreground">{t("AI Study Planner", "AI স্টাডি প্ল্যানার")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Let AI create your perfect study plan", "AI তোমার পারফেক্ট স্টাডি প্ল্যান তৈরি করবে")}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {WIZARD_STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                i === step ? "bg-primary text-primary-foreground font-medium" :
                i < step ? "bg-primary/20 text-primary cursor-pointer" :
                "bg-muted text-muted-foreground"
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden md:inline">{lang === "bn" ? s.titleBn : s.titleEn}</span>
            </button>
            {i < WIZARD_STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-5">
              {step === 0 && (
                <>
                  <div>
                    <Label>{t("Class Level / Track", "ক্লাস / ট্র্যাক")}</Label>
                  <Select value={props.classLevel} onValueChange={v => { props.setClassLevel(v); props.setWeakSubjects([]); props.setStrongSubjects([]); }}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={t("Select class or track", "ক্লাস বা ট্র্যাক বাছাই করো")} /></SelectTrigger>
                      <SelectContent>
                        {["6", "7", "8", "9", "10", "11", "12"].map(c => (
                          <SelectItem key={c} value={c}>{t(`Class ${c}`, `ক্লাস ${c}`)}</SelectItem>
                        ))}
                        <SelectItem value="University">{t("University", "বিশ্ববিদ্যালয়")}</SelectItem>
                        <SelectItem value="Job-BCS">{t("Job: BCS Exam", "চাকরি: BCS পরীক্ষা")}</SelectItem>
                        <SelectItem value="Job-Bank">{t("Job: Bank Exam", "চাকরি: ব্যাংক পরীক্ষা")}</SelectItem>
                        <SelectItem value="Job-Primary">{t("Job: Primary Teacher", "চাকরি: প্রাইমারি শিক্ষক")}</SelectItem>
                        <SelectItem value="Job-NTRCA">{t("Job: NTRCA", "চাকরি: NTRCA")}</SelectItem>
                        <SelectItem value="Job-Private-IT">{t("Job: Private (IT/Software)", "চাকরি: বেসরকারি (IT/সফটওয়্যার)")}</SelectItem>
                        <SelectItem value="Job-Private">{t("Job: Private (General)", "চাকরি: বেসরকারি (সাধারণ)")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("Target Exam", "লক্ষ্য পরীক্ষা")}</Label>
                    <Select value={props.targetExam} onValueChange={props.setTargetExam}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={t("Select exam", "পরীক্ষা বাছাই করো")} /></SelectTrigger>
                      <SelectContent>
                        {props.classLevel.startsWith("Job") ? (
                          <>
                            <SelectItem value="Preliminary">{t("Preliminary", "প্রিলিমিনারি")}</SelectItem>
                            <SelectItem value="Written">{t("Written Exam", "লিখিত পরীক্ষা")}</SelectItem>
                            <SelectItem value="Viva">{t("Viva / Interview", "ভাইভা / ইন্টারভিউ")}</SelectItem>
                            <SelectItem value="Full Preparation">{t("Full Preparation", "সম্পূর্ণ প্রস্তুতি")}</SelectItem>
                            <SelectItem value="Model Test">{t("Model Test", "মডেল টেস্ট")}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="SSC">SSC / এসএসসি</SelectItem>
                            <SelectItem value="HSC">HSC / এইচএসসি</SelectItem>
                            <SelectItem value="Admission">{t("University Admission", "বিশ্ববিদ্যালয় ভর্তি")}</SelectItem>
                            <SelectItem value="Half-Yearly">{t("Half-Yearly", "অর্ধ-বার্ষিক")}</SelectItem>
                            <SelectItem value="Annual">{t("Annual Exam", "বার্ষিক পরীক্ষা")}</SelectItem>
                            <SelectItem value="Model Test">{t("Model Test", "মডেল টেস্ট")}</SelectItem>
                            <SelectItem value="Midterm">{t("Midterm Exam", "মিডটার্ম পরীক্ষা")}</SelectItem>
                            <SelectItem value="Final">{t("Final Exam", "ফাইনাল পরীক্ষা")}</SelectItem>
                            <SelectItem value="Semester">{t("Semester Exam", "সেমিস্টার পরীক্ষা")}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <Label>{t("Exam Date", "পরীক্ষার তারিখ")}</Label>
                    <Input type="date" value={props.examDate} onChange={e => props.setExamDate(e.target.value)} className="mt-1" min={format(new Date(), "yyyy-MM-dd")} />
                  </div>
                  <div>
                    <Label>{t("Daily Study Hours", "দৈনিক পড়াশোনার সময় (ঘণ্টা)")}</Label>
                    <Select value={props.dailyHours} onValueChange={props.setDailyHours}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["1", "1.5", "2", "2.5", "3", "4", "5", "6", "8"].map(h => (
                          <SelectItem key={h} value={h}>{h} {t("hours", "ঘণ্টা")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 2 && (() => {
                const subjectsList = props.classLevel.startsWith("Job") 
                  ? getJobSubjects(props.classLevel) 
                  : SUBJECTS_LIST;
                return (
                <>
                  <div>
                    <Label className="mb-2 block">{t("Weak Subjects (need more focus)", "দুর্বল বিষয় (বেশি সময় দরকার)")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {subjectsList.map(s => (
                        <button
                          key={`w-${s}`}
                          onClick={() => {
                            if (props.strongSubjects.includes(s)) return;
                            const list = [...props.weakSubjects];
                            if (list.includes(s)) props.setWeakSubjects(list.filter(x => x !== s));
                            else props.setWeakSubjects([...list, s]);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            props.weakSubjects.includes(s)
                              ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
                              : props.strongSubjects.includes(s)
                              ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("Strong Subjects", "শক্তিশালী বিষয়")}</Label>
                    <div className="flex flex-wrap gap-2">
                      {subjectsList.map(s => (
                        <button
                          key={`s-${s}`}
                          onClick={() => {
                            if (props.weakSubjects.includes(s)) return;
                            const list = [...props.strongSubjects];
                            if (list.includes(s)) props.setStrongSubjects(list.filter(x => x !== s));
                            else props.setStrongSubjects([...list, s]);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            props.strongSubjects.includes(s)
                              ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                              : props.weakSubjects.includes(s)
                              ? "bg-muted text-muted-foreground/50 cursor-not-allowed"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
                );
              })()}



              {step === 3 && (
                <>
                  <div>
                    <Label>{t("Upload Syllabus (Optional)", "সিলেবাস আপলোড করো (ঐচ্ছিক)")}</Label>
                    <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        id="syllabus-upload"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) props.onSyllabusUpload(f);
                        }}
                      />
                      <label htmlFor="syllabus-upload" className="cursor-pointer">
                        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {props.syllabusFile
                            ? `✅ ${props.syllabusFile.name}`
                            : t("Click to upload PDF, Image, or Text", "PDF, ছবি বা টেক্সট আপলোড করতে ক্লিক করো")}
                        </p>
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label>{t("Or type/paste syllabus topics", "অথবা সিলেবাসের বিষয় লেখো")}</Label>
                    <Textarea
                      className="mt-1"
                      rows={4}
                      placeholder={t("e.g. Math: Chapter 1-10, Physics: Mechanics, Optics...", "যেমন: গণিত: অধ্যায় ১-১০, পদার্থবিজ্ঞান: বলবিদ্যা, আলোকবিদ্যা...")}
                      value={props.syllabusText}
                      onChange={e => props.setSyllabusText(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-hero-gradient text-primary-foreground">
            {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={onGenerate} disabled={generating} className="bg-hero-gradient text-primary-foreground gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? t("Creating Plan...", "প্ল্যান তৈরি হচ্ছে...") : t("Generate Study Plan", "স্টাডি প্ল্যান তৈরি করো")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudyPlanPage;
