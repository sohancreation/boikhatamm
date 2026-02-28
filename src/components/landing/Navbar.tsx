import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ProfileDropdown from "@/components/ProfileDropdown";

const Navbar = () => {
  const { lang, toggleLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "#features", label: t("Features", "ফিচারসমূহ") },
    { href: "#pricing", label: t("Pricing", "মূল্য") },
    { href: "#how-it-works", label: t("How It Works", "কিভাবে কাজ করে") },
    { href: "#contact", label: t("Contact", "যোগাযোগ") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="#" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gradient">📖</span>
          <span className="text-xl font-bold text-gradient">BoiKhata MM</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="relative flex items-center w-16 h-8 rounded-full bg-muted border border-border cursor-pointer transition-colors hover:bg-accent"
            title="Toggle language"
          >
            <motion.div
              className="absolute top-0.5 w-7 h-7 rounded-full bg-primary shadow-md"
              animate={{ left: lang === "bn" ? "2px" : "calc(100% - 30px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            />
            <span className={`relative z-10 flex-1 text-center text-xs font-bold ${lang === "bn" ? "text-primary-foreground" : "text-muted-foreground"}`}>বাং</span>
            <span className={`relative z-10 flex-1 text-center text-xs font-bold ${lang === "en" ? "text-primary-foreground" : "text-muted-foreground"}`}>EN</span>
          </button>

          {/* Dark Mode */}
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-accent-foreground" title="Toggle theme">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile / Auth */}
          {user ? (
            <ProfileDropdown />
          ) : (
            <Link to="/auth" className="hidden md:inline-flex bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("Get Started", "শুরু করুন")}
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="md:hidden overflow-hidden bg-card border-b border-border">
            <div className="flex flex-col gap-3 p-4">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>
                  {l.label}
                </a>
              ))}
              <a href="#pricing" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold text-center">
                {t("Get Started", "শুরু করুন")}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
