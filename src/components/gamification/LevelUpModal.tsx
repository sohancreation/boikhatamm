import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback } from "react";

interface LevelUpData {
  level: number;
  rank: { en: string; bn: string; icon: string };
}

let triggerLevelUpFn: ((data: LevelUpData) => void) | null = null;

export function triggerLevelUp(data: LevelUpData) {
  triggerLevelUpFn?.(data);
}

export default function LevelUpModal() {
  const { t } = useLanguage();
  const [data, setData] = useState<LevelUpData | null>(null);

  const handler = useCallback((d: LevelUpData) => {
    setData(d);
    setTimeout(() => setData(null), 4000);
  }, []);

  useEffect(() => {
    triggerLevelUpFn = handler;
    return () => { triggerLevelUpFn = null; };
  }, [handler]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-sm"
          onClick={() => setData(null)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative p-8 rounded-2xl card-gradient border border-primary/40 shadow-2xl text-center max-w-xs mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl animate-glow-ring" />

            {/* Confetti dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 0.8],
                  x: (Math.random() - 0.5) * 120,
                  y: (Math.random() - 0.5) * 120,
                }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))'][i % 3],
                }}
              />
            ))}

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-5xl block mb-3"
            >
              {data.rank.icon}
            </motion.span>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs uppercase tracking-widest text-primary font-bold mb-1">
                {t("Level Up!", "লেভেল আপ!")}
              </p>
              <p className="text-3xl font-black text-foreground mb-1">
                {t(`Level ${data.level}`, `লেভেল ${data.level}`)}
              </p>
              <p className="text-sm font-semibold text-primary">
                {t(data.rank.en, data.rank.bn)}
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground mt-4"
            >
              {t("Tap anywhere to continue", "চালিয়ে যেতে ট্যাপ করো")}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
