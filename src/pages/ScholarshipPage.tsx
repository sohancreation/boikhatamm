import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  GraduationCap, Search, Globe, FileText, Plane, ClipboardCheck,
  Loader2, Copy, Check, Download, Sparkles,
  MapPin, DollarSign, BookOpen, Award, Compass, Building2, User,
  ChevronRight, ChevronLeft, PartyPopper, Rocket, Star, Trophy, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import HistoryDrawer from "@/components/history/HistoryDrawer";

type Tab = "journey" | "scholarship" | "documents" | "visa" | "checklist";

const useStreamer = () => {
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const stream = useCallback(async (body: object) => {
    setIsLoading(true);
    setResult("");
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scholarship-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(body),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed");
      }
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const c = JSON.parse(json).choices?.[0]?.delta?.content;
            if (c) { full += c; setResult(full); }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, stream, setResult };
};

// ─── Selectable Data ───
const COUNTRIES = [
  { id: "USA", flag: "🇺🇸", label: "USA", labelBn: "যুক্তরাষ্ট্র" },
  { id: "UK", flag: "🇬🇧", label: "United Kingdom", labelBn: "যুক্তরাজ্য" },
  { id: "Canada", flag: "🇨🇦", label: "Canada", labelBn: "কানাডা" },
  { id: "Australia", flag: "🇦🇺", label: "Australia", labelBn: "অস্ট্রেলিয়া" },
  { id: "Germany", flag: "🇩🇪", label: "Germany", labelBn: "জার্মানি" },
  { id: "Japan", flag: "🇯🇵", label: "Japan", labelBn: "জাপান" },
  { id: "Malaysia", flag: "🇲🇾", label: "Malaysia", labelBn: "মালয়েশিয়া" },
  { id: "South Korea", flag: "🇰🇷", label: "South Korea", labelBn: "দক্ষিণ কোরিয়া" },
  { id: "Sweden", flag: "🇸🇪", label: "Sweden", labelBn: "সুইডেন" },
  { id: "Netherlands", flag: "🇳🇱", label: "Netherlands", labelBn: "নেদারল্যান্ডস" },
  { id: "France", flag: "🇫🇷", label: "France", labelBn: "ফ্রান্স" },
  { id: "Italy", flag: "🇮🇹", label: "Italy", labelBn: "ইতালি" },
  { id: "China", flag: "🇨🇳", label: "China", labelBn: "চীন" },
  { id: "New Zealand", flag: "🇳🇿", label: "New Zealand", labelBn: "নিউজিল্যান্ড" },
  { id: "Finland", flag: "🇫🇮", label: "Finland", labelBn: "ফিনল্যান্ড" },
  { id: "Singapore", flag: "🇸🇬", label: "Singapore", labelBn: "সিঙ্গাপুর" },
];

const FIELDS = [
  { id: "Computer Science", icon: "💻", label: "Computer Science & IT", labelBn: "কম্পিউটার সায়েন্স ও আইটি" },
  { id: "Engineering", icon: "⚙️", label: "Engineering", labelBn: "ইঞ্জিনিয়ারিং" },
  { id: "Business & MBA", icon: "📊", label: "Business & MBA", labelBn: "ব্যবসা ও এমবিএ" },
  { id: "Medicine & Health", icon: "🏥", label: "Medicine & Health", labelBn: "মেডিসিন ও স্বাস্থ্য" },
  { id: "Law", icon: "⚖️", label: "Law", labelBn: "আইন" },
  { id: "Science", icon: "🔬", label: "Science (Physics, Chemistry, Bio)", labelBn: "বিজ্ঞান" },
  { id: "Arts & Humanities", icon: "🎨", label: "Arts & Humanities", labelBn: "আর্টস ও মানবিক" },
  { id: "Economics & Finance", icon: "💰", label: "Economics & Finance", labelBn: "অর্থনীতি ও ফাইন্যান্স" },
  { id: "Architecture", icon: "🏛️", label: "Architecture", labelBn: "আর্কিটেকচার" },
  { id: "Agriculture", icon: "🌾", label: "Agriculture", labelBn: "কৃষি" },
  { id: "Education", icon: "📚", label: "Education", labelBn: "শিক্ষা" },
  { id: "Social Science", icon: "🌍", label: "Social Science", labelBn: "সমাজবিজ্ঞান" },
];

const DEGREE_LEVELS = [
  { id: "bachelors", icon: "🎓", label: "Bachelor's", labelBn: "স্নাতক (অনার্স)" },
  { id: "masters", icon: "📜", label: "Master's (MS/MA/MBA)", labelBn: "স্নাতকোত্তর" },
  { id: "phd", icon: "🔬", label: "PhD / Research", labelBn: "পিএইচডি / গবেষণা" },
  { id: "diploma", icon: "📋", label: "Diploma / Certificate", labelBn: "ডিপ্লোমা / সার্টিফিকেট" },
];

const BUDGETS = [
  { id: "full-fund", icon: "🆓", label: "Full Funding / Scholarship", labelBn: "পূর্ণ ফান্ডিং / স্কলারশিপ" },
  { id: "low", icon: "💵", label: "Low (5-15 Lakh BDT/year)", labelBn: "কম (৫-১৫ লক্ষ/বছর)" },
  { id: "medium", icon: "💳", label: "Medium (15-30 Lakh BDT/year)", labelBn: "মাঝারি (১৫-৩০ লক্ষ/বছর)" },
  { id: "high", icon: "💎", label: "High (30+ Lakh BDT/year)", labelBn: "বেশি (৩০+ লক্ষ/বছর)" },
];

const TIMELINES = [
  { id: "next-intake", icon: "🚀", label: "Next Intake (ASAP)", labelBn: "পরবর্তী ইনটেক (দ্রুত)" },
  { id: "6-months", icon: "📅", label: "Within 6 Months", labelBn: "৬ মাসের মধ্যে" },
  { id: "1-year", icon: "🗓️", label: "Within 1 Year", labelBn: "১ বছরের মধ্যে" },
  { id: "2-years", icon: "⏳", label: "Within 2 Years", labelBn: "২ বছরের মধ্যে" },
];

const CONGRATS = [
  { icon: PartyPopper, msg: "Great choice!", msgBn: "দারুণ পছন্দ!" },
  { icon: Rocket, msg: "Awesome! Moving forward!", msgBn: "চমৎকার! এগিয়ে যাচ্ছি!" },
  { icon: Star, msg: "Excellent pick!", msgBn: "অসাধারণ!" },
  { icon: Trophy, msg: "You're on the right track!", msgBn: "আপনি সঠিক পথে!" },
  { icon: Sparkles, msg: "Almost there!", msgBn: "প্রায় শেষ!" },
  { icon: PartyPopper, msg: "Profile complete! Let's get your roadmap!", msgBn: "প্রোফাইল সম্পন্ন! রোডম্যাপ নিন!" },
];

const ScholarshipPage = () => {
  const { t, lang } = useLanguage();
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("journey");
  const [copied, setCopied] = useState(false);
  const { result, isLoading, stream, setResult } = useStreamer();
  const [showResult, setShowResult] = useState(false);
  const [resultTitle, setResultTitle] = useState("");

  // ─── Journey wizard state ───
  const [journeyStep, setJourneyStep] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");
  const [jGpa, setJGpa] = useState("");
  const [jIelts, setJIelts] = useState("");
  const [jWorkExp, setJWorkExp] = useState("");
  const [jResearch, setJResearch] = useState("");
  const [jGoals, setJGoals] = useState("");

  // ─── Scholarship finder ───
  const [schLevel, setSchLevel] = useState("hsc");
  const [schGpa, setSchGpa] = useState("");
  const [schField, setSchField] = useState("");
  const [schNeed, setSchNeed] = useState("moderate");
  const [schCountry, setSchCountry] = useState("");
  const [schInfo, setSchInfo] = useState("");
  const [schScope, setSchScope] = useState("all");
  const [schInstitution, setSchInstitution] = useState("");
  const [schDistrict, setSchDistrict] = useState("");

  // Document, Visa, Checklist state
  const [docType, setDocType] = useState("SOP");
  const [docPurpose, setDocPurpose] = useState("");
  const [docTarget, setDocTarget] = useState("");
  const [docCountry, setDocCountry] = useState("");
  const [docField, setDocField] = useState("");
  const [docBg, setDocBg] = useState("");
  const [visaCountry, setVisaCountry] = useState("USA");
  const [visaUni, setVisaUni] = useState("");
  const [visaProgram, setVisaProgram] = useState("");
  const [visaFunding, setVisaFunding] = useState("");
  const [clCountry, setClCountry] = useState("USA");
  const [clDegree, setClDegree] = useState("bachelors");
  const [clUni, setClUni] = useState("");

  const countries = COUNTRIES.map(c => c.id);
  const documentTypes = ["SOP (Statement of Purpose)", "Motivation Letter", "Personal Statement", "CV for Scholarship", "Recommendation Letter Draft", "Study Plan"];

  const tabs: { id: Tab; icon: typeof Search; label: string; desc: string }[] = [
    { id: "journey", icon: Rocket, label: t("Study Abroad Journey", "বিদেশে পড়ার যাত্রা"), desc: t("Step by step", "ধাপে ধাপে") },
    { id: "scholarship", icon: Search, label: t("Scholarship Finder", "স্কলারশিপ খুঁজুন"), desc: t("Find & match", "খোঁজ ও ম্যাচ") },
    { id: "documents", icon: FileText, label: t("Document Help", "ডকুমেন্ট সাহায্য"), desc: t("SOP, CV", "SOP, CV") },
    { id: "visa", icon: Plane, label: t("Visa Prep", "ভিসা প্রস্তুতি"), desc: t("Mock interview", "মক ইন্টারভিউ") },
    { id: "checklist", icon: ClipboardCheck, label: t("Checklist", "চেকলিস্ট"), desc: t("Tracker", "ট্র্যাকার") },
  ];

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use Scholarship Mentor", "স্কলারশিপ মেন্টর ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t("Copied!", "কপি হয়েছে!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stream and show results in full-page view
  const streamAndShow = (body: object, title: string) => {
    setResultTitle(title);
    setShowResult(true);
    stream(body);
    // Save scholarship search after streaming completes
    if (user) {
      const checkSave = setInterval(() => {
        if (!isLoading) {
          clearInterval(checkSave);
          supabase.from("scholarship_searches").insert({
            user_id: user.id,
            search_params: { ...body, title } as any,
            results_data: { title, tab: activeTab } as any,
          } as any).then(() => {});
        }
      }, 2000);
      setTimeout(() => clearInterval(checkSave), 60000);
    }
  };

  const handleBackFromResult = () => {
    setShowResult(false);
    setResult("");
  };

  // ─── Journey step navigation with congrats ───
  const goNextStep = () => {
    setShowCongrats(true);
    setTimeout(() => {
      setShowCongrats(false);
      setJourneyStep(s => s + 1);
    }, 1500);
  };

  const goPrevStep = () => setJourneyStep(s => Math.max(0, s - 1));

  const journeySteps = [
    { title: t("Where do you want to study?", "আপনি কোথায় পড়তে চান?"), titleBn: "দেশ নির্বাচন করুন" },
    { title: t("What do you want to study?", "কী পড়তে চান?"), titleBn: "বিষয় নির্বাচন করুন" },
    { title: t("Which degree level?", "কোন ডিগ্রি?"), titleBn: "ডিগ্রি স্তর" },
    { title: t("What's your budget?", "আপনার বাজেট কত?"), titleBn: "বাজেট" },
    { title: t("Your academic profile", "আপনার একাডেমিক প্রোফাইল"), titleBn: "প্রোফাইল" },
    { title: t("When do you want to go?", "কখন যেতে চান?"), titleBn: "সময়সীমা" },
  ];

  const canProceed = () => {
    switch (journeyStep) {
      case 0: return !!selectedCountry;
      case 1: return !!selectedField;
      case 2: return !!selectedDegree;
      case 3: return !!selectedBudget;
      case 4: return !!jGpa;
      case 5: return !!selectedTimeline;
      default: return false;
    }
  };

  const handleJourneyComplete = () => {
    setShowCongrats(true);
    setTimeout(() => {
      setShowCongrats(false);
      streamAndShow({
        action: "higher-studies-mentor",
        data: {
          name: profile?.full_name?.split(" ")[0] || "",
          currentLevel: selectedDegree === "bachelors" ? "hsc" : selectedDegree === "masters" ? "bachelors" : "masters",
          field: selectedField,
          gpa: jGpa,
          targetDegree: selectedDegree,
          dreamCountries: selectedCountry,
          budget: selectedBudget,
          testScores: jIelts || "Not taken",
          workExperience: jWorkExp || "None",
          researchExperience: jResearch || "None",
          goals: jGoals || "Study abroad",
          timeline: selectedTimeline,
        },
        language: lang,
      }, t("Your Complete Study Abroad Roadmap", "আপনার সম্পূর্ণ বিদেশে পড়ার রোডম্যাপ"));
    }, 1500);
  };

  const SelectableCard = ({ selected, onClick, icon, label, sublabel }: { selected: boolean; onClick: () => void; icon: string; label: string; sublabel?: string }) => (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
        selected
          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg"
          : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
      }`}
    >
      {selected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
          <Check className="w-5 h-5 text-primary" />
        </motion.div>
      )}
      <span className="text-2xl block mb-1">{icon}</span>
      <span className="text-sm font-semibold text-foreground block">{label}</span>
      {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
    </motion.button>
  );

  const ProgressBar = () => (
    <div className="flex items-center gap-1.5 mb-6">
      {journeySteps.map((_, i) => (
        <div key={i} className="flex-1 flex items-center gap-1.5">
          <div className={`h-2 flex-1 rounded-full transition-all duration-500 ${
            i < journeyStep ? "bg-primary" : i === journeyStep ? "bg-primary/60 animate-pulse" : "bg-muted"
          }`} />
        </div>
      ))}
      <span className="text-xs font-semibold text-muted-foreground ml-2">{journeyStep + 1}/{journeySteps.length}</span>
    </div>
  );

  const InputField = ({ label, value, onChange, placeholder, icon: Icon, multiline }: any) => (
    <div>
      <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y min-h-[80px]" />
      ) : (
        <input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      )}
    </div>
  );

  const SelectField = ({ label, value, onChange, options, icon: Icon }: any) => (
    <div>
      <label className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </label>
      <select value={value} onChange={(e: any) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
        {options.map((o: any) => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
      </select>
    </div>
  );

  const ActionButton = ({ onClick, loading, label, loadingLabel }: any) => (
    <button onClick={onClick} disabled={loading}
      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
      {loading ? loadingLabel : label}
    </button>
  );

  // ═══ FULL-PAGE RESULT VIEW ═══
  if (showResult) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <button
          onClick={handleBackFromResult}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {resultTitle}
            </h1>
            {result && !isLoading && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title={t("Copy", "কপি")}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-accent text-muted-foreground" title={t("Download", "ডাউনলোড")}>
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="card-gradient border border-border rounded-xl p-5 md:p-8">
            {isLoading && !result ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">{t("AI is generating your personalized guide...", "AI আপনার ব্যক্তিগত গাইড তৈরি করছে...")}</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
                <ReactMarkdown>{result}</ReactMarkdown>
                {isLoading && <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            {t("Scholarship & Study Abroad Mentor", "স্কলারশিপ ও বিদেশে পড়ার মেন্টর")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Your complete guide from scratch to abroad — step by step", "স্ক্র্যাচ থেকে বিদেশে — ধাপে ধাপে সম্পূর্ণ গাইড")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "scholarship_searches",
            titleField: "search_params",
            pageTitle: t("Searches", "অনুসন্ধান"),
            icon: "🎓",
            formatSubtitle: (row: any) => {
              const p = row.search_params;
              return p?.title || p?.action || "Scholarship search";
            },
          }}
          onSelect={(item) => {
            const p = item.search_params;
            if (p?.title) {
              setResultTitle(p.title);
              setShowResult(true);
              stream(p);
            }
          }}
        />
      </motion.div>

      {/* Tab Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? "bg-primary text-primary-foreground shadow" : "bg-card border border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ═══ CONGRATS OVERLAY ═══ */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              className="bg-card border border-border rounded-3xl p-8 text-center shadow-2xl max-w-sm"
            >
              {(() => {
                const c = CONGRATS[Math.min(journeyStep, CONGRATS.length - 1)];
                const Icon = c.icon;
                return (
                  <>
                    <Icon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground">{lang === "bn" ? c.msgBn : c.msg}</h2>
                    <p className="text-muted-foreground mt-2">{t("Moving to next step...", "পরবর্তী ধাপে যাচ্ছি...")}</p>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ JOURNEY TAB — Step by Step ═══ */}
      {activeTab === "journey" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <ProgressBar />

          <div className="card-gradient border border-border rounded-2xl p-5 md:p-6 space-y-5">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              {journeySteps[journeyStep]?.title}
            </h3>

            <AnimatePresence mode="wait">
              {journeyStep === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {COUNTRIES.map(c => (
                    <SelectableCard key={c.id} selected={selectedCountry === c.id} onClick={() => setSelectedCountry(c.id)}
                      icon={c.flag} label={lang === "bn" ? c.labelBn : c.label} />
                  ))}
                </motion.div>
              )}
              {journeyStep === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {FIELDS.map(f => (
                    <SelectableCard key={f.id} selected={selectedField === f.id} onClick={() => setSelectedField(f.id)}
                      icon={f.icon} label={lang === "bn" ? f.labelBn : f.label} />
                  ))}
                </motion.div>
              )}
              {journeyStep === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="grid grid-cols-2 gap-3">
                  {DEGREE_LEVELS.map(d => (
                    <SelectableCard key={d.id} selected={selectedDegree === d.id} onClick={() => setSelectedDegree(d.id)}
                      icon={d.icon} label={lang === "bn" ? d.labelBn : d.label} />
                  ))}
                </motion.div>
              )}
              {journeyStep === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BUDGETS.map(b => (
                    <SelectableCard key={b.id} selected={selectedBudget === b.id} onClick={() => setSelectedBudget(b.id)}
                      icon={b.icon} label={lang === "bn" ? b.labelBn : b.label} />
                  ))}
                </motion.div>
              )}
              {journeyStep === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label={t("Your GPA/CGPA *", "আপনার GPA/CGPA *")} value={jGpa} onChange={setJGpa} placeholder="e.g. 3.50" icon={Award} />
                    <InputField label={t("IELTS/TOEFL Score (if taken)", "IELTS/TOEFL স্কোর")} value={jIelts} onChange={setJIelts} placeholder={t("e.g. 7.0", "যেমন: 7.0")} icon={FileText} />
                    <InputField label={t("Work Experience (optional)", "কাজের অভিজ্ঞতা")} value={jWorkExp} onChange={setJWorkExp} placeholder={t("e.g. 2 years at XYZ", "যেমন: ২ বছর")} icon={User} />
                    <InputField label={t("Research/Publications (optional)", "গবেষণা/পাবলিকেশন")} value={jResearch} onChange={setJResearch} placeholder={t("e.g. 1 paper", "যেমন: ১টি পেপার")} icon={BookOpen} />
                  </div>
                  <InputField label={t("Your Career Goals (optional)", "ক্যারিয়ার লক্ষ্য")} value={jGoals} onChange={setJGoals} placeholder={t("e.g. Become an AI researcher", "যেমন: AI গবেষক হওয়া")} icon={Sparkles} multiline />
                </motion.div>
              )}
              {journeyStep === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {TIMELINES.map(tl => (
                      <SelectableCard key={tl.id} selected={selectedTimeline === tl.id} onClick={() => setSelectedTimeline(tl.id)}
                        icon={tl.icon} label={lang === "bn" ? tl.labelBn : tl.label} />
                    ))}
                  </div>
                  <div className="bg-accent/50 rounded-xl p-4 space-y-1.5">
                    <h4 className="text-sm font-bold text-foreground">{t("Your Journey Summary", "আপনার যাত্রার সারাংশ")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        COUNTRIES.find(c => c.id === selectedCountry)?.flag + " " + selectedCountry,
                        selectedField,
                        DEGREE_LEVELS.find(d => d.id === selectedDegree)?.[lang === "bn" ? "labelBn" : "label"],
                        BUDGETS.find(b => b.id === selectedBudget)?.[lang === "bn" ? "labelBn" : "label"],
                        jGpa && `GPA: ${jGpa}`,
                        jIelts && `IELTS: ${jIelts}`,
                      ].filter(Boolean).map((item, i) => (
                        <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{item}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={goPrevStep} disabled={journeyStep === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
              </button>

              {journeyStep < journeySteps.length - 1 ? (
                <button onClick={goNextStep} disabled={!canProceed()}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
                  {t("Next Step", "পরবর্তী ধাপ")} <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleJourneyComplete} disabled={!canProceed() || isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {isLoading ? t("Generating...", "তৈরি হচ্ছে...") : t("Get My Complete Roadmap 🚀", "আমার রোডম্যাপ নিন 🚀")}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ SCHOLARSHIP FINDER ═══ */}
      {activeTab === "scholarship" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-gradient border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              {t("Smart Scholarship Finder", "স্মার্ট স্কলারশিপ ফাইন্ডার")}
            </h3>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">{t("Scholarship Scope", "স্কলারশিপের ধরন")}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "bangladesh", label: t("🇧🇩 Bangladesh Only", "🇧🇩 শুধু বাংলাদেশ"), desc: t("Domestic funds", "দেশীয় ফান্ড") },
                  { value: "international", label: t("🌍 International", "🌍 আন্তর্জাতিক"), desc: t("Study abroad", "বিদেশে পড়া") },
                  { value: "all", label: t("🔄 Both", "🔄 উভয়"), desc: t("All", "সব") },
                ].map(s => (
                  <button key={s.value} onClick={() => setSchScope(s.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      schScope === s.value ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-card hover:bg-accent"
                    }`}>
                    <div className="text-sm font-semibold text-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("Education Level", "শিক্ষা স্তর")} value={schLevel} onChange={setSchLevel} icon={GraduationCap}
                options={[{value:"ssc",label:"SSC"},{value:"hsc",label:"HSC"},{value:"diploma",label:t("Diploma","ডিপ্লোমা")},{value:"bachelors",label:t("Bachelor's","স্নাতক")},{value:"masters",label:t("Master's","স্নাতকোত্তর")},{value:"phd",label:"PhD"}]} />
              <InputField label={t("GPA/CGPA", "GPA/CGPA")} value={schGpa} onChange={setSchGpa} placeholder="e.g. 4.50 / 3.80" icon={Award} />
              <InputField label={t("Field of Interest", "আগ্রহের বিষয়")} value={schField} onChange={setSchField} placeholder={t("e.g. Computer Science", "যেমন: CSE")} icon={BookOpen} />
              <SelectField label={t("Financial Need", "আর্থিক প্রয়োজন")} value={schNeed} onChange={setSchNeed} icon={DollarSign}
                options={[{value:"low",label:t("Low","কম")},{value:"moderate",label:t("Moderate","মাঝারি")},{value:"high",label:t("High","বেশি")},{value:"small-fund",label:t("Small fund (৫-৫০K BDT)","ছোট ফান্ড")}]} />
              {schScope !== "bangladesh" && <InputField label={t("Target Country", "লক্ষ্য দেশ")} value={schCountry} onChange={setSchCountry} placeholder="e.g. USA" icon={MapPin} />}
              {schScope !== "international" && (
                <>
                  <InputField label={t("Institution", "প্রতিষ্ঠান")} value={schInstitution} onChange={setSchInstitution} placeholder={t("e.g. DU, BUET", "যেমন: ঢাবি")} icon={Building2} />
                  <InputField label={t("District", "জেলা")} value={schDistrict} onChange={setSchDistrict} placeholder={t("e.g. Dhaka", "যেমন: ঢাকা")} icon={MapPin} />
                </>
              )}
              <InputField label={t("Additional Info / Achievements", "অতিরিক্ত তথ্য / অর্জন")} value={schInfo} onChange={setSchInfo}
                placeholder={t("e.g. Dean's list, volunteer work, publications...", "যেমন: ডিন'স লিস্ট, স্বেচ্ছাসেবা, প্রকাশনা...")}
                icon={FileText} multiline />
            </div>
            <ActionButton onClick={() => streamAndShow(
              { action: "find-scholarship", data: { level: schLevel, gpa: schGpa, field: schField, financialNeed: schNeed, targetCountry: schCountry, additionalInfo: schInfo, scope: schScope, institution: schInstitution, district: schDistrict }, language: lang },
              t("Scholarship Results", "স্কলারশিপ ফলাফল")
            )}
              loading={isLoading} label={t("Find Scholarships", "স্কলারশিপ খুঁজুন")} loadingLabel={t("Searching...", "খোঁজা হচ্ছে...")} />
          </div>
        </motion.div>
      )}

      {/* ═══ DOCUMENT HELP ═══ */}
      {activeTab === "documents" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-gradient border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("SOP & Application Document Mentor", "SOP ও আবেদন ডকুমেন্ট মেন্টর")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("Document Type", "ডকুমেন্টের ধরন")} value={docType} onChange={setDocType} icon={FileText} options={documentTypes} />
              <InputField label={t("Purpose", "উদ্দেশ্য")} value={docPurpose} onChange={setDocPurpose} placeholder={t("e.g. Master's admission at MIT", "যেমন: MIT-এ ভর্তি")} icon={GraduationCap} />
              <InputField label={t("Target University/Scholarship", "লক্ষ্য বিশ্ববিদ্যালয়")} value={docTarget} onChange={setDocTarget} placeholder={t("e.g. University of Toronto", "যেমন: টরন্টো")} icon={Award} />
              <InputField label={t("Country", "দেশ")} value={docCountry} onChange={setDocCountry} placeholder={t("e.g. Canada", "যেমন: কানাডা")} icon={MapPin} />
              <InputField label={t("Field of Study", "পড়ার বিষয়")} value={docField} onChange={setDocField} placeholder={t("e.g. Data Science", "যেমন: ডেটা সায়েন্স")} icon={BookOpen} />
              <InputField label={t("Your Background", "আপনার পটভূমি")} value={docBg} onChange={setDocBg}
                placeholder={t("Brief experience, achievements...", "সংক্ষিপ্ত বিবরণ, অর্জন...")}
                icon={FileText} multiline />
            </div>
            <ActionButton onClick={() => streamAndShow(
              { action: "document-help", data: { documentType: docType, purpose: docPurpose, target: docTarget, country: docCountry, field: docField, background: docBg }, language: lang },
              t("Document Draft", "ডকুমেন্ট ড্রাফট")
            )}
              loading={isLoading} label={t("Generate Document", "ডকুমেন্ট তৈরি করুন")} loadingLabel={t("Writing...", "লেখা হচ্ছে...")} />
          </div>
        </motion.div>
      )}

      {/* ═══ VISA PREP ═══ */}
      {activeTab === "visa" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-gradient border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary" />
              {t("Visa Interview Preparation", "ভিসা ইন্টারভিউ প্রস্তুতি")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("Country", "দেশ")} value={visaCountry} onChange={setVisaCountry} icon={MapPin} options={countries} />
              <InputField label={t("University", "বিশ্ববিদ্যালয়")} value={visaUni} onChange={setVisaUni} placeholder={t("e.g. Harvard", "যেমন: হার্ভার্ড")} icon={GraduationCap} />
              <InputField label={t("Program", "প্রোগ্রাম")} value={visaProgram} onChange={setVisaProgram} placeholder={t("e.g. MS in CS", "যেমন: MS in CS")} icon={BookOpen} />
              <InputField label={t("Funding Source", "ফান্ডিং")} value={visaFunding} onChange={setVisaFunding} placeholder={t("e.g. Full scholarship", "যেমন: স্কলারশিপ")} icon={DollarSign} />
            </div>
            <ActionButton onClick={() => streamAndShow(
              { action: "visa-prep", data: { country: visaCountry, university: visaUni, program: visaProgram, funding: visaFunding }, language: lang },
              t("Visa Interview Guide", "ভিসা ইন্টারভিউ গাইড")
            )}
              loading={isLoading} label={t("Start Visa Prep", "ভিসা প্রস্তুতি শুরু")} loadingLabel={t("Preparing...", "প্রস্তুত হচ্ছে...")} />
          </div>
        </motion.div>
      )}

      {/* ═══ CHECKLIST ═══ */}
      {activeTab === "checklist" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card-gradient border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              {t("Required Document Checklist", "প্রয়োজনীয় ডকুমেন্ট চেকলিস্ট")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SelectField label={t("Country", "দেশ")} value={clCountry} onChange={setClCountry} icon={MapPin} options={countries} />
              <SelectField label={t("Degree Level", "ডিগ্রি স্তর")} value={clDegree} onChange={setClDegree} icon={GraduationCap}
                options={[{value:"bachelors",label:t("Bachelor's","স্নাতক")},{value:"masters",label:t("Master's","স্নাতকোত্তর")},{value:"phd",label:"PhD"}]} />
              <InputField label={t("University (Optional)", "বিশ্ববিদ্যালয়")} value={clUni} onChange={setClUni} placeholder={t("e.g. Oxford", "যেমন: অক্সফোর্ড")} icon={GraduationCap} />
            </div>
            <ActionButton onClick={() => streamAndShow(
              { action: "checklist", data: { country: clCountry, degreeLevel: clDegree, university: clUni }, language: lang },
              t("Document Checklist", "ডকুমেন্ট চেকলিস্ট")
            )}
              loading={isLoading} label={t("Generate Checklist", "চেকলিস্ট তৈরি করুন")} loadingLabel={t("Generating...", "তৈরি হচ্ছে...")} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScholarshipPage;
