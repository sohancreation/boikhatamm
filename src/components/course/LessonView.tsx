import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  Lightbulb, Brain, Eye, PenTool, CheckCircle, ChevronRight,
  BookOpen, Sparkles, ArrowRight, HelpCircle, Flame, MessageSquare,
  Code, Calculator, Bug, Zap, Play, AlertTriangle, ChevronDown
} from "lucide-react";
import type { Lesson } from "./CourseViewer";
import { AnswerChecker } from "./AnswerChecker";

interface LessonViewProps {
  lesson: Lesson;
}

export const LessonView = ({ lesson }: LessonViewProps) => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [depthLevel, setDepthLevel] = useState<"simple" | "deeper" | "technical">("simple");
  const [expandedMathStep, setExpandedMathStep] = useState<number | null>(null);
  const [codePhase, setCodePhase] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showBuggy, setShowBuggy] = useState(false);
  const [showMathSolutions, setShowMathSolutions] = useState<Record<number, boolean>>({});
  const [showAltApproach, setShowAltApproach] = useState(false);
  const [showMathAnswerBox, setShowMathAnswerBox] = useState<Record<number, boolean>>({});
  const [showCodingAnswerBox, setShowCodingAnswerBox] = useState(false);

  const math = (lesson as any).math;
  const coding = (lesson as any).coding;
  const hasMath = !!math;
  const hasCoding = !!coding;

  const baseSections = [
    { id: "hook", icon: Flame, label: t("Why It Matters", "কেন গুরুত্বপূর্ণ"), color: "text-orange-500" },
    { id: "concept", icon: Brain, label: t("Learn", "শেখো"), color: "text-blue-500" },
    { id: "visual", icon: Eye, label: t("Visualize", "দেখো"), color: "text-purple-500" },
  ];

  const techSections = [];
  if (hasMath) techSections.push({ id: "math", icon: Calculator, label: t("Math", "গণিত"), color: "text-red-500" });
  if (hasCoding) techSections.push({ id: "coding", icon: Code, label: t("Code", "কোড"), color: "text-emerald-500" });

  const endSections = [
    { id: "practical", icon: Sparkles, label: t("Apply", "প্রয়োগ"), color: "text-green-500" },
    { id: "practice", icon: PenTool, label: t("Practice", "অনুশীলন"), color: "text-yellow-500" },
    { id: "recap", icon: CheckCircle, label: t("Recap", "সংক্ষেপ"), color: "text-primary" },
  ];

  const sections = [...baseSections, ...techSections, ...endSections];

  const renderCodeBlock = (code: string, title?: string) => (
    <div className="rounded-xl overflow-hidden border border-border">
      {title && (
        <div className="bg-accent/50 px-4 py-2 border-b border-border">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{title}</span>
        </div>
      )}
      <pre className="bg-[hsl(var(--card))] p-4 overflow-x-auto text-sm text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );

  const currentSectionId = sections[activeSection]?.id;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-background rounded-xl border border-border overflow-hidden"
    >
      {/* Lesson Header */}
      <div className="p-4 border-b border-border bg-accent/30">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-foreground flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm flex items-center justify-center font-bold">{lesson.lesson_number}</span>
            {lesson.title}
          </h4>
          <div className="flex items-center gap-2">
            {hasMath && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-medium">📐 Math</span>}
            {hasCoding && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium">💻 Code</span>}
            <span className="text-xs text-muted-foreground">{lesson.estimated_minutes} {t("min", "মিনিট")}</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex overflow-x-auto gap-1 p-2 border-b border-border bg-accent/10">
        {sections.map((sec, i) => (
          <button key={sec.id} onClick={() => setActiveSection(i)}
            className={`text-xs px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all ${activeSection === i
              ? "bg-primary/10 text-primary font-medium border border-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <sec.icon className={`w-3.5 h-3.5 ${activeSection === i ? sec.color : ""}`} />
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="p-5">
        {/* HOOK */}
        {currentSectionId === "hook" && (
          <motion.div key="hook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-orange-500/5 rounded-xl p-5 border border-orange-500/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> {t("Why This Matters", "এটা কেন গুরুত্বপূর্ণ")}
              </h5>
              <p className="text-sm text-foreground/80 leading-relaxed">{lesson.hook?.motivation}</p>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t("Real-Life Example", "বাস্তব উদাহরণ")}</h5>
              <p className="text-sm text-foreground/80">{lesson.hook?.real_life_example}</p>
            </div>
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <h5 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-1"><ArrowRight className="w-3.5 h-3.5" /> {t("Learning Promise", "শেখার প্রতিশ্রুতি")}</h5>
              <p className="text-sm text-foreground font-medium">{lesson.hook?.learning_promise}</p>
            </div>
          </motion.div>
        )}

        {/* CONCEPT */}
        {currentSectionId === "concept" && (
          <motion.div key="concept" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex gap-1 bg-accent/50 rounded-lg p-1">
              {([
                { id: "simple" as const, label: t("Simple", "সহজ"), icon: "🌱" },
                { id: "deeper" as const, label: t("Deeper", "গভীর"), icon: "🌿" },
                { id: "technical" as const, label: t("Technical", "টেকনিক্যাল"), icon: "🌳" },
              ]).map(d => (
                <button key={d.id} onClick={() => setDepthLevel(d.id)}
                  className={`flex-1 text-xs py-2 rounded-md transition-all ${depthLevel === d.id ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}
                >
                  {d.icon} {d.label}
                </button>
              ))}
            </div>

            <div className="bg-blue-500/5 rounded-xl p-5 border border-blue-500/20">
              <h5 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500" />
                {depthLevel === "simple" ? t("Simple Explanation", "সহজ ব্যাখ্যা") :
                 depthLevel === "deeper" ? t("Deeper Explanation", "গভীর ব্যাখ্যা") :
                 t("Technical Details", "টেকনিক্যাল বিবরণ")}
              </h5>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                {depthLevel === "simple" ? lesson.concept?.simple_explanation :
                 depthLevel === "deeper" ? lesson.concept?.deeper_explanation :
                 lesson.concept?.technical_notes || lesson.concept?.deeper_explanation}
              </p>
            </div>

            {lesson.concept?.definitions?.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-primary" /> {t("Key Definitions", "মূল সংজ্ঞা")}
                </h5>
                <div className="grid gap-2">
                  {lesson.concept.definitions.map((def, j) => (
                    <div key={j} className="bg-accent/30 rounded-lg p-3 border border-border">
                      <span className="text-sm font-bold text-primary">{def.term}:</span>
                      <span className="text-sm text-foreground/80 ml-2">{def.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* VISUAL */}
        {currentSectionId === "visual" && (
          <motion.div key="visual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {lesson.visual?.analogy && (
              <div className="bg-purple-500/5 rounded-xl p-5 border border-purple-500/20">
                <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" /> {t("Analogy", "উপমা")}
                </h5>
                <p className="text-sm text-foreground/80 italic">"{lesson.visual.analogy}"</p>
              </div>
            )}
            {lesson.visual?.diagram_description && (
              <div className="bg-background rounded-xl p-5 border border-border border-dashed">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {t("Visual Diagram", "ভিজ্যুয়াল ডায়াগ্রাম")}
                </h5>
                <p className="text-sm text-foreground/70">{lesson.visual.diagram_description}</p>
              </div>
            )}
            {lesson.visual?.worked_example && (
              <div className="bg-green-500/5 rounded-xl p-5 border border-green-500/20">
                <h5 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-green-500" /> {t("Worked Example", "সমাধান উদাহরণ")}
                </h5>
                <div className="mb-3 p-3 bg-background rounded-lg border border-border">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{t("Problem", "সমস্যা")}</span>
                  <p className="text-sm text-foreground mt-1">{lesson.visual.worked_example.problem}</p>
                </div>
                <div className="space-y-2 mb-3">
                  {lesson.visual.worked_example.solution_steps?.map((step, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold flex-shrink-0">{j + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="text-xs font-bold text-green-600 uppercase">{t("Answer", "উত্তর")}</span>
                  <p className="text-sm text-foreground font-medium mt-1">{lesson.visual.worked_example.answer}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* MATH SECTION */}
        {currentSectionId === "math" && math && (
          <motion.div key="math" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Problem Statement */}
            <div className="bg-red-500/5 rounded-xl p-5 border border-red-500/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-red-500" /> {t("Problem Statement", "সমস্যা বিবৃতি")}
              </h5>
              <p className="text-sm text-foreground/90 font-medium">{math.problem_statement}</p>
            </div>

            {/* Concepts Required */}
            {math.concepts_required?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold text-muted-foreground">{t("Required:", "প্রয়োজন:")}</span>
                {math.concepts_required.map((c: string, i: number) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">{c}</span>
                ))}
              </div>
            )}

            {/* Step-by-Step Derivation */}
            {math.step_by_step_derivation?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  📝 {t("Step-by-Step Derivation", "ধাপে ধাপে সমাধান")}
                </h5>
                {math.step_by_step_derivation.map((s: any, i: number) => (
                  <div key={i} className="bg-background rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setExpandedMathStep(expandedMathStep === i ? null : i)}
                      className="w-full px-4 py-3 text-left flex items-center gap-3"
                    >
                      <span className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step || i + 1}</span>
                      <span className="text-sm font-medium text-foreground flex-1">{s.action}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedMathStep === i ? "rotate-180" : ""}`} />
                    </button>
                    {(expandedMathStep === i || true) && (
                      <div className="px-4 pb-4 pl-14 space-y-2">
                        {s.equation && (
                          <div className="bg-accent/50 rounded-lg p-3 font-mono text-sm text-foreground border border-border">
                            {s.equation}
                          </div>
                        )}
                        {s.explanation && (
                          <p className="text-xs text-muted-foreground italic">💡 {s.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Why This Works */}
            {math.why_this_works && (
              <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                <h5 className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-1">🧠 {t("Why This Method Works", "এই পদ্ধতি কেন কাজ করে")}</h5>
                <p className="text-sm text-foreground/80">{math.why_this_works}</p>
              </div>
            )}

            {/* Alternative Approach */}
            {math.alternative_approach && (
              <div>
                <button onClick={() => setShowAltApproach(!showAltApproach)}
                  className="text-xs text-primary flex items-center gap-1 hover:underline mb-2"
                >
                  <Zap className="w-3.5 h-3.5" /> {showAltApproach ? t("Hide Alternative", "বিকল্প লুকাও") : t("Show Alternative Approach", "বিকল্প পদ্ধতি দেখো")}
                </button>
                {showAltApproach && (
                  <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20 space-y-2">
                    <h5 className="text-sm font-bold text-foreground">{math.alternative_approach.method}</h5>
                    {math.alternative_approach.steps?.map((s: string, i: number) => (
                      <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-xs text-purple-500 font-bold">{i + 1}.</span> {s}
                      </p>
                    ))}
                    {math.alternative_approach.when_to_use && (
                      <p className="text-xs text-muted-foreground italic mt-2">📌 {math.alternative_approach.when_to_use}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Common Mistakes */}
            {math.common_mistakes?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> {t("Common Mistakes", "সাধারণ ভুল")}
                </h5>
                {math.common_mistakes.map((m: any, i: number) => (
                  <div key={i} className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/20 space-y-1">
                    <p className="text-sm text-foreground font-medium">❌ {m.mistake}</p>
                    <p className="text-xs text-red-500">{t("Why wrong:", "কেন ভুল:")} {m.why_wrong}</p>
                    <p className="text-xs text-green-600">✅ {m.correct_way}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Practice Problems with Answer Checker */}
            {math.practice_problems?.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">📝 {t("Practice Problems — Solve & Check", "অনুশীলন সমস্যা — সমাধান ও যাচাই")}</h5>
                {math.practice_problems.map((p: any, i: number) => (
                  <div key={i} className="bg-background rounded-xl border border-border p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.difficulty === "direct" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                        p.difficulty === "conceptual" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>{p.difficulty}</span>
                    </div>
                    <p className="text-sm text-foreground font-medium">{p.problem}</p>

                    {/* Answer Checker Toggle */}
                    <button
                      onClick={() => setShowMathAnswerBox(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium flex items-center gap-1.5 hover:bg-primary/15 transition-colors"
                    >
                      <PenTool className="w-3 h-3" />
                      {showMathAnswerBox[i] ? t("Hide Answer Box", "উত্তর বক্স লুকাও") : t("Write Your Answer", "তোমার উত্তর লেখো")}
                    </button>

                    {showMathAnswerBox[i] && (
                      <AnswerChecker
                        problem={p.problem}
                        expectedAnswer={`${(p.solution_steps || []).join("\n")}\nAnswer: ${p.answer}`}
                        courseType="math"
                        placeholder={t("Write your solution step by step...", "ধাপে ধাপে তোমার সমাধান লেখো...")}
                      />
                    )}

                    {/* Still show solution toggle */}
                    <button onClick={() => setShowMathSolutions(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> {showMathSolutions[i] ? t("Hide Solution", "সমাধান লুকাও") : t("Show Solution", "সমাধান দেখো")}
                    </button>
                    {showMathSolutions[i] && (
                      <div className="bg-accent/30 rounded-lg p-3 space-y-1">
                        {p.solution_steps?.map((s: string, j: number) => (
                          <p key={j} className="text-sm text-foreground/80">{s}</p>
                        ))}
                        <p className="text-sm font-bold text-primary mt-2">→ {p.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CODING SECTION */}
        {currentSectionId === "coding" && coding && (
          <motion.div key="coding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Language Badge + Problem */}
            <div className="bg-emerald-500/5 rounded-xl p-5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-emerald-500" />
                <h5 className="text-sm font-bold text-foreground">{t("Problem", "সমস্যা")}</h5>
                {coding.language && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">{coding.language}</span>
                )}
              </div>
              <p className="text-sm text-foreground/90">{coding.problem_statement}</p>
            </div>

            {/* ✍️ YOUR SOLUTION — Answer Box for Coding */}
            <div className="bg-emerald-500/5 rounded-xl p-5 border-2 border-dashed border-emerald-500/30">
              <button
                onClick={() => setShowCodingAnswerBox(!showCodingAnswerBox)}
                className="w-full text-left"
              >
                <h5 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-500" />
                  {t("✍️ Write Your Solution", "✍️ তোমার সমাধান লেখো")}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ml-auto ${showCodingAnswerBox ? "rotate-180" : ""}`} />
                </h5>
                <p className="text-xs text-muted-foreground">{t("Try solving it yourself, then check with AI!", "নিজে সমাধান করো, তারপর AI দিয়ে যাচাই করো!")}</p>
              </button>
              {showCodingAnswerBox && (
                <AnswerChecker
                  problem={coding.problem_statement}
                  expectedAnswer={coding.full_code || ""}
                  courseType="coding"
                  placeholder={t("Write your code here...", "এখানে তোমার কোড লেখো...")}
                />
              )}
            </div>

            {/* Thought Process */}
            {coding.thought_process && (
              <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20 space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">🧠 {t("Thought Process", "চিন্তা প্রক্রিয়া")}</h5>
                {coding.thought_process.data_structure && <p className="text-sm text-foreground/80"><strong>{t("Data Structure:", "ডাটা স্ট্রাকচার:")}</strong> {coding.thought_process.data_structure}</p>}
                {coding.thought_process.algorithm && <p className="text-sm text-foreground/80"><strong>{t("Algorithm:", "অ্যালগরিদম:")}</strong> {coding.thought_process.algorithm}</p>}
                {coding.thought_process.approach && <p className="text-sm text-foreground/80"><strong>{t("Approach:", "পদ্ধতি:")}</strong> {coding.thought_process.approach}</p>}
              </div>
            )}

            {/* Code Construction Phases */}
            {coding.code_construction?.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">🔨 {t("Code Construction", "কোড নির্মাণ")}</h5>
                <div className="flex gap-1 bg-accent/50 rounded-lg p-1">
                  {coding.code_construction.map((phase: any, i: number) => (
                    <button key={i} onClick={() => setCodePhase(i)}
                      className={`flex-1 text-xs py-2 rounded-md transition-all ${codePhase === i ? "bg-background text-foreground font-medium shadow-sm" : "text-muted-foreground"}`}
                    >
                      {phase.phase}
                    </button>
                  ))}
                </div>
                {renderCodeBlock(coding.code_construction[codePhase]?.code || "", coding.code_construction[codePhase]?.phase)}
                <p className="text-xs text-muted-foreground italic">💡 {coding.code_construction[codePhase]?.explanation}</p>
              </div>
            )}

            {/* Full Code */}
            {coding.full_code && (
              <div>
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-500" /> {t("Full Runnable Code", "সম্পূর্ণ কোড")}
                </h5>
                {renderCodeBlock(coding.full_code)}
              </div>
            )}

            {/* Code Walkthrough */}
            {coding.code_walkthrough?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">📖 {t("Code Walkthrough", "কোড ওয়াকথ্রু")}</h5>
                {coding.code_walkthrough.map((w: any, i: number) => (
                  <div key={i} className="bg-accent/30 rounded-lg p-3 border border-border flex items-start gap-2">
                    <span className="text-xs font-mono text-primary font-bold flex-shrink-0">{w.line_ref}</span>
                    <span className="text-sm text-foreground/80">{w.explanation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Test Cases */}
            {coding.test_cases?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide">🧪 {t("Test Cases", "টেস্ট কেস")}</h5>
                <div className="grid gap-2">
                  {coding.test_cases.map((tc: any, i: number) => (
                    <div key={i} className="bg-background rounded-xl p-4 border border-border grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div><span className="text-xs font-bold text-muted-foreground">Input</span><pre className="text-sm font-mono text-foreground mt-1">{tc.input}</pre></div>
                      <div><span className="text-xs font-bold text-muted-foreground">Output</span><pre className="text-sm font-mono text-emerald-500 mt-1">{tc.output}</pre></div>
                      <div><span className="text-xs font-bold text-muted-foreground">{t("Why", "কেন")}</span><p className="text-xs text-foreground/70 mt-1">{tc.explanation}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edge Cases */}
            {coding.edge_cases?.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> {t("Edge Cases", "এজ কেস")}
                </h5>
                {coding.edge_cases.map((ec: any, i: number) => (
                  <div key={i} className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20">
                    <span className="text-xs font-bold text-yellow-600">{ec.case}</span>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs font-mono text-foreground/70">In: {ec.input}</span>
                      <span className="text-xs font-mono text-foreground/70">Out: {ec.expected}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ec.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Complexity */}
            {coding.complexity && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20 text-center">
                  <span className="text-xs font-bold text-blue-500 uppercase">⏱ Time</span>
                  <p className="text-sm font-mono font-bold text-foreground mt-1">{coding.complexity.time}</p>
                </div>
                <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20 text-center">
                  <span className="text-xs font-bold text-purple-500 uppercase">💾 Space</span>
                  <p className="text-sm font-mono font-bold text-foreground mt-1">{coding.complexity.space}</p>
                </div>
              </div>
            )}

            {/* Optimization */}
            {coding.optimization?.optimized_code && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" /> {t("Optimization", "অপটিমাইজেশন")}
                </h5>
                <p className="text-xs text-muted-foreground">{coding.optimization.current_issue}</p>
                {renderCodeBlock(coding.optimization.optimized_code, t("Optimized Version", "অপটিমাইজড ভার্সন"))}
                <p className="text-xs text-green-600">✅ {coding.optimization.improvement}</p>
              </div>
            )}

            {/* Debugging Insight */}
            {coding.debugging_insight && (
              <div>
                <button onClick={() => setShowBuggy(!showBuggy)}
                  className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                >
                  <Bug className="w-3.5 h-3.5" /> {showBuggy ? t("Hide Debugging", "ডিবাগিং লুকাও") : t("Show Common Bug & Fix", "সাধারণ বাগ ও সমাধান দেখো")}
                </button>
                {showBuggy && (
                  <div className="mt-2 space-y-3">
                    {renderCodeBlock(coding.debugging_insight.buggy_code, "❌ " + t("Buggy Code", "ভুল কোড"))}
                    <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                      <p className="text-sm text-foreground/80">🐛 {coding.debugging_insight.bug_explanation}</p>
                    </div>
                    <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
                      <p className="text-sm text-foreground/80">✅ {coding.debugging_insight.fix}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variable Trace Simulation */}
            {coding.simulation?.variable_trace?.length > 0 && (
              <div>
                <button onClick={() => setShowSimulation(!showSimulation)}
                  className="text-xs text-emerald-500 flex items-center gap-1 hover:underline"
                >
                  <Play className="w-3.5 h-3.5" /> {showSimulation ? t("Hide Simulation", "সিমুলেশন লুকাও") : t("Show Code Simulation", "কোড সিমুলেশন দেখো")}
                </button>
                {showSimulation && (
                  <div className="mt-2 space-y-2">
                    {coding.simulation.input && (
                      <p className="text-xs text-muted-foreground font-mono">Input: {coding.simulation.input}</p>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-accent/50">
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold">{t("Step", "ধাপ")}</th>
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold">{t("Variables", "ভেরিয়েবল")}</th>
                            <th className="px-3 py-2 text-left text-muted-foreground font-bold">{t("Action", "কাজ")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coding.simulation.variable_trace.map((row: any, i: number) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-2 font-mono text-primary font-bold">{row.step}</td>
                              <td className="px-3 py-2 font-mono text-foreground/80">
                                {typeof row.variables === "object" ? Object.entries(row.variables).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(", ") : String(row.variables)}
                              </td>
                              <td className="px-3 py-2 text-foreground/70">{row.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* PRACTICAL */}
        {currentSectionId === "practical" && (
          <motion.div key="practical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-green-500/5 rounded-xl p-5 border border-green-500/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" /> {t("Real-World Scenario", "বাস্তব দৃশ্যপট")}
              </h5>
              <p className="text-sm text-foreground/80 leading-relaxed">{lesson.practical?.scenario}</p>
            </div>
            <div className="bg-background rounded-xl p-5 border border-border">
              <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">{t("Step-by-Step Walkthrough", "ধাপে ধাপে")}</h5>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{lesson.practical?.walkthrough}</p>
            </div>
          </motion.div>
        )}

        {/* PRACTICE */}
        {currentSectionId === "practice" && (
          <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-yellow-500/5 rounded-xl p-5 border border-yellow-500/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-yellow-500" /> {t("Try It Yourself", "নিজে চেষ্টা করো")}
              </h5>
              <p className="text-sm text-foreground/80 leading-relaxed">{lesson.practice?.task}</p>
            </div>

            {/* Answer checker for practice task */}
            <AnswerChecker
              problem={lesson.practice?.task || ""}
              expectedAnswer={lesson.practice?.expected_outcome || ""}
              courseType={hasCoding ? "coding" : hasMath ? "math" : "theory"}
              placeholder={t("Write your answer here...", "এখানে তোমার উত্তর লেখো...")}
            />

            <button onClick={() => setShowHints(!showHints)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" /> {showHints ? t("Hide Hints", "ইঙ্গিত লুকাও") : t("Show Hints", "ইঙ্গিত দেখো")}
            </button>
            {showHints && lesson.practice?.hints?.map((hint, j) => (
              <div key={j} className="bg-accent/30 rounded-lg p-3 border border-border text-sm text-muted-foreground flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" /> {hint}
              </div>
            ))}
            {lesson.practice?.expected_outcome && (
              <>
                <button onClick={() => setShowSolution(!showSolution)}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" /> {showSolution ? t("Hide Solution", "সমাধান লুকাও") : t("Show Expected Outcome", "প্রত্যাশিত ফলাফল দেখো")}
                </button>
                {showSolution && (
                  <div className="bg-accent/30 rounded-lg p-4 border border-border text-sm text-foreground/80">
                    {lesson.practice.expected_outcome}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* RECAP */}
        {currentSectionId === "recap" && (
          <motion.div key="recap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
              <h5 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" /> {t("Key Takeaways", "মূল বিষয়")}
              </h5>
              <ul className="space-y-2">
                {lesson.recap?.key_takeaways?.map((point, j) => (
                  <li key={j} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            {lesson.recap?.memory_anchors?.length > 0 && (
              <div className="bg-accent/30 rounded-xl p-4 border border-border">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">🧠 {t("Memory Anchors", "মনে রাখার কৌশল")}</h5>
                {lesson.recap.memory_anchors.map((anchor, j) => (
                  <p key={j} className="text-sm text-foreground/80 flex items-start gap-2 mb-1">
                    <span className="text-primary">💡</span> {anchor}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="text-xs px-4 py-2 rounded-lg border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground hover:border-primary/30 transition-all"
          >
            ← {t("Previous", "আগের")}
          </button>
          <button
            onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
            disabled={activeSection === sections.length - 1}
            className="text-xs px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 disabled:opacity-30 hover:bg-primary/20 transition-all flex items-center gap-1"
          >
            {t("Next", "পরের")} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
