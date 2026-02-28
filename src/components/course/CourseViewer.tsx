import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Target, Clock, ChevronDown, ChevronUp, Loader2, Sparkles,
  GraduationCap, CheckCircle, Trophy, Lightbulb, Brain, Zap, AlertTriangle,
  Play, FileText, MessageSquare, Award, ArrowRight, Flame, Eye, PenTool, Star, Plus
} from "lucide-react";
import { LessonView } from "./LessonView";
import { ModuleAssessment } from "./ModuleAssessment";

export interface CourseOverview {
  title: string;
  description: string;
  learning_outcomes: string[];
  prerequisites: string[];
  target_audience: string;
  capstone_project: string;
  career_value: string;
  total_hours: number;
  module_count: number;
}

export interface CourseModule {
  module_number: number;
  title: string;
  hook: string;
  objectives: string[];
  key_concepts: string[];
  lesson_titles: string[];
  difficulty: string;
  estimated_hours: number;
  industry_connection: string;
  common_mistakes: string;
  insider_tip: string;
}

export interface CourseData {
  course_overview: CourseOverview;
  modules: CourseModule[];
}

// Lesson content types (loaded on demand)
export interface LessonHook {
  motivation: string;
  real_life_example: string;
  learning_promise: string;
}

export interface Definition {
  term: string;
  definition: string;
}

export interface LessonConcept {
  simple_explanation: string;
  deeper_explanation: string;
  technical_notes: string;
  definitions: Definition[];
}

export interface WorkedExample {
  problem: string;
  solution_steps: string[];
  answer: string;
}

export interface LessonVisual {
  diagram_description: string;
  analogy: string;
  worked_example: WorkedExample;
}

export interface LessonPractical {
  scenario: string;
  walkthrough: string;
}

export interface LessonPractice {
  task: string;
  hints: string[];
  expected_outcome: string;
}

export interface LessonRecap {
  key_takeaways: string[];
  memory_anchors: string[];
}

export interface Lesson {
  lesson_number: number;
  title: string;
  estimated_minutes: number;
  hook: LessonHook;
  concept: LessonConcept;
  visual: LessonVisual;
  practical: LessonPractical;
  practice: LessonPractice;
  recap: LessonRecap;
}

export interface AssessmentMCQ {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface ChallengeProblem {
  problem: string;
  hints: string[];
  solution: string;
}

export interface ModuleAssessmentData {
  concept_mcqs: AssessmentMCQ[];
  application_mcqs: AssessmentMCQ[];
  challenge_problem: ChallengeProblem;
  project_task: string;
}

export interface ModuleEngagement {
  surprise_insight: string;
  common_mistake: string;
  real_failure_example: string;
  insider_tip: string;
}

export interface ModuleContent {
  module_title: string;
  module_summary: string;
  lessons: Lesson[];
  assessment: ModuleAssessmentData;
  engagement: ModuleEngagement;
}

interface CourseViewerProps {
  course: CourseData;
  courseName: string;
  classLevel: string;
  onCourseUpdate?: (course: CourseData) => void;
}

const CourseViewer = ({ course, courseName, classLevel, onCourseUpdate }: CourseViewerProps) => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [moduleContents, setModuleContents] = useState<Record<number, ModuleContent>>({});
  const [loadingModule, setLoadingModule] = useState<number | null>(null);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [showAssessment, setShowAssessment] = useState<number | null>(null);
  const [tone, setTone] = useState<string>("academic");
  const [depth, setDepth] = useState<string>("standard");
  const [loadingMoreModules, setLoadingMoreModules] = useState(false);
  const [loadingMoreLessons, setLoadingMoreLessons] = useState<number | null>(null);

  const loadModuleContent = async (mod: CourseModule) => {
    if (moduleContents[mod.module_number]) return;
    setLoadingModule(mod.module_number);
    try {
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: {
          courseName,
          moduleTitle: mod.title,
          moduleNumber: mod.module_number,
          lessonTitles: mod.lesson_titles,
          objectives: mod.objectives,
          keyConcepts: mod.key_concepts,
          classLevel,
          language: lang,
          depth,
          tone,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.moduleContent) {
        setModuleContents(prev => ({ ...prev, [mod.module_number]: data.moduleContent }));
        setActiveLesson(0);
      }
    } catch (err: any) {
      toast({ title: t("Error", "ত্রুটি"), description: err.message, variant: "destructive" });
    } finally {
      setLoadingModule(null);
    }
  };

  const handleExpandModule = (idx: number) => {
    const isExpanding = expandedModule !== idx;
    setExpandedModule(isExpanding ? idx : null);
    setActiveLesson(null);
    setShowAssessment(null);
    if (isExpanding) {
      loadModuleContent(course.modules[idx]);
    }
  };

  // Generate more modules
  const handleLearnMoreModules = async () => {
    setLoadingMoreModules(true);
    try {
      const existingModules = course.modules.map(m => m.title);
      const nextModuleNum = course.modules.length + 1;
      const { data, error } = await supabase.functions.invoke("generate-course", {
        body: {
          subject: courseName,
          classLevel,
          language: lang,
          extraModules: true,
          existingModules,
          startModuleNumber: nextModuleNum,
          moduleCount: 3,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.modules?.length > 0) {
        const updatedCourse = {
          ...course,
          modules: [...course.modules, ...data.modules],
          course_overview: { ...course.course_overview, module_count: course.modules.length + data.modules.length },
        };
        onCourseUpdate?.(updatedCourse);
        toast({ title: t("New modules added!", "নতুন মডিউল যোগ হয়েছে!"), description: `${data.modules.length} ${t("more modules generated", "আরো মডিউল তৈরি হয়েছে")}` });
      }
    } catch (err: any) {
      toast({ title: t("Error", "ত্রুটি"), description: err.message, variant: "destructive" });
    } finally {
      setLoadingMoreModules(false);
    }
  };

  // Generate more lessons for a specific module
  const handleLearnMoreLessons = async (mod: CourseModule) => {
    const modNum = mod.module_number;
    setLoadingMoreLessons(modNum);
    try {
      const existing = moduleContents[modNum];
      const existingLessonTitles = existing?.lessons?.map(l => l.title) || mod.lesson_titles;
      const { data, error } = await supabase.functions.invoke("generate-lesson", {
        body: {
          courseName,
          moduleTitle: mod.title,
          moduleNumber: modNum,
          lessonTitles: [`Deep dive: Advanced ${mod.title}`, `Practice Lab: ${mod.title}`, `Real-World Case Study: ${mod.title}`],
          objectives: mod.objectives,
          keyConcepts: mod.key_concepts,
          classLevel,
          language: lang,
          depth: "advanced",
          tone,
          existingLessons: existingLessonTitles,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.moduleContent?.lessons?.length > 0) {
        const existingContent = moduleContents[modNum];
        const newLessons = data.moduleContent.lessons.map((l: any, i: number) => ({
          ...l,
          lesson_number: (existingContent?.lessons?.length || 0) + i + 1,
        }));
        setModuleContents(prev => ({
          ...prev,
          [modNum]: {
            ...existingContent,
            lessons: [...(existingContent?.lessons || []), ...newLessons],
          },
        }));
        toast({ title: t("More content added!", "আরো কন্টেন্ট যোগ হয়েছে!") });
      }
    } catch (err: any) {
      toast({ title: t("Error", "ত্রুটি"), description: err.message, variant: "destructive" });
    } finally {
      setLoadingMoreLessons(null);
    }
  };

  const getDifficultyColor = (d: string) => {
    if (d === "easy") return "text-green-500 bg-green-500/10 border-green-500/20";
    if (d === "medium") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const overview = course.course_overview;

  return (
    <div className="space-y-6">
      {/* Course Overview Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-gradient border border-border rounded-2xl p-6 md:p-8 space-y-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">{overview.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{overview.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-background rounded-xl p-3 border border-border text-center">
            <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-lg font-bold text-foreground">{course.modules.length}</span>
            <p className="text-xs text-muted-foreground">{t("Modules", "মডিউল")}</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border text-center">
            <Clock className="w-5 h-5 text-secondary mx-auto mb-1" />
            <span className="text-lg font-bold text-foreground">{overview.total_hours}</span>
            <p className="text-xs text-muted-foreground">{t("Hours", "ঘন্টা")}</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border text-center">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <span className="text-xs font-bold text-foreground">{t("Capstone", "ক্যাপস্টোন")}</span>
            <p className="text-xs text-muted-foreground truncate">{overview.capstone_project?.substring(0, 30)}...</p>
          </div>
          <div className="bg-background rounded-xl p-3 border border-border text-center">
            <Award className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-xs font-bold text-foreground">{t("Career", "ক্যারিয়ার")}</span>
            <p className="text-xs text-muted-foreground truncate">{overview.career_value?.substring(0, 30)}...</p>
          </div>
        </div>

        {/* Learning Outcomes */}
        <div>
          <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> {t("What You'll Learn", "যা শিখবে")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {overview.learning_outcomes?.map((outcome, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>

        {overview.prerequisites?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <strong>{t("Prerequisites:", "পূর্বশর্ত:")}</strong> {overview.prerequisites.join(", ")}
          </div>
        )}

        {/* Tone & Depth Controls */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("Tone", "ধরণ")}</label>
            <div className="flex gap-1">
              {[
                { id: "academic", icon: "🎓", label: t("Academic", "একাডেমিক") },
                { id: "friendly", icon: "😊", label: t("Friendly", "বন্ধুত্বপূর্ণ") },
                { id: "storytelling", icon: "📖", label: t("Story", "গল্প") },
                { id: "revision", icon: "⚡", label: t("Revision", "রিভিশন") },
              ].map(m => (
                <button key={m.id} onClick={() => setTone(m.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${tone === m.id ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">{t("Depth", "গভীরতা")}</label>
            <div className="flex gap-1">
              {[
                { id: "beginner", label: t("Beginner", "শুরু") },
                { id: "standard", label: t("Standard", "স্ট্যান্ডার্ড") },
                { id: "advanced", label: t("Advanced", "অ্যাডভান্সড") },
                { id: "research", label: t("Research", "গবেষণা") },
              ].map(d => (
                <button key={d.id} onClick={() => setDepth(d.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${depth === d.id ? "bg-primary/10 border-primary text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Module List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          {t("Course Modules", "কোর্স মডিউল")} ({course.modules.length})
        </h3>

        {course.modules.map((mod, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-gradient border border-border rounded-xl overflow-hidden"
          >
            {/* Module Header */}
            <button onClick={() => handleExpandModule(i)}
              className="w-full p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary">{mod.module_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground">{mod.title}</h3>
                    {expandedModule === i ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{mod.hook}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getDifficultyColor(mod.difficulty)}`}>{mod.difficulty}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.estimated_hours}h</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> {mod.lesson_titles.length} {t("lessons", "পাঠ")}</span>
                  </div>
                </div>
              </div>

              {/* Key concepts preview */}
              {expandedModule !== i && (
                <div className="flex flex-wrap gap-1.5 mt-3 ml-16">
                  {mod.key_concepts?.slice(0, 4).map((c, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{c}</span>
                  ))}
                </div>
              )}
            </button>

            {/* Expanded Module Content */}
            <AnimatePresence>
              {expandedModule === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-5 space-y-5">
                    {/* Module Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-background rounded-xl p-4 border border-border space-y-2">
                        <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-primary" /> {t("Objectives", "লক্ষ্য")}
                        </h5>
                        {mod.objectives?.map((obj, j) => (
                          <div key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" /> {obj}
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/20">
                          <span className="text-xs font-bold text-blue-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {t("Industry Connection", "শিল্প সংযোগ")}</span>
                          <p className="text-sm text-foreground/80 mt-1">{mod.industry_connection}</p>
                        </div>
                        <div className="bg-yellow-500/5 rounded-xl p-3 border border-yellow-500/20">
                          <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t("Common Mistake", "সাধারণ ভুল")}</span>
                          <p className="text-sm text-foreground/80 mt-1">{mod.common_mistakes}</p>
                        </div>
                        {mod.insider_tip && (
                          <div className="bg-purple-500/5 rounded-xl p-3 border border-purple-500/20">
                            <span className="text-xs font-bold text-purple-400 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {t("Insider Tip", "ইনসাইডার টিপ")}</span>
                            <p className="text-sm text-foreground/80 mt-1">{mod.insider_tip}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Loading state */}
                    {loadingModule === mod.module_number && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{t("Generating detailed lessons...", "বিস্তারিত পাঠ তৈরি হচ্ছে...")}</p>
                        <p className="text-xs text-muted-foreground/70">{t("This creates book-quality content for each lesson", "প্রতিটি পাঠের জন্য বই-মানের কন্টেন্ট তৈরি করছে")}</p>
                      </div>
                    )}

                    {/* Loaded Lessons */}
                    {moduleContents[mod.module_number] && (
                      <div className="space-y-4">
                        {moduleContents[mod.module_number].module_summary && (
                          <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
                            {moduleContents[mod.module_number].module_summary}
                          </p>
                        )}

                        {/* Lesson Tabs */}
                        <div className="flex flex-wrap gap-2">
                          {moduleContents[mod.module_number].lessons.map((lesson, li) => (
                            <button key={li} onClick={() => { setActiveLesson(li); setShowAssessment(null); }}
                              className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${activeLesson === li ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                            >
                              <Play className="w-3 h-3" /> {lesson.title}
                            </button>
                          ))}
                          <button onClick={() => { setShowAssessment(mod.module_number); setActiveLesson(null); }}
                            className={`text-xs px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${showAssessment === mod.module_number ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:border-secondary/30"}`}
                          >
                            <Trophy className="w-3 h-3" /> {t("Assessment", "মূল্যায়ন")}
                          </button>
                        </div>

                        {/* Active Lesson Content */}
                        {activeLesson !== null && moduleContents[mod.module_number].lessons[activeLesson] && (
                          <LessonView lesson={moduleContents[mod.module_number].lessons[activeLesson]} />
                        )}

                        {/* Assessment */}
                        {showAssessment === mod.module_number && (
                          <ModuleAssessment
                            assessment={moduleContents[mod.module_number].assessment}
                            engagement={moduleContents[mod.module_number].engagement}
                          />
                        )}

                        {/* Learn More in this Chapter */}
                        <button
                          onClick={() => handleLearnMoreLessons(mod)}
                          disabled={loadingMoreLessons === mod.module_number}
                          className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loadingMoreLessons === mod.module_number ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {t("Generating more lessons...", "আরো পাঠ তৈরি হচ্ছে...")}</>
                          ) : (
                            <><Plus className="w-4 h-4" /> {t("Learn More About This Topic", "এই বিষয়ে আরো জানো")}</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Reload button if content not loaded */}
                    {!moduleContents[mod.module_number] && loadingModule !== mod.module_number && (
                      <button onClick={() => loadModuleContent(mod)}
                        className="w-full py-4 rounded-xl border border-dashed border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> {t("Generate Detailed Lessons", "বিস্তারিত পাঠ তৈরি করো")}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Learn More — Generate More Modules */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={handleLearnMoreModules}
          disabled={loadingMoreModules}
          className="w-full py-4 rounded-xl bg-primary/5 border-2 border-dashed border-primary/30 text-primary text-sm font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loadingMoreModules ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {t("Generating more modules...", "আরো মডিউল তৈরি হচ্ছে...")}</>
          ) : (
            <><Plus className="w-5 h-5" /> {t("Learn More — Generate More Modules", "আরো শেখো — নতুন মডিউল তৈরি করো")}</>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default CourseViewer;
