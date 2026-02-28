import { motion, AnimatePresence } from "framer-motion";
import { X, Coins, TrendingUp, Gift, Shield, Zap, Star, Trophy, Flame, Target, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoinDetailsModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  monthlyEarned: number;
  monthlyCap: number;
  dailyEarned: number;
  dailyCap: number;
  coinMultiplier: number;
  discountProgress: number;
  coinsToDiscount: number;
  currentDiscountPercent: number;
  discountBdt: number;
  maxDiscountPercent: number;
  planPrice: number;
  level: number;
  streak: number;
}

const EARNING_METHODS = [
  { icon: "⚡", xp: "100 XP", coins: "10", keyEn: "Every 100 XP earned", keyBn: "প্রতি ১০০ XP অর্জনে" },
  { icon: "🎯", xp: "Level Up", coins: "50", keyEn: "Level up bonus", keyBn: "লেভেল আপ বোনাস" },
  { icon: "🔥", xp: "7-day streak", coins: "100", keyEn: "Weekly streak milestone", keyBn: "সাপ্তাহিক স্ট্রিক মাইলস্টোন" },
  { icon: "✅", xp: "All missions", coins: "30", keyEn: "Complete daily missions", keyBn: "দৈনিক মিশন সম্পন্ন" },
  { icon: "💯", xp: "80%+ quiz", coins: "Bonus", keyEn: "High quiz performance", keyBn: "উচ্চ কুইজ পারফরম্যান্স" },
];

const DISCOUNT_TIERS = [
  { plan: "Plus (৳399)", max: "20%", savings: "৳80", coinsNeeded: "8,000" },
  { plan: "Pro (৳799)", max: "25%", savings: "৳200", coinsNeeded: "20,000" },
  { plan: "Elite (৳1499)", max: "30%", savings: "৳450", coinsNeeded: "45,000" },
];

export default function CoinDetailsModal({
  open, onClose, coins, monthlyEarned, monthlyCap, dailyEarned, dailyCap,
  coinMultiplier, discountProgress, coinsToDiscount, currentDiscountPercent,
  discountBdt, maxDiscountPercent, planPrice, level, streak,
}: CoinDetailsModalProps) {
  const { t } = useLanguage();
  const monthlyPercent = monthlyCap > 0 ? Math.min(100, Math.round((monthlyEarned / monthlyCap) * 100)) : 0;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{t("Coin Details", "কয়েন বিবরণ")}</h2>
                <p className="text-2xl font-bold text-secondary">🪙 {coins.toLocaleString()}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("Level", "লেভেল")}</p>
                <p className="text-lg font-bold text-foreground">{level}</p>
              </div>
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 text-destructive mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("Streak", "স্ট্রিক")}</p>
                <p className="text-lg font-bold text-foreground">{streak}</p>
              </div>
              <div className="bg-accent/50 rounded-xl p-3 text-center">
                <Star className="w-4 h-4 text-secondary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{t("Multiplier", "মাল্টিপ্লায়ার")}</p>
                <p className="text-lg font-bold text-foreground">{coinMultiplier}x</p>
              </div>
            </div>

            {/* Monthly & Daily Progress */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {t("Earning Progress", "উপার্জনের অগ্রগতি")}
              </h3>
              <div className="bg-accent/30 rounded-xl p-3 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t("This Month", "এই মাসে")}</span>
                    <span className="font-bold text-foreground">🪙 {monthlyEarned.toLocaleString()} / {monthlyCap.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${monthlyPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{t("Today", "আজ")}</span>
                    <span className="font-bold text-foreground">🪙 {dailyEarned} / {dailyCap}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all" style={{ width: `${dailyCap > 0 ? Math.min(100, (dailyEarned / dailyCap) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* How to Earn */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-secondary" />
                {t("How to Earn Coins", "কিভাবে কয়েন অর্জন করবেন")}
              </h3>
              <div className="space-y-2">
                {EARNING_METHODS.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-accent/30 rounded-lg p-2.5">
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">{t(m.keyEn, m.keyBn)}</p>
                      <p className="text-[10px] text-muted-foreground">{m.xp}</p>
                    </div>
                    <span className="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Coins className="w-3 h-3" /> +{m.coins}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Discount */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                {t("Your Discount Progress", "আপনার ডিসকাউন্ট অগ্রগতি")}
              </h3>
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 border border-primary/10">
                {currentDiscountPercent > 0 ? (
                  <div className="text-center mb-3">
                    <p className="text-2xl font-bold text-primary">{currentDiscountPercent}% {t("OFF", "ছাড়")}</p>
                    <p className="text-sm text-muted-foreground">≈ ৳{discountBdt} {t("savings", "সাশ্রয়")}</p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground mb-3">
                    {t("Start earning coins for discounts!", "ডিসকাউন্টের জন্য কয়েন অর্জন শুরু করুন!")}
                  </p>
                )}
                <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${discountProgress}%` }} />
                </div>
                {coinsToDiscount > 0 && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    🪙 {t(`${coinsToDiscount.toLocaleString()} more coins for max ${maxDiscountPercent}% off`, `আরও ${coinsToDiscount.toLocaleString()} কয়েন = সর্বোচ্চ ${maxDiscountPercent}% ছাড়`)}
                  </p>
                )}
              </div>
            </div>

            {/* Discount Tiers */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-destructive" />
                {t("Discount Tiers", "ডিসকাউন্ট স্তর")}
              </h3>
              <div className="space-y-2">
                {DISCOUNT_TIERS.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between bg-accent/30 rounded-lg p-2.5">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{tier.plan}</p>
                      <p className="text-[10px] text-muted-foreground">{t(`Need ${tier.coinsNeeded} coins`, `${tier.coinsNeeded} কয়েন প্রয়োজন`)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">{t(`Up to ${tier.max}`, `সর্বোচ্চ ${tier.max}`)}</p>
                      <p className="text-[10px] text-secondary font-semibold">{t(`Save ${tier.savings}`, `${tier.savings} সাশ্রয়`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-accent/50 rounded-xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-[11px] text-muted-foreground space-y-1">
                <p>💡 {t("Pro users earn 1.5x coins, Elite users earn 2x coins!", "Pro ব্যবহারকারীরা ১.৫x কয়েন, Elite ব্যবহারকারীরা ২x কয়েন পান!")}</p>
                <p>⏰ {t("Coins expire after 6 months of inactivity.", "৬ মাস নিষ্ক্রিয় থাকলে কয়েন মেয়াদোত্তীর্ণ হয়।")}</p>
                <p>🛒 {t("Use coins in the Reward Store or for subscription discounts!", "রিওয়ার্ড স্টোরে বা সাবস্ক্রিপশন ডিসকাউন্টে কয়েন ব্যবহার করুন!")}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
