import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { BookOpen, Brain, Gamepad2, Compass, Lightbulb, GraduationCap, Wrench, HelpCircle } from "lucide-react";

const features = [
  { icon: BookOpen, en: "Chapter-Based Learning", bn: "অধ্যায়ভিত্তিক শিক্ষা", descEn: "AI breaks chapters into bite-sized modules with YouTube lectures, notes & infographics.", descBn: "AI অধ্যায়কে ছোট মডিউলে ভাগ করে ইউটিউব লেকচার, নোটস ও ইনফোগ্রাফিকস সহ।" },
  { icon: Brain, en: "AI Study Planner", bn: "AI স্টাডি প্ল্যানার", descEn: "Upload your syllabus — AI creates timetable, notes, quizzes & tracks performance.", descBn: "সিলেবাস আপলোড করো — AI টাইমটেবিল, নোটস, কুইজ তৈরি করে ও পারফরম্যান্স ট্র্যাক করে।" },
  { icon: Gamepad2, en: "Gamified Exams", bn: "গেমিফাইড পরীক্ষা", descEn: "Level up with XP, badges & leaderboards. Earn discounts up to 100% off premium!", descBn: "XP, ব্যাজ ও লিডারবোর্ড দিয়ে লেভেল আপ করো। ১০০% পর্যন্ত ডিসকাউন্ট জিতো!" },
  { icon: Compass, en: "Career Mentoring", bn: "ক্যারিয়ার মেন্টরিং", descEn: "AI analyzes your interests & builds a step-by-step career roadmap.", descBn: "AI তোমার আগ্রহ বিশ্লেষণ করে ধাপে ধাপে ক্যারিয়ার রোডম্যাপ তৈরি করে।" },
  { icon: Lightbulb, en: "Skill Learning", bn: "স্কিল শিক্ষা", descEn: "Learn coding, design, freelancing & more with curated tutorials, quizzes & certificates.", descBn: "কোডিং, ডিজাইন, ফ্রিল্যান্সিং শেখো কিউরেটেড টিউটোরিয়াল, কুইজ ও সার্টিফিকেট সহ।" },
  { icon: GraduationCap, en: "Personalized Dashboard", bn: "ব্যক্তিগত ড্যাশবোর্ড", descEn: "AI adapts to your strengths, weaknesses & goals for a unique learning path.", descBn: "AI তোমার শক্তি, দুর্বলতা ও লক্ষ্য অনুযায়ী ইউনিক লার্নিং পাথ তৈরি করে।" },
  { icon: Wrench, en: "Teacher Tools", bn: "শিক্ষক টুলস", descEn: "Upload PDFs — AI generates slides, MCQs, summaries & interactive lessons instantly.", descBn: "PDF আপলোড করো — AI স্লাইড, MCQ, সারাংশ ও ইন্টারেক্টিভ পাঠ তৈরি করে।" },
  { icon: HelpCircle, en: "AI Doubt Solver", bn: "AI সন্দেহ সমাধান", descEn: "Ask anything — get step-by-step explanations with visuals & real-life examples.", descBn: "যেকোনো প্রশ্ন করো — ভিজ্যুয়াল ও বাস্তব উদাহরণ সহ ধাপে ধাপে ব্যাখ্যা পাও।" },
];

const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">{t("Powerful Features", "শক্তিশালী ফিচারসমূহ")}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("Everything a Bangladeshi student needs — from classroom to career.", "ক্লাসরুম থেকে ক্যারিয়ার — বাংলাদেশি শিক্ষার্থীর সবকিছু।")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.en}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-gradient rounded-xl border border-border p-6 hover:shadow-glow-primary transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <f.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-foreground">{t(f.en, f.bn)}</h3>
              <p className="text-sm text-muted-foreground">{t(f.descEn, f.descBn)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
