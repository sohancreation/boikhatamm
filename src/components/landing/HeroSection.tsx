import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 z-0">
        <img src={heroBg} alt="Students learning with AI" className="w-full h-full object-cover opacity-30 dark:opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-semibold mb-6">
            {t("🚀 AI-Powered Education for Bangladesh", "🚀 বাংলাদেশের জন্য AI-চালিত শিক্ষা")}
          </span>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">{t("BoiKhata MM", "বইখাতা এমএম")}</span>
            <br />
            <span className="text-foreground">{t("Your AI Mentor", "তোমার AI মেন্টর")}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t(
              "The all-in-one AI learning platform for Class 6–University. Study smarter, learn skills, plan your career — all in Bangla & English.",
              "ষষ্ঠ শ্রেণি থেকে বিশ্ববিদ্যালয় পর্যন্ত সকলের জন্য AI শিক্ষা প্ল্যাটফর্ম। স্মার্টলি পড়ো, স্কিল শেখো, ক্যারিয়ার প্ল্যান করো — বাংলা ও ইংরেজিতে।"
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#pricing" className="bg-hero-gradient text-primary-foreground px-8 py-4 rounded-xl text-lg font-bold shadow-glow-primary hover:scale-105 transition-transform">
              {t("Start Free Today", "আজই ফ্রিতে শুরু করো")}
            </a>
            <a href="#features" className="bg-card text-foreground border border-border px-8 py-4 rounded-xl text-lg font-semibold hover:border-primary transition-colors">
              {t("Explore Features", "ফিচার দেখো")}
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground"
        >
          {[
            t("📚 Class 6–12, SSC, HSC, University", "📚 ৬ষ্ঠ–১২শ, SSC, HSC, বিশ্ববিদ্যালয়"),
            t("🤖 AI Doubt Solver", "🤖 AI সন্দেহ সমাধান"),
            t("🎮 Gamified Learning", "🎮 গেমিফাইড লার্নিং"),
            t("💼 Career Mentoring", "💼 ক্যারিয়ার মেন্টরিং"),
          ].map((item) => (
            <span key={item} className="bg-accent/60 px-3 py-1.5 rounded-full">{item}</span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
