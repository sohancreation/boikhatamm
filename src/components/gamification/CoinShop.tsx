import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Coins, X, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  coins: number;
  onBuy: (itemType: string, itemId: string, cost: number) => Promise<any>;
  onClose?: () => void;
  ownedItems?: string[];
}

const shopItems = [
  { type: "power_up", id: "streak_shield", icon: "🛡️", nameEn: "Streak Shield", nameBn: "স্ট্রিক শিল্ড", descEn: "Protect your streak for 1 day", descBn: "১ দিনের জন্য স্ট্রিক রক্ষা করো", cost: 50 },
  { type: "theme", id: "dark_pro", icon: "🌙", nameEn: "Dark Pro Theme", nameBn: "ডার্ক প্রো থিম", descEn: "Premium dark theme", descBn: "প্রিমিয়াম ডার্ক থিম", cost: 100 },
  { type: "frame", id: "gold_frame", icon: "🖼️", nameEn: "Gold Frame", nameBn: "গোল্ড ফ্রেম", descEn: "Gold profile frame", descBn: "গোল্ড প্রোফাইল ফ্রেম", cost: 150 },
  { type: "power_up", id: "xp_boost", icon: "⚡", nameEn: "XP Boost (2x)", nameBn: "XP বুস্ট (২x)", descEn: "Double XP for 1 hour", descBn: "১ ঘণ্টার জন্য ডাবল XP", cost: 200 },
  { type: "power_up", id: "ai_premium", icon: "🤖", nameEn: "AI Premium Prompt", nameBn: "AI প্রিমিয়াম প্রম্পট", descEn: "1 premium AI query", descBn: "১টি প্রিমিয়াম AI প্রশ্ন", cost: 75 },
  { type: "frame", id: "diamond_frame", icon: "💎", nameEn: "Diamond Frame", nameBn: "ডায়মন্ড ফ্রেম", descEn: "Diamond profile frame", descBn: "ডায়মন্ড প্রোফাইল ফ্রেম", cost: 500 },
];

export default function CoinShop({ coins, onBuy, onClose, ownedItems = [] }: Props) {
  const { t } = useLanguage();
  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (item: typeof shopItems[0]) => {
    setBuying(item.id);
    try {
      await onBuy(item.type, item.id, item.cost);
    } finally {
      setBuying(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="card-gradient border border-secondary/20 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-secondary" />
          {t("Reward Store", "পুরস্কার স্টোর")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Coins className="w-3 h-3" /> {coins}
          </span>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {shopItems.map((item, i) => {
          const canAfford = coins >= item.cost;
          const owned = ownedItems.includes(item.id);
          const isConsumable = item.type === "power_up";
          const isBuying = buying === item.id;
          const disabled = isBuying || (!canAfford && !owned);
          
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              onClick={() => !disabled && handleBuy(item)}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                owned && !isConsumable
                  ? "border-primary/40 bg-primary/5 cursor-default"
                  : canAfford
                  ? "border-border hover:border-secondary/40 hover:shadow-glow-secondary cursor-pointer bg-background/50"
                  : "border-border/20 opacity-35 cursor-not-allowed bg-muted/20"
              }`}
            >
              {owned && !isConsumable && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              {isBuying && (
                <div className="absolute inset-0 rounded-xl bg-background/60 flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <span className="text-2xl block mb-1.5">{item.icon}</span>
              <span className="text-xs font-semibold text-foreground block leading-tight">{t(item.nameEn, item.nameBn)}</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">{t(item.descEn, item.descBn)}</span>
              <div className="flex items-center gap-1 mt-2">
                {owned && !isConsumable ? (
                  <span className="text-xs font-bold text-primary">{t("Owned", "অর্জিত")}</span>
                ) : (
                  <>
                    <Coins className="w-3 h-3 text-secondary" />
                    <span className="text-xs font-bold text-secondary">{item.cost}</span>
                  </>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
