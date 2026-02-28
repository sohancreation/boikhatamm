import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface Props {
  rank: { en: string; bn: string; icon: string };
  level: number;
  xpProgress: number;
  xpInLevel: number;
  xpNeeded: number;
  coins: number;
}

export default function RankBadge({ rank, level, xpProgress, xpInLevel, xpNeeded, coins }: Props) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient border border-primary/20 rounded-xl p-4 relative overflow-hidden"
    >
      {/* Subtle shine sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-full h-[200%] w-12 bg-gradient-to-b from-transparent via-primary/5 to-transparent rotate-12 animate-badge-shine" />
      </div>

      <div className="relative flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12 }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shadow-lg animate-glow-ring"
        >
          {rank.icon}
        </motion.div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">{t("Rank", "র‍্যাংক")}</div>
          <div className="text-base font-bold text-foreground">{t(rank.en, rank.bn)}</div>
          <div className="text-xs text-muted-foreground">
            {t(`Level ${level}`, `লেভেল ${level}`)} • 💎 {coins} {t("Coins", "কয়েন")}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">{t(`Level ${level}`, `লেভেল ${level}`)}</span>
          <span className="text-foreground font-medium">{xpInLevel}/{xpNeeded} XP</span>
          <span className="text-muted-foreground">{t(`Level ${level + 1}`, `লেভেল ${level + 1}`)}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary relative"
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 animate-progress-glow rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/15 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
