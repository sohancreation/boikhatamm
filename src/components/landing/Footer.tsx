import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="py-12 border-t border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-gradient mb-3">📖 BoiKhata MM</h3>
            <p className="text-sm text-muted-foreground">
              {t("The AI mentor every Bangladeshi student deserves.", "প্রতিটি বাংলাদেশি শিক্ষার্থীর প্রাপ্য AI মেন্টর।")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">{t("Quick Links", "দ্রুত লিংক")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">{t("Features", "ফিচার")}</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">{t("Pricing", "মূল্য")}</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">{t("How It Works", "কিভাবে কাজ করে")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">{t("Payment Methods", "পেমেন্ট পদ্ধতি")}</h4>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span className="bg-accent px-3 py-1.5 rounded-lg font-semibold">bKash</span>
              <span className="bg-accent px-3 py-1.5 rounded-lg font-semibold">Nagad</span>
              <span className="bg-accent px-3 py-1.5 rounded-lg font-semibold">Card</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 BoiKhata MM. {t("All rights reserved.", "সর্বস্বত্ব সংরক্ষিত।")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
