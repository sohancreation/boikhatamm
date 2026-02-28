import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  Trophy, CheckCircle, XCircle, HelpCircle, Eye, Flame, AlertTriangle,
  Star, Lightbulb, PenTool
} from "lucide-react";
import type { ModuleAssessmentData, ModuleEngagement } from "./CourseViewer";

interface Props {
  assessment: ModuleAssessmentData;
  engagement: ModuleEngagement;
}

export const ModuleAssessment = ({ assessment, engagement }: Props) => {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showChallengeSolution, setShowChallengeSolution] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "challenge" | "engagement">("quiz");

  const allMcqs = [
    ...(assessment?.concept_mcqs || []).map(q => ({ ...q, type: "concept" })),
    ...(assessment?.application_mcqs || []).map(q => ({ ...q, type: "application" })),
  ];

  const handleAnswer = (idx: number, optIdx: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
  };

  const handleSubmit = () => setSubmitted(true);

  const correctCount = allMcqs.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("quiz")}
          className={`text-xs px-3 py-2 rounded-lg border transition-all ${activeTab === "quiz" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
        >
          <Trophy className="w-3 h-3 inline mr-1" /> {t("Quiz", "কুইজ")} ({allMcqs.length})
        </button>
        <button onClick={() => setActiveTab("challenge")}
          className={`text-xs px-3 py-2 rounded-lg border transition-all ${activeTab === "challenge" ? "bg-secondary/10 border-secondary text-secondary" : "border-border text-muted-foreground"}`}
        >
          <PenTool className="w-3 h-3 inline mr-1" /> {t("Challenge", "চ্যালেঞ্জ")}
        </button>
        <button onClick={() => setActiveTab("engagement")}
          className={`text-xs px-3 py-2 rounded-lg border transition-all ${activeTab === "engagement" ? "bg-purple-500/10 border-purple-500 text-purple-500" : "border-border text-muted-foreground"}`}
        >
          <Flame className="w-3 h-3 inline mr-1" /> {t("Insights", "অন্তর্দৃষ্টি")}
        </button>
      </div>

      {/* Quiz */}
      {activeTab === "quiz" && (
        <div className="space-y-4">
          {allMcqs.map((q, i) => (
            <div key={i} className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-start gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${q.type === "concept" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"}`}>
                    {q.type === "concept" ? t("Concept", "ধারণা") : t("Application", "প্রয়োগ")}
                  </span>
                </div>
              </div>
              <div className="grid gap-2 ml-8">
                {q.options?.map((opt: string, oi: number) => {
                  const isSelected = answers[i] === oi;
                  const isCorrect = oi === q.correct_index;
                  let optClass = "border-border text-foreground/80 hover:border-primary/30";
                  if (submitted) {
                    if (isCorrect) optClass = "border-green-500 bg-green-500/10 text-green-700";
                    else if (isSelected && !isCorrect) optClass = "border-red-500 bg-red-500/10 text-red-700";
                  } else if (isSelected) {
                    optClass = "border-primary bg-primary/10 text-primary";
                  }
                  return (
                    <button key={oi} onClick={() => handleAnswer(i, oi)}
                      className={`text-left text-sm px-3 py-2 rounded-lg border transition-all flex items-center gap-2 ${optClass}`}
                    >
                      <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {submitted && isCorrect ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                         submitted && isSelected && !isCorrect ? <XCircle className="w-4 h-4 text-red-500" /> :
                         String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explanation && (
                <div className="mt-2 ml-8 text-xs text-muted-foreground bg-accent/30 rounded-lg p-3 border border-border">
                  <strong>{t("Explanation:", "ব্যাখ্যা:")}</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!submitted && allMcqs.length > 0 && (
            <button onClick={handleSubmit}
              disabled={Object.keys(answers).length < allMcqs.length}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {t("Submit Answers", "উত্তর জমা দাও")}
            </button>
          )}
          {submitted && (
            <div className={`text-center py-4 rounded-xl border ${correctCount === allMcqs.length ? "bg-green-500/10 border-green-500/20" : "bg-accent/30 border-border"}`}>
              <span className="text-2xl font-bold text-foreground">{correctCount}/{allMcqs.length}</span>
              <p className="text-sm text-muted-foreground mt-1">
                {correctCount === allMcqs.length ? t("Perfect! 🎉", "চমৎকার! 🎉") : t("Keep learning!", "আরো শেখো!")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Challenge */}
      {activeTab === "challenge" && (
        <div className="space-y-4">
          {assessment?.challenge_problem && (
            <div className="bg-secondary/5 rounded-xl p-5 border border-secondary/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <PenTool className="w-4 h-4 text-secondary" /> {t("Challenge Problem", "চ্যালেঞ্জ সমস্যা")}
              </h5>
              <p className="text-sm text-foreground/80 mb-3">{assessment.challenge_problem.problem}</p>
              {assessment.challenge_problem.hints?.map((hint, j) => (
                <div key={j} className="text-xs text-muted-foreground flex items-start gap-1 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5" /> {hint}
                </div>
              ))}
              <button onClick={() => setShowChallengeSolution(!showChallengeSolution)}
                className="text-xs text-primary flex items-center gap-1 mt-3 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> {showChallengeSolution ? t("Hide Solution", "সমাধান লুকাও") : t("Show Solution", "সমাধান দেখো")}
              </button>
              {showChallengeSolution && (
                <div className="mt-2 bg-background rounded-lg p-3 border border-border text-sm text-foreground/80">
                  {assessment.challenge_problem.solution}
                </div>
              )}
            </div>
          )}
          {assessment?.project_task && (
            <div className="bg-primary/5 rounded-xl p-5 border border-primary/20">
              <h5 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" /> {t("Mini Project", "মিনি প্রজেক্ট")}
              </h5>
              <p className="text-sm text-foreground/80">{assessment.project_task}</p>
            </div>
          )}
        </div>
      )}

      {/* Engagement */}
      {activeTab === "engagement" && engagement && (
        <div className="space-y-3">
          {engagement.surprise_insight && (
            <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/20">
              <h5 className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-1 flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {t("Surprise Insight", "চমকপ্রদ তথ্য")}</h5>
              <p className="text-sm text-foreground/80">{engagement.surprise_insight}</p>
            </div>
          )}
          {engagement.common_mistake && (
            <div className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/20">
              <h5 className="text-xs font-bold text-yellow-500 uppercase tracking-wide mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {t("Common Mistake", "সাধারণ ভুল")}</h5>
              <p className="text-sm text-foreground/80">{engagement.common_mistake}</p>
            </div>
          )}
          {engagement.real_failure_example && (
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20">
              <h5 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">💥 {t("What Goes Wrong", "কী ভুল হতে পারে")}</h5>
              <p className="text-sm text-foreground/80">{engagement.real_failure_example}</p>
            </div>
          )}
          {engagement.insider_tip && (
            <div className="bg-green-500/5 rounded-xl p-4 border border-green-500/20">
              <h5 className="text-xs font-bold text-green-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {t("Insider Tip", "ইনসাইডার টিপ")}</h5>
              <p className="text-sm text-foreground/80">{engagement.insider_tip}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
