import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { getSubjectsForUser, DEPT_SUBJECTS, type SubjectItem } from "@/data/nctbSubjects";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import CourseViewer, { type CourseData } from "@/components/course/CourseViewer";

const SubjectsPage = () => {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();

  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(false);

  // Extract subject group from interests array (Science, Arts, Commerce)
  const getSubjectGroup = () => {
    if (!profile?.interests) return null;
    const groups = ["Science", "Arts", "Commerce"];
    return profile.interests.find((i: string) => groups.includes(i)) || null;
  };

  // Extract department from interests for university students
  const getDept = () => {
    if (!profile?.interests) return null;
    return profile.interests.find((i: string) => Object.keys(DEPT_SUBJECTS).includes(i)) || null;
  };

  const classLevel = profile?.class_level || "9";
  const { subjects, label, labelBn } = getSubjectsForUser(
    classLevel,
    profile?.is_job_candidate,
    profile?.job_sector, // sorkari or besorkari
    profile?.is_ielts_candidate,
    getDept(),
    getSubjectGroup()
  );

  const handleSelectSubject = async (sub: SubjectItem) => {
    setSelectedSubject(sub);
    setCourse(null);
    setLoading(true);

    try {
      const { data: cached } = await supabase
        .from("generated_courses")
        .select("chapters")
        .eq("class_level", classLevel)
        .eq("subject_name", sub.nameEn)
        .eq("language", lang)
        .maybeSingle();

      if (cached?.chapters && typeof cached.chapters === "object" && (cached.chapters as any).course_overview) {
        setCourse(cached.chapters as unknown as CourseData);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-course", {
        body: {
          classLevel,
          subjectName: sub.nameEn,
          board: profile?.board || "NCTB",
          language: lang,
        },
      });
      if (!error && data?.course?.course_overview) {
        setCourse(data.course);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleCourseUpdate = (updated: CourseData) => {
    setCourse(updated);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to access subjects and AI courses", "বিষয় ও AI কোর্স ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  if (selectedSubject) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <button
          onClick={() => { setSelectedSubject(null); setCourse(null); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Back to Subjects", "বিষয়সমূহে ফিরে যাও")}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{selectedSubject.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t(selectedSubject.nameEn, selectedSubject.nameBn)}</h1>
            <p className="text-sm text-muted-foreground">{t(label, labelBn)}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">{t("Designing course structure...", "কোর্সের কাঠামো ডিজাইন করছে...")}</p>
          </div>
        ) : course ? (
          <CourseViewer
            course={course}
            courseName={selectedSubject.nameEn}
            classLevel={classLevel}
            onCourseUpdate={handleCourseUpdate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-muted-foreground">{t("Failed to load course. Try again.", "কোর্স লোড করা যায়নি। আবার চেষ্টা করো।")}</p>
            <button
              onClick={() => handleSelectSubject(selectedSubject)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              {t("Retry", "আবার চেষ্টা")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t("Subjects", "বিষয়সমূহ")}</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t(label, labelBn)} — {t(`${subjects.length} subjects available`, `${subjects.length}টি বিষয় আছে`)}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subjects.map((sub, i) => (
          <motion.button
            key={`${sub.nameEn}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => handleSelectSubject(sub)}
            className="card-gradient border border-border rounded-xl p-5 text-center hover:shadow-glow-primary hover:-translate-y-1 transition-all group"
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{sub.icon}</span>
            <span className="font-semibold text-sm text-foreground">{t(sub.nameEn, sub.nameBn)}</span>
            {sub.type && (
              <span className={`block text-xs mt-1.5 px-2 py-0.5 rounded-full mx-auto w-fit ${
                sub.type === "math" ? "bg-blue-500/10 text-blue-500" :
                sub.type === "coding" ? "bg-green-500/10 text-green-500" :
                sub.type === "language" ? "bg-purple-500/10 text-purple-500" :
                "bg-muted text-muted-foreground"
              }`}>
                {sub.type === "math" ? "📐 Math" : sub.type === "coding" ? "💻 Coding" : sub.type === "language" ? "🌐 Language" : "📖 Theory"}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SubjectsPage;
