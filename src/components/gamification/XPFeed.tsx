import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface XPLog {
  action: string;
  xp_earned: number;
  coins_earned: number;
  created_at: string;
}

const actionLabels: Record<string, { en: string; bn: string; color: string }> = {
  complete_lesson: { en: "Lesson completed", bn: "পাঠ সম্পন্ন", color: "text-primary" },
  correct_answer: { en: "Correct answer", bn: "সঠিক উত্তর", color: "text-primary" },
  finish_daily_goal: { en: "Daily goal done", bn: "দৈনিক লক্ষ্য সম্পন্ন", color: "text-secondary" },
  streak_7: { en: "7-day streak", bn: "৭ দিনের স্ট্রিক", color: "text-destructive" },
  mock_interview: { en: "Mock interview", bn: "মক ইন্টারভিউ", color: "text-primary" },
  complete_quiz: { en: "Quiz completed", bn: "কুইজ সম্পন্ন", color: "text-primary" },
  ask_ai: { en: "AI question", bn: "AI প্রশ্ন", color: "text-secondary" },
  daily_bonus: { en: "Daily bonus", bn: "দৈনিক বোনাস", color: "text-secondary" },
  study_minutes: { en: "Study session", bn: "পড়াশোনা", color: "text-primary" },
  achievement_bonus: { en: "Achievement!", bn: "অর্জন!", color: "text-secondary" },
};

interface Props {
  recentXp: XPLog[];
}

export default function XPFeed({ recentXp }: Props) {
  const { t } = useLanguage();

  if (!recentXp.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient border border-border rounded-xl p-4"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        {t("Activity Feed", "অ্যাক্টিভিটি ফিড")}
      </h3>
      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-none">
        {recentXp.map((log, i) => {
          const label = actionLabels[log.action] || { en: log.action, bn: log.action, color: "text-primary" };
          const time = new Date(log.created_at);
          const ago = getTimeAgo(time);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${label.color.replace("text-", "bg-")}`} />
                <span className="text-xs text-foreground truncate">{t(label.en, label.bn)}</span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">{ago}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {log.xp_earned > 0 && (
                  <span className="text-xs font-bold text-primary">+{log.xp_earned}</span>
                )}
                {log.coins_earned > 0 && (
                  <span className="text-xs font-bold text-secondary">+{log.coins_earned}💎</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
