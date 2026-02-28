import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGamification } from "@/hooks/useGamification";
import {
  Check, Star, X, Loader2, Phone, Hash, Smartphone, Coins, Gift, Tag,
  Lock, Crown, Zap, Shield, Sparkles, Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MERCHANT_NUMBER = "01706028192";
type PaymentMethod = "bkash" | "nagad";

// Locked feature teasers
const lockedFeatures = {
  basic: [
    { label: "Adaptive Quiz", tier: "Pro" },
    { label: "AI Deep Mode", tier: "Elite" },
    { label: "Resume Review", tier: "Elite" },
    { label: "Unlimited Mock Interview", tier: "Elite" },
  ],
  pro: [
    { label: "AI Deep Mode", tier: "Elite" },
    { label: "Resume Review AI", tier: "Elite" },
    { label: "Performance Prediction", tier: "Elite" },
    { label: "Priority AI Response", tier: "Elite" },
  ],
};

const tierConfig: Record<string, {
  color: string;
  gradient: string;
  badgeColor: string;
  icon: any;
  xpMultiplier: string;
  badgeStyle: string;
  annualPrice: number;
}> = {
  basic: {
    color: "text-primary",
    gradient: "from-primary/10 to-primary/5",
    badgeColor: "bg-primary/10 text-primary",
    icon: Shield,
    xpMultiplier: "1x",
    badgeStyle: "text-primary",
    annualPrice: 3999,
  },
  pro: {
    color: "text-secondary",
    gradient: "from-secondary/15 to-primary/10",
    badgeColor: "bg-secondary/10 text-secondary",
    icon: Crown,
    xpMultiplier: "1.5x",
    badgeStyle: "text-amber-500",
    annualPrice: 7999,
  },
  premium: {
    color: "text-purple-500",
    gradient: "from-purple-500/15 to-purple-400/10",
    badgeColor: "bg-purple-500/10 text-purple-500",
    icon: Sparkles,
    xpMultiplier: "2x",
    badgeStyle: "text-purple-500 animate-pulse",
    annualPrice: 14999,
  },
};

const PricingPage = () => {
  const { t, lang } = useLanguage();
  const { userPlan, user } = useAuth();
  const gamification = useGamification();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [useCoinDiscount, setUseCoinDiscount] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_bdt")
      .then(({ data }) => {
        setPlans((data || []).filter(p => p.name_en !== "Free Trial" && p.price_bdt > 0));
      });
    if (user) gamification.fetchStats();
  }, [user]);

  const stats = gamification.stats;
  const coinDiscountPercent = stats?.current_discount_percent || 0;
  const coinDiscountBdt = stats?.discount_bdt || 0;

  const handleSubscribe = (plan: any) => {
    if (!user) { toast.error(t("Please login first", "প্রথমে লগইন করুন")); return; }
    if (plan.price_bdt === 0) return;
    setSelectedPlan(plan);
    setPaymentMethod(null);
    setSenderNumber("");
    setTransactionId("");
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
    setUseCoinDiscount(false);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const { data, error } = await supabase.functions.invoke("validate-payment", {
        body: { action: "validate_coupon", coupon_code: code },
      });
      if (error) throw error;
      if (data?.valid) {
        setCouponDiscount(data.discount_percent);
        setCouponApplied(true);
        toast.success(t(`Coupon applied! ${data.discount_percent}% off`, `কুপন প্রয়োগ হয়েছে! ${data.discount_percent}% ছাড়`));
      } else {
        toast.error(t("Invalid coupon code", "অবৈধ কুপন কোড"));
        setCouponDiscount(0);
        setCouponApplied(false);
      }
    } catch {
      toast.error(t("Could not validate coupon", "কুপন যাচাই করা যায়নি"));
      setCouponDiscount(0);
      setCouponApplied(false);
    }
  };

  const getDisplayPrice = (plan: any) => {
    if (billingCycle === "annual") {
      const config = tierConfig[plan.plan_type];
      return config ? Math.round(config.annualPrice / 12) : plan.price_bdt;
    }
    return plan.price_bdt;
  };

  const getPaymentAmount = (plan: any) => {
    if (billingCycle === "annual") {
      return tierConfig[plan.plan_type]?.annualPrice || plan.price_bdt * 10;
    }
    return plan.price_bdt;
  };

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;
    let price = getPaymentAmount(selectedPlan);
    if (useCoinDiscount && coinDiscountBdt > 0) price -= coinDiscountBdt;
    if (couponApplied && couponDiscount > 0) price -= Math.round(price * couponDiscount / 100);
    return Math.max(0, Math.round(price));
  };

  const handleSubmitPayment = async () => {
    if (!senderNumber.match(/^01[3-9]\d{8}$/)) {
      toast.error(t("Enter a valid 11-digit Bangladeshi mobile number", "একটি সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন"));
      return;
    }
    if (!transactionId.trim() || transactionId.trim().length < 4) {
      toast.error(t("Enter a valid Transaction ID", "একটি সঠিক ট্রানজেকশন আইডি দিন"));
      return;
    }
    if (!paymentMethod || !selectedPlan || !user) return;

    const finalPrice = calculateFinalPrice();
    setSubmitting(true);
    try {
      // Server-side price validation
      const { data: validated, error: valError } = await supabase.functions.invoke("validate-payment", {
        body: {
          action: "calculate_final_price",
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle,
          use_coin_discount: useCoinDiscount,
          coupon_code: couponApplied ? couponCode.trim().toUpperCase() : null,
        },
      });
      if (valError) throw valError;
      if (validated?.error) throw new Error(validated.error);

      const serverPrice = validated?.final_price ?? finalPrice;

      const { error: txError } = await supabase.from("payment_transactions").insert({
        user_id: user.id,
        amount_bdt: serverPrice,
        payment_method: paymentMethod,
        transaction_id: transactionId.trim(),
        status: "pending",
        metadata: {
          sender_number: senderNumber,
          merchant_number: MERCHANT_NUMBER,
          plan_name: validated?.plan_name || selectedPlan.name_en,
          plan_id: selectedPlan.id,
          original_price: validated?.base_price || getPaymentAmount(selectedPlan),
          billing_cycle: billingCycle,
          coin_discount_used: validated?.coin_discount || 0,
          coupon_code: couponApplied ? couponCode.trim().toUpperCase() : null,
          coupon_discount: validated?.coupon_discount || 0,
          server_validated: true,
        },
      });
      if (txError) throw txError;

      const durationDays = billingCycle === "annual" ? 365 : selectedPlan.duration_days;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const { error: subError } = await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "pending",
        payment_method: paymentMethod,
        payment_transaction_id: transactionId.trim(),
      });
      if (subError) throw subError;

      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setSelectedPlan(null); }, 4000);
    } catch (e: any) {
      toast.error(e.message || t("Something went wrong", "কিছু ভুল হয়েছে"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-3">
          {t("Invest in Your Future", "তোমার ভবিষ্যতে বিনিয়োগ করো")}
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t("Choose the plan that fits your learning goals. Pay easily with bKash or Nagad.", "তোমার শেখার লক্ষ্যে সঠিক প্ল্যান বাছো। bKash বা Nagad দিয়ে সহজে পে করো।")}
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center gap-2 bg-muted rounded-full p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("Monthly", "মাসিক")}
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
              billingCycle === "annual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("Annual", "বাৎসরিক")}
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
              {t("2 months free", "২ মাস ফ্রি")}
            </span>
          </button>
        </div>

        {/* Coin discount banner */}
        {user && coinDiscountPercent > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-sm"
          >
            <Coins className="w-4 h-4 text-secondary" />
            <span className="font-semibold text-secondary">
              {t(`You have ${coinDiscountPercent}% coin discount (≈৳${coinDiscountBdt})!`, `আপনার ${coinDiscountPercent}% কয়েন ডিসকাউন্ট আছে (≈৳${coinDiscountBdt})!`)}
            </span>
          </motion.div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {plans.map((plan, i) => {
          const isCurrentPlan = plan.plan_type === userPlan;
          const isPro = plan.plan_type === "pro";
          const isElite = plan.plan_type === "premium";
          const config = tierConfig[plan.plan_type] || tierConfig.basic;
          const TierIcon = config.icon;
          const displayPrice = getDisplayPrice(plan);
          const locked = lockedFeatures[plan.plan_type as keyof typeof lockedFeatures] || [];

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative card-gradient rounded-2xl border-2 p-6 flex flex-col transition-all ${
                isPro
                  ? "border-secondary shadow-lg shadow-secondary/10 md:scale-105 md:-my-2 z-10"
                  : isElite
                  ? "border-purple-500/40"
                  : "border-border"
              }`}
            >
              {/* Best Value badge for Pro */}
              {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                  <Star className="w-3.5 h-3.5" /> {t("Most Popular", "সবচেয়ে জনপ্রিয়")}
                </div>
              )}

              {/* Tier header */}
              <div className="flex items-center gap-2.5 mb-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradient}`}>
                  <TierIcon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {lang === "bn" ? plan.name_bn : plan.name_en}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                {lang === "bn" ? plan.description_bn : plan.description_en}
              </p>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${isPro ? "text-secondary" : isElite ? "text-purple-500" : "text-foreground"}`}>
                    ৳{displayPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">{t("/month", "/মাস")}</span>
                </div>
                {billingCycle === "annual" && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground line-through">৳{plan.price_bdt * 12}/yr</span>
                    <span className="text-xs font-bold text-primary">৳{config.annualPrice}/yr</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                      {t("Save ৳" + (plan.price_bdt * 12 - config.annualPrice), "৳" + (plan.price_bdt * 12 - config.annualPrice) + " সাশ্রয়")}
                    </span>
                  </div>
                )}
                {billingCycle === "monthly" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {t(`or ৳${config.annualPrice}/year (save ৳${plan.price_bdt * 12 - config.annualPrice})`, `অথবা ৳${config.annualPrice}/বছর (৳${plan.price_bdt * 12 - config.annualPrice} সাশ্রয়)`)}
                  </div>
                )}
              </div>

              {/* XP Multiplier badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-4 text-xs font-bold ${config.badgeColor}`}>
                <Zap className="w-3.5 h-3.5" />
                {config.xpMultiplier} XP {t("Multiplier", "মাল্টিপ্লায়ার")}
                {isPro && <span className="ml-1">⚡</span>}
                {isElite && <span className="ml-1">👑</span>}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-4 flex-1">
                {(plan.features as string[])?.map((feat: string) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isPro ? "text-secondary" : isElite ? "text-purple-500" : "text-primary"}`} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Locked feature teasers */}
              {locked.length > 0 && (
                <div className="mb-4 space-y-1.5 border-t border-border/50 pt-3">
                  {locked.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <Lock className="w-3 h-3" />
                      <span>{item.label}</span>
                      <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.tier === "Elite" ? "bg-purple-500/10 text-purple-500" : "bg-secondary/10 text-secondary"
                      }`}>
                        {item.tier} {t("Only", "শুধু")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Badge preview */}
              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-muted/50 border border-border/50">
                <Trophy className={`w-4 h-4 ${config.badgeStyle}`} />
                <span className="text-xs text-muted-foreground">
                  {plan.plan_type === "basic" && t("Blue badges", "নীল ব্যাজ")}
                  {plan.plan_type === "pro" && t("Gold premium badges", "গোল্ড প্রিমিয়াম ব্যাজ")}
                  {plan.plan_type === "premium" && t("Animated purple glow badge ✨", "অ্যানিমেটেড পার্পল গ্লো ব্যাজ ✨")}
                </span>
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                  isCurrentPlan
                    ? "bg-muted text-muted-foreground cursor-default"
                    : isPro
                    ? "bg-secondary text-secondary-foreground hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-secondary/20"
                    : isElite
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:opacity-90 hover:scale-[1.02] shadow-lg shadow-purple-500/20"
                    : "bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02]"
                }`}
              >
                {isCurrentPlan
                  ? t("Current Plan", "বর্তমান প্ল্যান")
                  : t("Subscribe Now", "এখনই সাবস্ক্রাইব")}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Upgrade pressure section */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-10 card-gradient border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">
          🎮 {t("Why Upgrade? Gamification Perks", "কেন আপগ্রেড করবেন? গেমিফিকেশন সুবিধা")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
            <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground mb-1">{t("XP Multiplier", "XP মাল্টিপ্লায়ার")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Starter: 1x → Pro: 1.5x → Elite: 2x", "স্টার্টার: ১x → প্রো: ১.৫x → এলিট: ২x")}
            </p>
            <p className="text-[11px] text-primary mt-1 font-semibold">{t("Level up faster!", "দ্রুত লেভেল আপ করো!")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-secondary/5 border border-secondary/10">
            <Crown className="w-6 h-6 text-secondary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground mb-1">{t("Exclusive Ranks", "এক্সক্লুসিভ র‍্যাংক")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Elite-only: Academic Warrior, Mastermind, Elite Scholar", "শুধু এলিট: একাডেমিক ওয়ারিয়র, মাস্টারমাইন্ড, এলিট স্কলার")}
            </p>
            <p className="text-[11px] text-secondary mt-1 font-semibold">{t("Identity sells!", "পরিচয়ই শক্তি!")}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground mb-1">{t("Special Badges", "বিশেষ ব্যাজ")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Starter: Blue → Pro: Gold → Elite: Animated Purple Glow", "স্টার্টার: নীল → প্রো: গোল্ড → এলিট: অ্যানিমেটেড পার্পল গ্লো")}
            </p>
            <p className="text-[11px] text-purple-500 mt-1 font-semibold">{t("Stand out!", "আলাদা হও!")}</p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">
          💳 {t("Payment methods: bKash & Nagad (Send Money)", "পেমেন্ট পদ্ধতি: bKash ও Nagad (সেন্ড মানি)")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("All prices in BDT. Your subscription will be activated after verification.", "সব মূল্য বাংলাদেশি টাকায়। যাচাইয়ের পর সাবস্ক্রিপশন সক্রিয় হবে।")}
        </p>
      </div>

      {/* ═══ PAYMENT MODAL ═══ */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => !submitting && setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto my-auto"
            >
              {showSuccess ? (
                <div className="p-8 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <Check className="w-16 h-16 text-primary mx-auto mb-4 p-3 bg-primary/10 rounded-full" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {t("Payment Submitted!", "পেমেন্ট জমা হয়েছে!")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t(
                      "Your subscription will be activated within 1-2 hours after verification. You'll get a notification.",
                      "যাচাইয়ের পর ১-২ ঘন্টার মধ্যে আপনার সাবস্ক্রিপশন সক্রিয় হবে। আপনি নোটিফিকেশন পাবেন।"
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {t("Subscribe to", "সাবস্ক্রাইব করুন")} {lang === "bn" ? selectedPlan.name_bn : selectedPlan.name_en}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-primary">
                          ৳{getPaymentAmount(selectedPlan)}
                        </p>
                        <span className="text-sm text-muted-foreground font-normal">
                          {billingCycle === "annual" ? t("/year", "/বছর") : t("/month", "/মাস")}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPlan(null)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Discount Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-foreground mb-2 block flex items-center gap-2">
                        <Gift className="w-4 h-4 text-secondary" />
                        {t("Apply Discounts", "ডিসকাউন্ট প্রয়োগ করুন")}
                      </label>

                      {/* Coin Discount Toggle */}
                      {user && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          useCoinDiscount ? "border-secondary/40 bg-secondary/5" : "border-border"
                        }`}>
                          <Coins className="w-5 h-5 text-secondary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {t(`You have ${stats?.coins || 0} coins`, `আপনার ${stats?.coins || 0} কয়েন আছে`)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {coinDiscountPercent > 0
                                ? t(`Use for ${coinDiscountPercent}% discount (≈৳${coinDiscountBdt} off)`, `${coinDiscountPercent}% ডিসকাউন্ট (≈৳${coinDiscountBdt} ছাড়)`)
                                : t("Earn more coins to unlock discounts!", "আরো কয়েন অর্জন করুন!")}
                            </p>
                          </div>
                          <div
                            role="switch"
                            aria-checked={useCoinDiscount}
                            tabIndex={coinDiscountPercent > 0 ? 0 : -1}
                            onClick={() => coinDiscountPercent > 0 && setUseCoinDiscount(!useCoinDiscount)}
                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); coinDiscountPercent > 0 && setUseCoinDiscount(!useCoinDiscount); } }}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-2 focus:ring-offset-background ${
                              coinDiscountPercent <= 0 ? "opacity-40 cursor-not-allowed border-muted" : "border-transparent"
                            } ${useCoinDiscount ? "bg-secondary" : "bg-foreground"}`}
                          >
                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                              useCoinDiscount ? "translate-x-5" : "translate-x-0"
                            }`} />
                          </div>
                        </div>
                      )}

                      {/* Coupon Code */}
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={couponCode}
                            onChange={e => { setCouponCode(e.target.value); setCouponApplied(false); setCouponDiscount(0); }}
                            placeholder={t("Coupon code", "কুপন কোড")}
                            className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <button onClick={applyCoupon} disabled={!couponCode.trim()}
                          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-40">
                          {t("Apply", "প্রয়োগ")}
                        </button>
                      </div>
                      {couponApplied && (
                        <p className="text-xs text-primary font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t(`${couponDiscount}% coupon applied!`, `${couponDiscount}% কুপন প্রয়োগ হয়েছে!`)}
                        </p>
                      )}

                      {/* Final Price */}
                      {(useCoinDiscount || couponApplied) && (
                        <div className="bg-accent/50 rounded-xl p-3 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t("Original Price", "মূল মূল্য")}</span>
                            <span>৳{getPaymentAmount(selectedPlan)}</span>
                          </div>
                          {useCoinDiscount && coinDiscountBdt > 0 && (
                            <div className="flex justify-between text-xs text-secondary">
                              <span>🪙 {t("Coin Discount", "কয়েন ডিসকাউন্ট")} (-{coinDiscountPercent}%)</span>
                              <span>-৳{coinDiscountBdt}</span>
                            </div>
                          )}
                          {couponApplied && couponDiscount > 0 && (
                            <div className="flex justify-between text-xs text-primary">
                              <span>🏷️ {t("Coupon", "কুপন")} (-{couponDiscount}%)</span>
                              <span>-৳{Math.round((getPaymentAmount(selectedPlan) - (useCoinDiscount ? coinDiscountBdt : 0)) * couponDiscount / 100)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                            <span>{t("Final Price", "চূড়ান্ত মূল্য")}</span>
                            <span className="text-primary">৳{calculateFinalPrice()}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 1: Payment method */}
                    <div>
                      <label className="text-sm font-bold text-foreground mb-2 block">
                        {t("Step 1: Choose Payment Method", "ধাপ ১: পেমেন্ট পদ্ধতি বাছুন")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setPaymentMethod("bkash")}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            paymentMethod === "bkash"
                              ? "border-[hsl(340,80%,50%)] bg-[hsl(340,80%,50%)]/10 ring-1 ring-[hsl(340,80%,50%)]"
                              : "border-border bg-card hover:border-[hsl(340,80%,50%)]/40"
                          }`}>
                          <span className="text-2xl block mb-1">📱</span>
                          <span className="text-sm font-bold text-foreground">bKash</span>
                        </button>
                        <button onClick={() => setPaymentMethod("nagad")}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            paymentMethod === "nagad"
                              ? "border-[hsl(25,90%,50%)] bg-[hsl(25,90%,50%)]/10 ring-1 ring-[hsl(25,90%,50%)]"
                              : "border-border bg-card hover:border-[hsl(25,90%,50%)]/40"
                          }`}>
                          <span className="text-2xl block mb-1">💳</span>
                          <span className="text-sm font-bold text-foreground">Nagad</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Send money */}
                    {paymentMethod && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="text-sm font-bold text-foreground mb-2 block">
                          {t("Step 2: Send Money", "ধাপ ২: টাকা পাঠান")}
                        </label>
                        <div className="bg-accent/50 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("Send Money to:", "সেন্ড মানি করুন:")}</span>
                            <span className="text-base font-bold text-foreground font-mono">{MERCHANT_NUMBER}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("Amount:", "পরিমাণ:")}</span>
                            <span className="text-base font-bold text-primary">৳{calculateFinalPrice()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{t("Via:", "মাধ্যম:")}</span>
                            <span className="text-sm font-semibold text-foreground capitalize">{paymentMethod} {t("Send Money", "সেন্ড মানি")}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                            {paymentMethod === "bkash"
                              ? t("Open bKash → Send Money → 01706028192 → ৳" + calculateFinalPrice(), "bKash খুলুন → সেন্ড মানি → 01706028192 → ৳" + calculateFinalPrice())
                              : t("Open Nagad → Send Money → 01706028192 → ৳" + calculateFinalPrice(), "Nagad খুলুন → সেন্ড মানি → 01706028192 → ৳" + calculateFinalPrice())}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Details */}
                    {paymentMethod && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <label className="text-sm font-bold text-foreground mb-3 block">
                          {t("Step 3: Enter Payment Details", "ধাপ ৩: পেমেন্ট তথ্য দিন")}
                        </label>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {t("Your Mobile Number", "আপনার মোবাইল নম্বর")}
                            </label>
                            <input type="tel" value={senderNumber}
                              onChange={(e) => setSenderNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                              placeholder="01XXXXXXXXX" maxLength={11}
                              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {t("Transaction ID (TrxID)", "ট্রানজেকশন আইডি (TrxID)")}
                            </label>
                            <input type="text" value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder={paymentMethod === "bkash" ? "e.g. TrxID: AK17XXXXX" : "e.g. TrxID: NAXXXXX"}
                              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    {paymentMethod && (
                      <button onClick={handleSubmitPayment}
                        disabled={submitting || !senderNumber || !transactionId.trim()}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                        {submitting ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> {t("Submitting...", "জমা হচ্ছে...")}</>
                        ) : (
                          <><Smartphone className="w-5 h-5" /> {t("Submit Payment", "পেমেন্ট জমা দিন")}
                            {(useCoinDiscount || couponApplied) && ` • ৳${calculateFinalPrice()}`}</>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingPage;
