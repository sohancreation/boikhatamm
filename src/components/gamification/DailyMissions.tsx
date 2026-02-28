import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, Gift, Brain, Clock, MessageCircle, Sparkles } from "lucide-react";
import type { DailyMissions as DMType } from "@/hooks/useGamification";

interface Props {
  missions: DMType | null;
  onClaimBonus: () => void;
}

const missionConfig: Record<string, { icon: typeof Target; labelEn: string; labelBn: string }> = {
  complete_quiz: { icon: Brain, labelEn: "Complete 1 Quiz", labelBn: "১টি কুইজ সম্পন্ন করো" },
  study_minutes: { icon: Clock, labelEn: "Study 20 minutes", labelBn: "২০ মিনিট পড়াশোনা করো" },
  ask_ai: { icon: MessageCircle, labelEn: "Ask 1 AI Question", labelBn: "১টি AI প্রশ্ন করো" },
};

export default function DailyMissions({ missions, onClaimBonus }: Props) {
  const { t } = useLanguage();

  if (!missions) return null;

  const missionList = [
    { type: missions.mission_1_type, progress: missions.mission_1_progress, target: missions.mission_1_target, done: missions.mission_1_done },
    { type: missions.mission_2_type, progress: missions.mission_2_progress, target: missions.mission_2_target, done: missions.mission_2_done },
    { type: missions.mission_3_type, progress: missions.mission_3_progress, target: missions.mission_3_target, done: missions.mission_3_done },
  ];

  const allDone = missions.all_completed;
  const bonusClaimed = missions.bonus_claimed;
  const doneCount = missionList.filter(m => m.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card-gradient border rounded-xl p-4 transition-all duration-500 ${
        allDone && !bonusClaimed ? "border-primary/40 shadow-glow-primary" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          {t("Today's Missions", "আজকের মিশন")}
        </h3>
        <span className="text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
          {doneCount}/3
        </span>
      </div>

      {/* Reward preview */}
      <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-secondary/5 border border-secondary/10">
        <Gift className="w-3.5 h-3.5 text-secondary" />
        <span className="text-xs text-muted-foreground">
          {t("Reward:", "পুরস্কার:")}
        </span>
        <span className="text-xs font-bold text-secondary">+50 XP + 20 💎</span>
      </div>

      <div className="space-y-2.5">
        {missionList.map((m, i) => {
          const config = missionConfig[m.type] || missionConfig.complete_quiz;
          const Icon = config.icon;
          const progress = Math.min(m.progress, m.target);
          const percent = (progress / m.target) * 100;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-300 ${
                m.done
                  ? "bg-primary/10 border-primary/30"
                  : "border-border/50 bg-background/50"
              }`}
            >
              <motion.div
                animate={m.done ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  m.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {m.done ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${m.done ? "text-primary line-through" : "text-foreground"}`}>
                    {t(config.labelEn, config.labelBn)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{progress}/{m.target}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full transition-colors ${
                      m.done ? "bg-primary" : "bg-primary/50"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bonus claim button */}
      <AnimatePresence>
        {allDone && !bonusClaimed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 12 }}
            onClick={onClaimBonus}
            className="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-glow-primary"
          >
            <Sparkles className="w-4 h-4" />
            {t("MISSION COMPLETE — Claim Reward!", "মিশন সম্পন্ন — পুরস্কার নাও!")}
          </motion.button>
        )}
      </AnimatePresence>

      {bonusClaimed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-2 flex items-center justify-center gap-1.5"
        >
          <div className="animate-confetti-pop">✅</div>
          <p className="text-xs text-primary font-medium">
            {t("Daily bonus claimed!", "দৈনিক বোনাস নেওয়া হয়েছে!")}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
