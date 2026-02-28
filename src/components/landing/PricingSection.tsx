import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

const plans = [
  {
    nameEn: "Free", nameBn: "ফ্রি", price: 0, yearly: 0, period: "", perStudent: false,
    featuresEn: ["Subject browsing", "5 AI explains/day", "Selected YouTube videos", "Basic quizzes", "No downloads"],
    featuresBn: ["বিষয় ব্রাউজিং", "দৈনিক ৫টি AI ব্যাখ্যা", "নির্বাচিত ইউটিউব ভিডিও", "বেসিক কুইজ", "ডাউনলোড নেই"],
    popular: false, color: "border-border",
  },
  {
    nameEn: "Plus", nameBn: "প্লাস", price: 199, yearly: 1999, period: "/mo", perStudent: false,
    featuresEn: ["Unlimited AI Explain Me", "AI handwritten notes", "Syllabus upload & planner", "Chapter exams", "Gamification & XP", "Basic skill learning"],
    featuresBn: ["আনলিমিটেড AI ব্যাখ্যা", "AI হাতে লেখা নোটস", "সিলেবাস আপলোড ও প্ল্যানার", "অধ্যায় পরীক্ষা", "গেমিফিকেশন ও XP", "বেসিক স্কিল শিক্ষা"],
    popular: false, color: "border-border",
  },
  {
    nameEn: "Pro", nameBn: "প্রো", price: 399, yearly: 3999, period: "/mo", perStudent: false,
    featuresEn: ["Everything in Plus", "Career mentoring", "Advanced skills & projects", "Certificates", "PDF downloads", "Performance analytics", "Priority AI response"],
    featuresBn: ["প্লাসের সবকিছু", "ক্যারিয়ার মেন্টরিং", "অ্যাডভান্সড স্কিল ও প্রজেক্ট", "সার্টিফিকেট", "PDF ডাউনলোড", "পারফরম্যান্স অ্যানালিটিক্স", "প্রায়োরিটি AI"],
    popular: true, color: "border-primary",
  },
  {
    nameEn: "Institution", nameBn: "প্রতিষ্ঠান", price: 99, yearly: 0, period: "/student/mo", perStudent: true,
    featuresEn: ["School branding", "Teacher dashboard", "Student analytics", "Bulk accounts", "All Pro features for students"],
    featuresBn: ["স্কুল ব্র্যান্ডিং", "শিক্ষক ড্যাশবোর্ড", "শিক্ষার্থী অ্যানালিটিক্স", "বাল্ক অ্যাকাউন্ট", "শিক্ষার্থীদের জন্য সব প্রো ফিচার"],
    popular: false, color: "border-border",
  },
];

const PricingSection = () => {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{t("Simple Pricing in BDT", "সহজ মূল্য বাংলাদেশি টাকায়")}</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t("Start free, upgrade anytime. Pay with bKash or Nagad.", "ফ্রিতে শুরু করো, যেকোনো সময় আপগ্রেড করো। bKash বা Nagad দিয়ে পে করো।")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.nameEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative card-gradient rounded-xl border-2 ${plan.color} p-6 flex flex-col ${plan.popular ? "shadow-glow-primary" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t("Best Value", "সেরা মূল্য")}
                </div>
              )}

              <h3 className="text-xl font-bold text-foreground mb-1">{t(plan.nameEn, plan.nameBn)}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-foreground">৳{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>
              {plan.yearly > 0 && (
                <p className="text-xs text-muted-foreground mb-4">{t(`or ৳${plan.yearly}/year (save 17%)`, `অথবা ৳${plan.yearly}/বছর (১৭% সাশ্রয়)`)}</p>
              )}

              <ul className="space-y-3 mb-8 flex-1">
                {(t(plan.featuresEn.join("|"), plan.featuresBn.join("|"))).split("|").map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href="/auth"
                className={`w-full py-3 rounded-lg font-semibold transition-all text-sm text-center block ${plan.price === 0 ? "bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground" : "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 text-white shadow-lg shadow-amber-500/30 hover:scale-105 hover:shadow-amber-500/50"}`}
              >
                {plan.price === 0 ? t("Start Free", "ফ্রিতে শুরু") : t("Get Premium", "প্রিমিয়াম নিন")}
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            {t("💳 Pay with bKash, Nagad, or Card • Cancel anytime • All prices in BDT", "💳 bKash, Nagad বা কার্ড দিয়ে পে করো • যেকোনো সময় বাতিল করো • সব মূল্য বাংলাদেশি টাকায়")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
