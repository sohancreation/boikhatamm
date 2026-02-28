import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Flame, Zap, Crown, Coins } from "lucide-react";

interface Props {
  firstName: string;
  rank: { en: string; bn: string; icon: string };
  level: number;
  xp: number;
  xpInLevel: number;
  xpNeeded: number;
  xpProgress: number;
  coins: number;
  streak: number;
  onShopToggle: () => void;
}

export default function ProgressHero({
  firstName, rank, level, xp, xpInLevel, xpNeeded, xpProgress, coins, streak, onShopToggle,
}: Props) {
  const { t } = useLanguage();
  const almostLevelUp = xpProgress >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 p-5 md:p-6"
      style={{ backgroundImage: "var(--card-gradient)" }}
    >
      {/* Subtle animated bg glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-secondary/5 blur-3xl" />

      <div className="relative z-10">
        {/* Top row: Name + coins */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {t(`Welcome back, ${firstName}`, `স্বাগতম, ${firstName}`)}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg">{rank.icon}</span>
              <span className="text-sm font-semibold text-primary">
                {t(rank.en, rank.bn)}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {t(`Level ${level}`, `লেভেল ${level}`)}
              </span>
            </div>
          </div>
          <button
            onClick={onShopToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 transition-colors"
          >
            <Coins className="w-4 h-4 text-secondary" />
            <span className="text-sm font-bold text-secondary">{coins}</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{xp}</span>
            <span className="text-xs text-muted-foreground">XP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={streak > 0 ? "animate-flame-pulse" : ""}>
              <Flame className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm font-bold text-foreground">{streak}</span>
            <span className="text-xs text-muted-foreground">{t("day streak", "দিনের স্ট্রিক")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">{t(`Level ${level}`, `লেভেল ${level}`)}</span>
          </div>
        </div>

        {/* XP Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-muted-foreground">
              {t(`Level ${level}`, `লেভেল ${level}`)}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {xpInLevel} / {xpNeeded} XP
            </span>
            <span className="text-xs text-muted-foreground">
              {t(`Level ${level + 1}`, `লেভেল ${level + 1}`)}
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-secondary relative"
            >
              {/* Glow at the edge */}
              <div className="absolute right-0 top-0 bottom-0 w-3 animate-progress-glow rounded-full" />
              {/* Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          {almostLevelUp && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-xs text-primary font-semibold mt-1.5 text-center"
            >
              🔥 {t("Almost Level Up!", "লেভেল আপ হতে আর একটু!")}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
