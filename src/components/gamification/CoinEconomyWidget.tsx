import { motion } from "framer-motion";
import { Coins, TrendingUp, Shield, Zap, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CoinEconomyWidgetProps {
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
}

const CoinEconomyWidget = ({
  coins, monthlyEarned, monthlyCap, dailyEarned, dailyCap,
  coinMultiplier, discountProgress, coinsToDiscount,
  currentDiscountPercent, discountBdt, maxDiscountPercent, planPrice,
}: CoinEconomyWidgetProps) => {
  const { t } = useLanguage();
  const monthlyPercent = monthlyCap > 0 ? Math.round((monthlyEarned / monthlyCap) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient border border-border rounded-xl p-4 space-y-4"
    >
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Coins className="w-4 h-4 text-primary" />
        {t("Coin Economy", "কয়েন ইকোনমি")}
        {coinMultiplier > 1 && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Zap className="w-3 h-3" /> {coinMultiplier}x {t("Boost", "বুস্ট")}
          </span>
        )}
      </h3>

      {/* Monthly Progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{t("This Month", "এই মাসে")}</span>
          <span className="font-bold text-foreground">
            🪙 {monthlyEarned.toLocaleString()} / {monthlyCap.toLocaleString()}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${monthlyPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
          />
        </div>
      </div>

      {/* Discount Progress - psychological nudge */}
      <div className="bg-accent/50 rounded-lg p-3 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-secondary" />
          <span className="text-xs font-bold text-foreground">
            {currentDiscountPercent > 0
              ? t(
                  `You've earned ${currentDiscountPercent}% off (≈${discountBdt} BDT)!`,
                  `আপনি ${currentDiscountPercent}% ছাড় অর্জন করেছেন (≈${discountBdt} টাকা)!`
                )
              : t("Earn coins for subscription discounts!", "সাবস্ক্রিপশন ডিসকাউন্টের জন্য কয়েন অর্জন করুন!")
            }
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${discountProgress}%` }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
          />
        </div>
        {coinsToDiscount > 0 ? (
          <p className="text-[11px] text-muted-foreground">
            🪙 {t(
              `${coinsToDiscount.toLocaleString()} more coins for max ${maxDiscountPercent}% discount!`,
              `আরও ${coinsToDiscount.toLocaleString()} কয়েন = সর্বোচ্চ ${maxDiscountPercent}% ছাড়!`
            )}
          </p>
        ) : (
          <p className="text-[11px] text-primary font-bold">
            🎉 {t("Max discount unlocked!", "সর্বোচ্চ ছাড় আনলক!")}
          </p>
        )}
      </div>

      {/* Daily cap info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {t("Today", "আজ")}: {dailyEarned}/{dailyCap}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {t("Total", "মোট")}: 🪙 {coins.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};

export default CoinEconomyWidget;
