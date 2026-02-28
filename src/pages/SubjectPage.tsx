import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Play, FileText, ChevronRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import CourseViewer, { type CourseData } from "@/components/course/CourseViewer";

const SubjectPage = () => {
  const { subjectId } = useParams();
  const { t, lang } = useLanguage();
  const { user, profile, userPlan } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [dbChapters, setDbChapters] = useState<any[]>([]);
  const [selectedDbChapter, setSelectedDbChapter] = useState<string | null>(null);
  const [topics, setTopics] = useState<any[]>([]);

  const [course, setCourse] = useState<CourseData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chapters" | "ai-course">("ai-course");

  useEffect(() => {
    if (subjectId) fetchSubject();
  }, [subjectId]);

  useEffect(() => {
    if (selectedDbChapter) fetchTopics();
  }, [selectedDbChapter]);

  const fetchSubject = async () => {
    const [subRes, chapRes] = await Promise.all([
      supabase.from("subjects").select("*").eq("id", subjectId).single(),
      supabase.from("chapters").select("*").eq("subject_id", subjectId).order("sort_order"),
    ]);
    setSubject(subRes.data);
    setDbChapters(chapRes.data || []);
    if (subRes.data) loadAiCourse(subRes.data.name_en, subRes.data.class_level);
  };

  const loadAiCourse = async (subjectName: string, classLevel: string) => {
    const { data: cached } = await supabase
      .from("generated_courses")
      .select("chapters")
      .eq("class_level", classLevel)
      .eq("subject_name", subjectName)
      .eq("language", lang)
      .maybeSingle();

    if (cached?.chapters && typeof cached.chapters === "object" && (cached.chapters as any).course_overview) {
      setCourse(cached.chapters as unknown as CourseData);
      return;
    }
    generateAiCourse(subjectName, classLevel);
  };

  const generateAiCourse = async (subjectName: string, classLevel: string) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-course", {
        body: { classLevel, subjectName, board: profile?.board || "Dhaka", language: lang },
      });
      if (!error && data?.course?.course_overview) setCourse(data.course);
    } catch { /* silent */ }
    finally { setAiLoading(false); }
  };

  const fetchTopics = async () => {
    const { data } = await supabase.from("topics").select("*").eq("chapter_id", selectedDbChapter).order("sort_order");
    setTopics(data || []);
  };

  const canAccess = (requiredPlan: string) => {
    const planOrder = ["free", "basic", "pro", "premium"];
    return planOrder.indexOf(userPlan) >= planOrder.indexOf(requiredPlan);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to access subject content", "সাবজেক্ট কনটেন্ট ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  if (!subject) return <div className="flex items-center justify-center h-64 text-muted-foreground">{t("Loading...", "লোড হচ্ছে...")}</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{subject.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t(subject.name_en, subject.name_bn)}</h1>
          <p className="text-sm text-muted-foreground">{t(`Class ${subject.class_level}`, `শ্রেণি ${subject.class_level}`)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-border pb-2">
        <button onClick={() => setActiveTab("ai-course")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "ai-course" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          {t("AI Course", "AI কোর্স")}
        </button>
        {dbChapters.length > 0 && (
          <button onClick={() => setActiveTab("chapters")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "chapters" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
          >
            <BookOpen className="w-4 h-4 inline mr-1.5" />
            {t("Chapters", "অধ্যায়সমূহ")}
          </button>
        )}
      </div>

      {/* AI Course Tab */}
      {activeTab === "ai-course" && (
        <div>
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">{t("Designing course structure...", "কোর্সের কাঠামো ডিজাইন করছে...")}</p>
            </div>
          ) : course ? (
            <CourseViewer
              course={course}
              courseName={subject.name_en}
              classLevel={subject.class_level}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-muted-foreground">{t("No course content yet", "এখনো কোর্স নেই")}</p>
              <button onClick={() => generateAiCourse(subject.name_en, subject.class_level)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                {t("Generate Course", "কোর্স তৈরি করো")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DB Chapters Tab */}
      {activeTab === "chapters" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            {dbChapters.map((ch) => (
              <button key={ch.id} onClick={() => setSelectedDbChapter(ch.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                  selectedDbChapter === ch.id ? "border-primary bg-accent shadow-glow-primary" : "border-border card-gradient hover:border-primary/50"
                }`}
              >
                <div>
                  <span className="text-xs text-muted-foreground">{t(`Chapter ${ch.chapter_number}`, `অধ্যায় ${ch.chapter_number}`)}</span>
                  <div className="font-semibold text-sm text-foreground">{t(ch.name_en, ch.name_bn)}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
          <div className="md:col-span-2">
            {selectedDbChapter ? (
              <div className="space-y-3">
                <h2 className="font-bold text-foreground mb-3">{t("Topics", "টপিকসমূহ")}</h2>
                {topics.map((topic, i) => {
                  const locked = !canAccess(topic.requires_plan);
                  return (
                    <motion.div key={topic.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`card-gradient border border-border rounded-xl p-4 flex items-center justify-between ${locked ? "opacity-60" : "hover:shadow-glow-primary"} transition-all`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${locked ? "bg-muted" : "bg-accent"}`}>
                          {locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Play className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{t(topic.name_en, topic.name_bn)}</div>
                          {locked && <span className="text-xs text-secondary font-bold">🔒 {topic.requires_plan === "basic" ? t("Plus Plan", "প্লাস প্ল্যান") : t("Pro Plan", "প্রো প্ল্যান")}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!locked && topic.youtube_url && (
                          <a href={topic.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors"><Play className="w-4 h-4" /></a>
                        )}
                        {!locked && (
                          <Link to={`/doubt-solver?topic=${encodeURIComponent(topic.name_en)}`} className="p-2 rounded-lg bg-accent hover:bg-primary hover:text-primary-foreground transition-colors"><FileText className="w-4 h-4" /></Link>
                        )}
                        {locked && (
                          <Link to="/pricing" className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold hover:opacity-90">{t("Upgrade", "আপগ্রেড")}</Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>{t("Select a chapter to see topics", "টপিক দেখতে একটি অধ্যায় নির্বাচন করো")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
