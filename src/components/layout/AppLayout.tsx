import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BookOpen, Brain, Gamepad2, MessageCircle, Compass, Trophy,
  Moon, Sun, LogOut, Menu, X, Home, GraduationCap,
  Sparkles, FileText, Presentation, Award, Shield, Mic, Globe, Plane, FlaskConical, Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileDropdown from "@/components/ProfileDropdown";
import NotificationBell from "@/components/NotificationBell";

const AppLayout = () => {
  const { user, profile, userPlan, isAdmin, signOut } = useAuth();
  const { t, toggleLang, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const planLabels: Record<string, string> = {
    free: "Free", basic: "Starter", pro: "Pro", premium: "Elite",
  };

  const navItems = [
    { icon: Home, label: t("Dashboard", "ড্যাশবোর্ড"), href: "/dashboard" },
    { icon: GraduationCap, label: t("AI Courses", "AI কোর্স"), href: "/courses" },
    { icon: BookOpen, label: t("Subjects", "বিষয়সমূহ"), href: "/subjects" },
    { icon: MessageCircle, label: t("AI Doubt Solver", "AI সন্দেহ সমাধান"), href: "/doubt-solver" },
    { icon: Brain, label: t("Study Planner", "স্টাডি প্ল্যানার"), href: "/study-plan" },
    { icon: Gamepad2, label: t("Quizzes", "কুইজ"), href: "/quizzes" },
    { icon: Compass, label: t("Career Mentor", "ক্যারিয়ার মেন্টর"), href: "/career" },
    { icon: Trophy, label: t("Skills", "স্কিল শিক্ষা"), href: "/skills" },
    { icon: Sparkles, label: t("AI Summary", "AI সারাংশ"), href: "/smart-summary" },
    { icon: FileText, label: t("Resume Analyzer", "রিজিউমি বিশ্লেষক"), href: "/resume-builder" },
    { icon: Presentation, label: t("Slide Generator", "স্লাইড জেনারেটর"), href: "/slide-generator" },
    { icon: Award, label: t("Scholarship", "স্কলারশিপ"), href: "/scholarship" },
    { icon: Plane, label: t("Study Abroad", "বিদেশে পড়াশোনা"), href: "/study-abroad" },
    { icon: Mic, label: t("Mock Interview", "মক ইন্টারভিউ"), href: "/mock-interview" },
    { icon: Globe, label: t("IELTS Prep", "IELTS প্রস্তুতি"), href: "/ielts" },
    { icon: FlaskConical, label: t("Research Mentor", "রিসার্চ মেন্টর"), href: "/research-mentor" },
    { icon: Wrench, label: t("Project Helper", "প্রজেক্ট হেল্পার"), href: "/project-helper" },
    ...(isAdmin ? [{ icon: Shield, label: t("Admin Panel", "অ্যাডমিন প্যানেল"), href: "/admin" }] : []),
  ];

  const isActive = (href: string) => location.pathname === href;

  const LanguageToggle = ({ size = "default" }: { size?: "default" | "small" }) => {
    const w = size === "small" ? "w-14" : "w-16";
    const h = size === "small" ? "h-7" : "h-8";
    const knob = size === "small" ? "w-6 h-6" : "w-7 h-7";
    const knobEnd = size === "small" ? "calc(100% - 26px)" : "calc(100% - 30px)";
    const fontSize = size === "small" ? "text-[10px]" : "text-xs";

    return (
      <button
        onClick={toggleLang}
        className={`relative flex items-center ${w} ${h} rounded-full bg-muted border border-border cursor-pointer transition-colors hover:bg-accent`}
        title="Toggle language"
      >
        <motion.div
          className={`absolute top-0.5 ${knob} rounded-full bg-primary shadow-md`}
          animate={{ left: lang === "bn" ? "2px" : knobEnd }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
        <span className={`relative z-10 flex-1 text-center ${fontSize} font-bold ${lang === "bn" ? "text-primary-foreground" : "text-muted-foreground"}`}>বাং</span>
        <span className={`relative z-10 flex-1 text-center ${fontSize} font-bold ${lang === "en" ? "text-primary-foreground" : "text-muted-foreground"}`}>EN</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-background font-bangla">
      {/* Desktop Top Header */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border h-14 items-center justify-end px-6 gap-3">
        <LanguageToggle />
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <NotificationBell />
        <ProfileDropdown />
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar fixed inset-y-0 z-40">
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-xl font-bold text-gradient">BoiKhata MM</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                (item as any).premium
                  ? "bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-600/20 text-amber-500 hover:from-yellow-500/30 hover:via-amber-400/30 hover:to-yellow-600/30 font-bold"
                  : isActive(item.href)
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${(item as any).premium ? "text-amber-400" : ""}`} />
              <span>{item.label}</span>
              {(item as any).premium && <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-400" />}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 px-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile?.full_name || t("Student", "শিক্ষার্থী")}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {planLabels[userPlan] || "Free"}
              </span>
            </div>
          </div>
          <Link
            to="/pricing"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-600/20 text-amber-500 hover:from-amber-500/30 hover:via-yellow-400/30 hover:to-amber-600/30 transition-all w-full"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t("Premium", "প্রিমিয়াম")}
            <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-400" />
          </Link>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-sidebar-accent rounded-lg w-full transition-colors"
          >
            <LogOut className="w-4 h-4" /> {t("Logout", "লগআউট")}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-accent">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <Link to="/dashboard" className="text-base font-bold text-gradient whitespace-nowrap">📖 BoiKhata MM</Link>
        <div className="flex items-center gap-1">
          <LanguageToggle size="small" />
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                <span className="text-lg font-bold text-gradient">📖 BoiKhata MM</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-sidebar-accent">
                  <X className="w-5 h-5 text-sidebar-foreground" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      (item as any).premium
                        ? "bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-600/20 text-amber-500 hover:from-yellow-500/30 hover:via-amber-400/30 hover:to-yellow-600/30 font-bold"
                        : isActive(item.href)
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${(item as any).premium ? "text-amber-400" : ""}`} />
                    <span>{item.label}</span>
                    {(item as any).premium && <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-400" />}
                  </Link>
                ))}
              </nav>
              <div className="p-3 border-t border-sidebar-border space-y-2">
                <div className="flex items-center gap-2 px-3">
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground">{profile?.full_name || t("Student", "শিক্ষার্থী")}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{planLabels[userPlan] || "Free"}</span>
                  </div>
                </div>
                <Link
                  to="/pricing"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-600/20 text-amber-500 hover:from-amber-500/30 hover:via-yellow-400/30 hover:to-amber-600/30 transition-all w-full"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {t("Premium", "প্রিমিয়াম")}
                  <Sparkles className="w-3.5 h-3.5 ml-auto text-amber-400" />
                </Link>
                <button onClick={() => { signOut(); navigate("/"); setSidebarOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-sidebar-accent rounded-lg w-full">
                  <LogOut className="w-4 h-4" /> {t("Logout", "লগআউট")}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-14 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
