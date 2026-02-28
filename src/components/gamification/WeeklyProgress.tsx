import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { TrendingUp, ArrowUp } from "lucide-react";

interface SubjectProgress {
  subject: string;
  percent: number;
  color: string;
}

interface Props {
  subjectProgress: SubjectProgress[];
  totalCompleted: number;
  totalTopics: number;
}

export default function WeeklyProgress({ subjectProgress, totalCompleted, totalTopics }: Props) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {t("Weekly Growth", "সাপ্তাহিক অগ্রগতি")}
        </h3>
        {totalTopics > 0 && (
          <span className="text-xs text-muted-foreground">{totalCompleted}/{totalTopics}</span>
        )}
      </div>

      {subjectProgress.length > 0 ? (
        <div className="space-y-3">
          {subjectProgress.map((p, i) => (
            <motion.div
              key={p.subject}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{p.subject}</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{p.percent}%</span>
                  {p.percent > 0 && <ArrowUp className="w-3 h-3 text-primary" />}
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.percent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.1 }}
                  className={`h-full rounded-full ${p.color} relative`}
                >
                  {p.percent === 100 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-foreground/30 animate-pulse" />
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t("Start studying to track progress!", "অগ্রগতি ট্র্যাক করতে পড়াশোনা শুরু করো!")}
        </p>
      )}
    </motion.div>
  );
}
