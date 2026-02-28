import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { useState } from "react";

interface Achievement {
  id: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  icon: string;
  xp_bonus: number;
  coins_bonus: number;
  category: string;
  requirement_value: number;
  earned: boolean;
  earned_at: string | null;
}

interface Props {
  achievements: Achievement[];
  earnedCount: number;
  totalCount: number;
}

export default function AchievementWall({ achievements, earnedCount, totalCount }: Props) {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-secondary" />
          {t("Trophy Room", "ট্রফি রুম")}
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
              className="h-full bg-secondary rounded-full"
            />
          </div>
          <span className="text-xs text-muted-foreground">{earnedCount}/{totalCount}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-6 gap-2.5">
        {achievements.slice(0, 12).map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, type: "spring", damping: 15 }}
            onMouseEnter={() => setHoveredId(a.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="relative group"
          >
            <div className={`relative p-2.5 rounded-xl text-center transition-all duration-300 cursor-default ${
              a.earned
                ? "bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/30 hover:shadow-glow-primary hover:scale-105"
                : "bg-muted/30 border border-border/40 grayscale opacity-40 hover:opacity-60"
            }`}>
              {/* Shine effect for earned */}
              {a.earned && (
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className="absolute -top-full h-[200%] w-8 bg-gradient-to-b from-transparent via-primary-foreground/10 to-transparent rotate-12 animate-badge-shine" style={{ animationDelay: `${i * 0.2}s` }} />
                </div>
              )}

              <motion.span
                className="text-2xl block relative"
                animate={a.earned && hoveredId === a.id ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {a.icon}
              </motion.span>
              <span className="text-[9px] font-semibold text-foreground block mt-1 leading-tight truncate">
                {t(a.name_en, a.name_bn)}
              </span>
              {!a.earned && (
                <Lock className="w-2.5 h-2.5 absolute top-1 right-1 text-muted-foreground" />
              )}
            </div>

            {/* Tooltip on hover */}
            {hoveredId === a.id && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 rounded-lg bg-popover border border-border shadow-lg text-center pointer-events-none"
              >
                <p className="text-[10px] text-foreground font-medium">
                  {t(a.description_en || "", a.description_bn || "")}
                </p>
                {a.earned && (
                  <p className="text-[9px] text-primary mt-1">+{a.xp_bonus} XP • +{a.coins_bonus} 💎</p>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {achievements.length > 12 && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          +{achievements.length - 12} {t("more achievements", "আরো অর্জন")}
        </p>
      )}
    </motion.div>
  );
}
