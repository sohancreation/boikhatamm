import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, BarChart3, Target, FileText, CheckCircle,
  AlertTriangle, Zap, Lightbulb, TrendingUp,
} from "lucide-react";

interface Props {
  result: string;
  atsScore: any;
  targetRole: string;
  onBack: () => void;
}

export default function ResumeAnalysisResults({ result, atsScore, targetRole, onBack }: Props) {
  const { t } = useLanguage();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-accent text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-primary" />
            {t("Analysis Results", "বিশ্লেষণ ফলাফল")}
          </h1>
          {targetRole && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {t("Target:", "লক্ষ্য:")} <span className="text-primary font-semibold">{targetRole}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* ATS Score Card */}
      {atsScore && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border overflow-hidden">
          <div className="bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t("ATS Compatibility Score", "ATS সামঞ্জস্য স্কোর")}
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                  style={{
                    borderColor: atsScore.overall >= 70 ? "hsl(var(--primary))" : atsScore.overall >= 40 ? "#eab308" : "hsl(var(--destructive))",
                  }}>
                  <span className={`text-3xl font-black ${
                    atsScore.overall >= 70 ? "text-primary" : atsScore.overall >= 40 ? "text-yellow-500" : "text-destructive"
                  }`}>
                    {atsScore.overall}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: t("Keywords", "কীওয়ার্ড"), val: atsScore.keywordMatch, icon: Target },
                { label: t("Format", "ফরম্যাট"), val: atsScore.formatSafety, icon: FileText },
                { label: t("Grammar", "ব্যাকরণ"), val: atsScore.grammarScore, icon: CheckCircle },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="bg-muted rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="font-bold text-foreground text-2xl">{val || "—"}</div>
                </div>
              ))}
            </div>

            {/* Missing Keywords */}
            {atsScore.missingKeywords?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  {t("Missing Keywords", "অনুপস্থিত কীওয়ার্ড")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {atsScore.missingKeywords.map((k: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">{k}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {atsScore.suggestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  {t("Improvement Suggestions", "উন্নতির পরামর্শ")}
                </h4>
                <ul className="space-y-2">
                  {atsScore.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2.5 bg-muted/50 rounded-xl px-4 py-3">
                      <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Detailed Analysis */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {t("Detailed Analysis Report", "বিস্তারিত বিশ্লেষণ রিপোর্ট")}
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* Back button */}
      <button onClick={onBack}
        className="w-full py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        {t("Analyze Another Resume", "আরেকটি রিজিউমি বিশ্লেষণ করুন")}
      </button>
    </div>
  );
}
