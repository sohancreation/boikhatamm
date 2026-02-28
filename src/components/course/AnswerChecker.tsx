import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckCircle, XCircle, Lightbulb, Code, AlertTriangle, Eye
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface AnswerCheckerProps {
  problem: string;
  expectedAnswer: string;
  courseType: "coding" | "math" | "theory";
  placeholder?: string;
}

export const AnswerChecker = ({ problem, expectedAnswer, courseType, placeholder }: AnswerCheckerProps) => {
  const { t, lang } = useLanguage();
  const [answer, setAnswer] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const handleCheck = async () => {
    if (!answer.trim()) return;
    setChecking(true);
    setResult(null);
    setShowCorrected(false);
    setHintIndex(0);
    try {
      const { data, error } = await supabase.functions.invoke("check-answer", {
        body: { problem, studentAnswer: answer, expectedAnswer, courseType, language: lang },
      });
      if (error) throw error;
      setResult(data);
    } catch (err: any) {
      setResult({ is_correct: false, score: 0, feedback: err.message || "Error checking answer", issues: [], hints: [] });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <Textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={placeholder || (courseType === "coding" ? t("Write your code here...", "এখানে কোড লেখো...") : t("Write your answer here...", "এখানে উত্তর লেখো..."))}
          className={`min-h-[120px] ${courseType === "coding" ? "font-mono text-sm" : "text-sm"} bg-background border-border resize-y`}
          rows={courseType === "coding" ? 10 : 4}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCheck}
          disabled={!answer.trim() || checking}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {checking ? t("Checking...", "যাচাই হচ্ছে...") : t("Check Answer", "উত্তর যাচাই করো")}
        </button>
        {result && !result.is_correct && result.hints?.length > 0 && hintIndex < result.hints.length && (
          <button
            onClick={() => setHintIndex(prev => prev + 1)}
            className="px-3 py-2 rounded-lg border border-yellow-500/30 text-yellow-600 text-xs font-medium flex items-center gap-1 hover:bg-yellow-500/5 transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" /> {t("Get Hint", "ইঙ্গিত নাও")} ({hintIndex}/{result.hints.length})
          </button>
        )}
      </div>

      {/* Hints */}
      <AnimatePresence>
        {result && hintIndex > 0 && result.hints?.slice(0, hintIndex).map((hint: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/20 text-sm text-foreground/80 flex items-start gap-2"
          >
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>💡 Hint {i + 1}: {hint}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 border space-y-3 ${result.is_correct ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}
          >
            <div className="flex items-center gap-3">
              {result.is_correct
                ? <CheckCircle className="w-6 h-6 text-green-500" />
                : <XCircle className="w-6 h-6 text-red-500" />}
              <div>
                <p className="text-sm font-bold text-foreground">
                  {result.is_correct ? t("Correct! 🎉", "সঠিক! 🎉") : t("Not quite right", "পুরোপুরি সঠিক নয়")}
                </p>
                {result.score !== undefined && (
                  <span className="text-xs text-muted-foreground">{t("Score:", "স্কোর:")} {result.score}/100</span>
                )}
              </div>
            </div>

            <p className="text-sm text-foreground/80">{result.feedback}</p>

            {result.issues?.length > 0 && (
              <div className="space-y-1">
                {result.issues.map((issue: string, i: number) => (
                  <div key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {issue}
                  </div>
                ))}
              </div>
            )}

            {!result.is_correct && (result.corrected_code || result.correct_solution) && (
              <div>
                <button onClick={() => setShowCorrected(!showCorrected)}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showCorrected ? t("Hide Correct Solution", "সমাধান লুকাও") : t("Show Correct Solution", "সঠিক সমাধান দেখো")}
                </button>
                {showCorrected && (
                  <pre className="mt-2 bg-[hsl(var(--card))] rounded-lg p-4 border border-border text-sm font-mono text-foreground/90 overflow-x-auto whitespace-pre-wrap">
                    {result.corrected_code || result.correct_solution}
                  </pre>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
