import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const steps = [
  { num: "01", en: "Register & Set Goals", bn: "রেজিস্টার ও লক্ষ্য সেট করো", descEn: "Sign up with your class, board & interests. AI personalizes your journey.", descBn: "তোমার ক্লাস, বোর্ড ও আগ্রহ দিয়ে সাইন আপ করো। AI তোমার যাত্রা ব্যক্তিগত করবে।" },
  { num: "02", en: "Learn & Practice", bn: "শেখো ও অনুশীলন করো", descEn: "Study with AI-curated videos, notes & quizzes. Level up with gamified exams.", descBn: "AI-কিউরেটেড ভিডিও, নোটস ও কুইজ দিয়ে পড়ো। গেমিফাইড পরীক্ষায় লেভেল আপ করো।" },
  { num: "03", en: "Grow & Succeed", bn: "বেড়ে ওঠো ও সফল হও", descEn: "Master skills, get career guidance & earn certificates. Your future starts here.", descBn: "স্কিল আয়ত্ত করো, ক্যারিয়ার গাইডেন্স পাও ও সার্টিফিকেট অর্জন করো।" },
];

const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{t("How It Works", "কিভাবে কাজ করে")}</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-hero-gradient text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-glow-primary">
                {s.num}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{t(s.en, s.bn)}</h3>
              <p className="text-muted-foreground text-sm">{t(s.descEn, s.descBn)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
