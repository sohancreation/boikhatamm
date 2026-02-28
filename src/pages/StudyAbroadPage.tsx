import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Globe, FlaskConical, Briefcase, DollarSign,
  ChevronRight, ChevronLeft, Loader2, TrendingUp, Target,
  MapPin, School, Shield, Flame, BarChart3, Sparkles, CheckCircle2,
  AlertCircle, Star, RefreshCw, BookOpen, FileText, Route,
} from "lucide-react";
import DocumentBuilders from "@/components/study-abroad/DocumentBuilders";
import ApplicationRoadmap from "@/components/study-abroad/ApplicationRoadmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { value: "usa", label: "🇺🇸 USA", bn: "🇺🇸 যুক্তরাষ্ট্র" },
  { value: "canada", label: "🇨🇦 Canada", bn: "🇨🇦 কানাডা" },
  { value: "uk", label: "🇬🇧 UK", bn: "🇬🇧 যুক্তরাজ্য" },
  { value: "germany", label: "🇩🇪 Germany", bn: "🇩🇪 জার্মানি" },
  { value: "australia", label: "🇦🇺 Australia", bn: "🇦🇺 অস্ট্রেলিয়া" },
  { value: "europe", label: "🇪🇺 Europe (Other)", bn: "🇪🇺 ইউরোপ (অন্যান্য)" },
  { value: "asia", label: "🌏 Asia", bn: "🌏 এশিয়া" },
];

const DEGREES = [
  { value: "hsc", en: "HSC / A-Level", bn: "এইচএসসি / এ-লেভেল" },
  { value: "bachelor", en: "Bachelor's", bn: "স্নাতক" },
  { value: "masters", en: "Master's", bn: "স্নাতকোত্তর" },
];

const TARGET_DEGREES = [
  { value: "bachelor", en: "Bachelor's", bn: "স্নাতক" },
  { value: "masters", en: "Master's (MS/MA/MBA)", bn: "স্নাতকোত্তর" },
  { value: "phd", en: "PhD / Doctoral", bn: "পিএইচডি" },
  { value: "postdoc", en: "Post-Doctoral", bn: "পোস্ট-ডক্টরাল" },
];

const FUNDING_OPTIONS = [
  { value: "fully_funded", en: "Fully Funded", bn: "সম্পূর্ণ অর্থায়ন", icon: "💰" },
  { value: "partial", en: "Partial Funding", bn: "আংশিক অর্থায়ন", icon: "💵" },
  { value: "self_funded", en: "Self Funded", bn: "নিজ অর্থায়ন", icon: "🏦" },
];

interface ProfileData {
  degree: string;
  cgpa: string;
  major: string;
  university_name: string;
  graduation_year: string;
  ielts_score: string;
  gre_score: string;
  gmat_score: string;
  sat_score: string;
  has_thesis: boolean;
  has_publication: boolean;
  has_conference: boolean;
  research_details: string;
  internship_details: string;
  job_details: string;
  project_details: string;
  funding_preference: string;
  country_preferences: string[];
  target_degree: string;
  target_major: string;
}

const defaultProfile: ProfileData = {
  degree: "", cgpa: "", major: "", university_name: "", graduation_year: "",
  ielts_score: "", gre_score: "", gmat_score: "", sat_score: "",
  has_thesis: false, has_publication: false, has_conference: false, research_details: "",
  internship_details: "", job_details: "", project_details: "",
  funding_preference: "fully_funded", country_preferences: [], target_degree: "", target_major: "",
};

const StudyAbroadPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  // wizard: 0=Academic, 1=Tests, 2=Research, 3=Experience, 4=Preferences, 5=Analysis, 6=Countries, 7=Universities, 8=Documents, 9=Roadmap
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [countries, setCountries] = useState<any>(null);
  const [universities, setUniversities] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-ring outline-none text-sm";
  const toggleBtn = (active: boolean) => `px-4 py-2 rounded-lg border text-sm font-medium transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`;

  const update = (field: keyof ProfileData, value: any) => setProfile(p => ({ ...p, [field]: value }));
  const toggleCountry = (c: string) => {
    setProfile(p => ({
      ...p,
      country_preferences: p.country_preferences.includes(c)
        ? p.country_preferences.filter(x => x !== c)
        : [...p.country_preferences, c],
    }));
  };

  const canProceed = () => {
    if (step === 0) return !!profile.degree && !!profile.cgpa && !!profile.major;
    if (step === 4) return !!profile.target_degree && !!profile.target_major && profile.country_preferences.length > 0;
    return true;
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-abroad", {
        body: { action: "analyze_profile", profile, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data);
      setStep(5);
      // Save profile
      saveProfile(data, null, null);
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runCountryReco = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-abroad", {
        body: { action: "recommend_countries", profile, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCountries(data);
      setStep(6);
      saveProfile(analysis, data, null);
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runUniReco = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-abroad", {
        body: { action: "recommend_universities", profile, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setUniversities(data);
      setStep(7);
      saveProfile(analysis, countries, data);
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (analysisData: any, countryData: any, uniData: any) => {
    if (!user) return;
    const payload: any = {
      user_id: user.id,
      ...profile,
      analysis_result: analysisData || {},
      country_recommendations: countryData || [],
      university_recommendations: uniData || [],
    };
    try {
      if (savedId) {
        await supabase.from("study_abroad_profiles" as any).update(payload).eq("id", savedId);
      } else {
        const { data } = await supabase.from("study_abroad_profiles" as any).insert(payload).select("id").single();
        if (data) setSavedId((data as any).id);
      }
    } catch {}
  };

  const resetAll = () => {
    setStep(0);
    setProfile(defaultProfile);
    setAnalysis(null);
    setCountries(null);
    setUniversities(null);
    setSavedId(null);
  };

  const stepLabels = [
    { icon: GraduationCap, en: "Academic", bn: "একাডেমিক" },
    { icon: FileText, en: "Tests", bn: "পরীক্ষা" },
    { icon: FlaskConical, en: "Research", bn: "গবেষণা" },
    { icon: Briefcase, en: "Experience", bn: "অভিজ্ঞতা" },
    { icon: Globe, en: "Preferences", bn: "পছন্দ" },
    { icon: BarChart3, en: "Analysis", bn: "বিশ্লেষণ" },
    { icon: MapPin, en: "Countries", bn: "দেশসমূহ" },
    { icon: School, en: "Universities", bn: "বিশ্ববিদ্যালয়" },
    { icon: FileText, en: "Documents", bn: "ডকুমেন্ট" },
    { icon: Route, en: "Roadmap", bn: "রোডম্যাপ" },
  ];

  const scoreColor = (score: number) => score >= 70 ? "text-primary" : score >= 50 ? "text-secondary" : "text-destructive";
  const barColor = (score: number) => score >= 70 ? "bg-primary" : score >= 50 ? "bg-secondary" : "bg-destructive";

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use Study Abroad Guide", "স্টাডি অ্যাব্রড গাইড ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            {t("Study Abroad Guide", "বিদেশে উচ্চশিক্ষা গাইড")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("AI-powered profile analysis, country & university recommendations", "AI চালিত প্রোফাইল বিশ্লেষণ, দেশ ও বিশ্ববিদ্যালয় সুপারিশ")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "study_abroad_profiles",
            titleField: "major",
            pageTitle: t("Study Abroad", "বিদেশে পড়াশোনা"),
            icon: "🌍",
            formatSubtitle: (row: any) => `${row.degree || ""} • ${row.target_degree || ""} → ${(row.country_preferences || []).join(", ")}`,
            formatBadge: (row: any) => {
              const score = row.analysis_result?.overallScore;
              return score ? { text: `Score: ${score}`, color: score >= 70 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600" } : null;
            },
          }}
          onSelect={(item) => {
            setProfile({
              degree: item.degree || "", cgpa: item.cgpa || "", major: item.major || "",
              university_name: item.university_name || "", graduation_year: item.graduation_year || "",
              ielts_score: item.ielts_score || "", gre_score: item.gre_score || "",
              gmat_score: item.gmat_score || "", sat_score: item.sat_score || "",
              has_thesis: item.has_thesis || false, has_publication: item.has_publication || false,
              has_conference: item.has_conference || false, research_details: item.research_details || "",
              internship_details: item.internship_details || "", job_details: item.job_details || "",
              project_details: item.project_details || "", funding_preference: item.funding_preference || "fully_funded",
              country_preferences: item.country_preferences || [], target_degree: item.target_degree || "",
              target_major: item.target_major || "",
            });
            setSavedId(item.id);
            if (item.university_recommendations && Object.keys(item.university_recommendations).length > 0) {
              setAnalysis(item.analysis_result);
              setCountries(item.country_recommendations);
              setUniversities(item.university_recommendations);
              setStep(7);
            } else if (item.country_recommendations && (Array.isArray(item.country_recommendations) ? item.country_recommendations.length > 0 : Object.keys(item.country_recommendations).length > 0)) {
              setAnalysis(item.analysis_result);
              setCountries(item.country_recommendations);
              setStep(6);
            } else if (item.analysis_result && Object.keys(item.analysis_result).length > 0) {
              setAnalysis(item.analysis_result);
              setStep(5);
            } else {
              setStep(0);
            }
          }}
        />
      </motion.div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto pb-1">
        {stepLabels.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i === step ? "bg-primary text-primary-foreground scale-110" :
              i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              <s.icon className="w-4 h-4" />
            </div>
            {i < stepLabels.length - 1 && <div className={`w-4 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card className="card-gradient border-border shadow-glow-primary">
        <CardContent className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

              {/* Step 0: Academic */}
              {step === 0 && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    {t("Academic Information", "একাডেমিক তথ্য")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Current Degree", "বর্তমান ডিগ্রি")} *</label>
                      <select value={profile.degree} onChange={e => update("degree", e.target.value)} className={inputClass}>
                        <option value="">{t("Select", "নির্বাচন")}</option>
                        {DEGREES.map(d => <option key={d.value} value={d.value}>{t(d.en, d.bn)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("CGPA / GPA", "সিজিপিএ")} *</label>
                      <input type="text" value={profile.cgpa} onChange={e => update("cgpa", e.target.value)} placeholder="e.g. 3.75/4.00" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Major / Subject", "বিষয়")} *</label>
                      <input type="text" value={profile.major} onChange={e => update("major", e.target.value)} placeholder={t("e.g. Computer Science", "যেমন: কম্পিউটার সায়েন্স")} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("University Name", "বিশ্ববিদ্যালয়ের নাম")}</label>
                      <input type="text" value={profile.university_name} onChange={e => update("university_name", e.target.value)} placeholder={t("e.g. BUET, DU", "যেমন: বুয়েট, ঢাবি")} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Graduation Year", "স্নাতক সাল")}</label>
                      <input type="text" value={profile.graduation_year} onChange={e => update("graduation_year", e.target.value)} placeholder="e.g. 2025" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Test Scores */}
              {step === 1 && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {t("Test Scores", "পরীক্ষার স্কোর")}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t("Leave blank if not taken yet", "এখনও না দিলে ফাঁকা রাখো")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">IELTS {t("Score", "স্কোর")}</label>
                      <input type="text" value={profile.ielts_score} onChange={e => update("ielts_score", e.target.value)} placeholder="e.g. 7.0" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">GRE {t("Score", "স্কোর")}</label>
                      <input type="text" value={profile.gre_score} onChange={e => update("gre_score", e.target.value)} placeholder="e.g. 320" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">GMAT {t("Score", "স্কোর")}</label>
                      <input type="text" value={profile.gmat_score} onChange={e => update("gmat_score", e.target.value)} placeholder="e.g. 700" className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">SAT {t("Score", "স্কোর")}</label>
                      <input type="text" value={profile.sat_score} onChange={e => update("sat_score", e.target.value)} placeholder="e.g. 1400" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Research */}
              {step === 2 && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-primary" />
                    {t("Research Experience", "গবেষণার অভিজ্ঞতা")}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { key: "has_thesis" as const, en: "📄 Thesis", bn: "📄 থিসিস" },
                      { key: "has_publication" as const, en: "📰 Publication", bn: "📰 প্রকাশনা" },
                      { key: "has_conference" as const, en: "🎤 Conference", bn: "🎤 সম্মেলন" },
                    ].map(item => (
                      <button key={item.key} onClick={() => update(item.key, !profile[item.key])}
                        className={toggleBtn(profile[item.key])}
                      >
                        {t(item.en, item.bn)}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Research Details (optional)", "গবেষণার বিবরণ (ঐচ্ছিক)")}</label>
                    <Textarea value={profile.research_details} onChange={e => update("research_details", e.target.value)}
                      placeholder={t("Describe your research work, thesis topic, publications...", "তোমার গবেষণার কাজ, থিসিসের বিষয়, প্রকাশনা বর্ণনা করো...")}
                      className="min-h-[80px] text-sm" />
                  </div>
                </>
              )}

              {/* Step 3: Experience */}
              {step === 3 && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    {t("Work & Project Experience", "কাজ ও প্রকল্পের অভিজ্ঞতা")}
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Internships", "ইন্টার্নশিপ")}</label>
                    <Textarea value={profile.internship_details} onChange={e => update("internship_details", e.target.value)}
                      placeholder={t("Company, role, duration...", "কোম্পানি, পদ, সময়কাল...")} className="min-h-[60px] text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Job Experience", "চাকরির অভিজ্ঞতা")}</label>
                    <Textarea value={profile.job_details} onChange={e => update("job_details", e.target.value)}
                      placeholder={t("Company, role, years...", "কোম্পানি, পদ, বছর...")} className="min-h-[60px] text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Notable Projects", "উল্লেখযোগ্য প্রকল্প")}</label>
                    <Textarea value={profile.project_details} onChange={e => update("project_details", e.target.value)}
                      placeholder={t("Describe key projects...", "গুরুত্বপূর্ণ প্রকল্পগুলো বর্ণনা করো...")} className="min-h-[60px] text-sm" />
                  </div>
                </>
              )}

              {/* Step 4: Preferences */}
              {step === 4 && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    {t("Study Preferences", "পড়াশোনার পছন্দ")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Target Degree", "লক্ষ্য ডিগ্রি")} *</label>
                      <select value={profile.target_degree} onChange={e => update("target_degree", e.target.value)} className={inputClass}>
                        <option value="">{t("Select", "নির্বাচন")}</option>
                        {TARGET_DEGREES.map(d => <option key={d.value} value={d.value}>{t(d.en, d.bn)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Target Major / Field", "লক্ষ্য বিষয়")} *</label>
                      <input type="text" value={profile.target_major} onChange={e => update("target_major", e.target.value)}
                        placeholder={t("e.g. Machine Learning, MBA", "যেমন: মেশিন লার্নিং, এমবিএ")} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Funding Preference", "অর্থায়ন পছন্দ")}</label>
                    <div className="flex gap-2 mt-1">
                      {FUNDING_OPTIONS.map(f => (
                        <button key={f.value} onClick={() => update("funding_preference", f.value)}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            profile.funding_preference === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                          }`}
                        >
                          {f.icon} {t(f.en, f.bn)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Preferred Countries", "পছন্দের দেশসমূহ")} *</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COUNTRIES.map(c => (
                        <button key={c.value} onClick={() => toggleCountry(c.value)}
                          className={toggleBtn(profile.country_preferences.includes(c.value))}
                        >
                          {t(c.label, c.bn)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: AI Analysis */}
              {step === 5 && analysis && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {t("📊 Study Abroad Profile Analysis", "📊 বিদেশে পড়ার প্রোফাইল বিশ্লেষণ")}
                  </h3>

                  {/* Overall Score */}
                  <div className="text-center py-4">
                    <div className={`text-5xl font-bold ${scoreColor(analysis.overallScore || 0)}`}>
                      {analysis.overallScore}<span className="text-lg text-muted-foreground">/100</span>
                    </div>
                    <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
                      (analysis.readinessLevel || "").includes("Ready") || (analysis.readinessLevel || "").includes("Competitive")
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary"
                    }`}>{analysis.readinessLevel}</span>
                  </div>

                  {/* Breakdown */}
                  {analysis.breakdown && (
                    <div className="space-y-2">
                      {Object.entries(analysis.breakdown).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground font-medium capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                            <span className={scoreColor(val as number)}>{val as number}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }}
                              transition={{ duration: 1 }}
                              className={`h-full rounded-full ${barColor(val as number)}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary */}
                  {analysis.summary && (
                    <div className="bg-accent/30 rounded-xl p-4">
                      <p className="text-sm text-foreground">{analysis.summary}</p>
                    </div>
                  )}

                  {/* Top Improvement */}
                  {analysis.topImprovement && (
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/10">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> {analysis.topImprovement}
                      </p>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.strengthAreas?.length > 0 && (
                      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                        <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {t("Strengths", "শক্তি")}
                        </h4>
                        {analysis.strengthAreas.map((s: string, i: number) => <p key={i} className="text-xs text-foreground mb-1">✅ {s}</p>)}
                      </div>
                    )}
                    {analysis.weakAreas?.length > 0 && (
                      <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
                        <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> {t("Needs Improvement", "উন্নতি প্রয়োজন")}
                        </h4>
                        {analysis.weakAreas.map((w: string, i: number) => <p key={i} className="text-xs text-foreground mb-1">⚠️ {w}</p>)}
                      </div>
                    )}
                  </div>

                  {/* Improvement suggestions */}
                  {analysis.improvements?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">{t("Improvement Plan", "উন্নতি পরিকল্পনা")}</h4>
                      {analysis.improvements.map((imp: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 mb-2 bg-accent/20 rounded-lg p-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{imp.area}</p>
                            <p className="text-xs text-muted-foreground">{imp.suggestion}</p>
                            {imp.impactPercent > 0 && <span className="text-[10px] text-primary font-bold">+{imp.impactPercent}% impact</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Step 6: Country Recommendations */}
              {step === 6 && countries && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {t("🌍 Country Recommendations", "🌍 দেশ সুপারিশ")}
                  </h3>

                  {countries.summary && (
                    <div className="bg-accent/30 rounded-xl p-3">
                      <p className="text-sm text-foreground">{countries.summary}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {countries.countries?.map((c: any, i: number) => (
                      <Card key={i} className={`border ${i === 0 ? "border-primary shadow-glow-primary" : "border-border"}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-foreground">{c.country}</span>
                              {c.recommendedTag && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{c.recommendedTag}</span>
                              )}
                            </div>
                            <span className={`text-xl font-bold ${scoreColor(c.matchScore || 0)}`}>{c.matchScore}%</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-accent/30 rounded-lg p-2 text-center">
                              <p className="text-muted-foreground">{t("Admission", "ভর্তি")}</p>
                              <p className="font-semibold text-foreground">{c.admissionDifficulty}</p>
                            </div>
                            <div className="bg-accent/30 rounded-lg p-2 text-center">
                              <p className="text-muted-foreground">{t("Cost/Year", "খরচ/বছর")}</p>
                              <p className="font-semibold text-foreground">{c.estimatedCostPerYear}</p>
                            </div>
                            <div className="bg-accent/30 rounded-lg p-2 text-center">
                              <p className="text-muted-foreground">{t("Scholarship", "বৃত্তি")}</p>
                              <p className="font-semibold text-foreground">{c.scholarshipAvailability}</p>
                            </div>
                            <div className="bg-accent/30 rounded-lg p-2 text-center">
                              <p className="text-muted-foreground">{t("Work", "কাজ")}</p>
                              <p className="font-semibold text-foreground">{c.workOpportunity}</p>
                            </div>
                          </div>
                          {c.topReasons?.length > 0 && (
                            <div className="mt-2">
                              {c.topReasons.map((r: string, j: number) => <p key={j} className="text-xs text-muted-foreground">✅ {r}</p>)}
                            </div>
                          )}
                          {c.challenges?.length > 0 && (
                            <div className="mt-1">
                              {c.challenges.map((ch: string, j: number) => <p key={j} className="text-xs text-destructive/70">⚠️ {ch}</p>)}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Step 7: University Recommendations */}
              {step === 7 && universities && (
                <>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    {t("🎓 University Recommendations", "🎓 বিশ্ববিদ্যালয় সুপারিশ")}
                  </h3>

                  {universities.summary && (
                    <div className="bg-accent/30 rounded-xl p-3 mb-2">
                      <p className="text-sm text-foreground">{universities.summary}</p>
                    </div>
                  )}

                  {[
                    { key: "safe", icon: Shield, label: t("🎯 Safe Universities", "🎯 নিরাপদ বিশ্ববিদ্যালয়"), color: "border-primary/30 bg-primary/5" },
                    { key: "moderate", icon: Target, label: t("⚖ Moderate Universities", "⚖ মাঝারি বিশ্ববিদ্যালয়"), color: "border-secondary/30 bg-secondary/5" },
                    { key: "ambitious", icon: Flame, label: t("🔥 Ambitious Universities", "🔥 উচ্চাকাঙ্ক্ষী বিশ্ববিদ্যালয়"), color: "border-destructive/30 bg-destructive/5" },
                  ].map(tier => (
                    universities[tier.key]?.length > 0 && (
                      <div key={tier.key} className="mb-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <tier.icon className="w-4 h-4" /> {tier.label}
                        </h4>
                        <div className="space-y-2">
                          {universities[tier.key].map((u: any, i: number) => (
                            <div key={i} className={`rounded-xl border p-3 ${tier.color}`}>
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="text-sm font-bold text-foreground">{u.name}</p>
                                  <p className="text-xs text-muted-foreground">{u.country} • {u.program}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">{t("Admission", "ভর্তি")}</p>
                                  <p className={`text-sm font-bold ${scoreColor(u.admissionProbability || 0)}`}>{u.admissionProbability}%</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>💰 {t("Funding", "অর্থায়ন")}: {u.fundingProbability}%</span>
                                {u.deadline && <span>📅 {u.deadline}</span>}
                              </div>
                              {u.highlights?.length > 0 && (
                                <div className="mt-1">
                                  {u.highlights.map((h: string, j: number) => <span key={j} className="text-[10px] mr-2 text-primary">⭐ {h}</span>)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </>
              )}

              {/* Step 8: Document Builders */}
              {step === 8 && (
                <DocumentBuilders profile={profile} lang={lang} userName={profile.university_name ? `${profile.major} Student` : undefined} />
              )}

              {/* Step 9: Application Roadmap */}
              {step === 9 && (
                <ApplicationRoadmap profile={profile} lang={lang} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => step <= 5 ? setStep(s => Math.max(0, s - 1)) : setStep(s => s - 1)} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
            </Button>

            {step < 4 && (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 4 && (
              <Button onClick={runAnalysis} disabled={loading || !canProceed()} className="bg-hero-gradient text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {t("Analyze My Profile", "প্রোফাইল বিশ্লেষণ করো")}
              </Button>
            )}

            {step === 5 && (
              <Button onClick={runCountryReco} disabled={loading} className="bg-hero-gradient text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <MapPin className="w-4 h-4 mr-1" />}
                {t("Get Country Recommendations", "দেশ সুপারিশ দেখো")}
              </Button>
            )}

            {step === 6 && (
              <Button onClick={runUniReco} disabled={loading} className="bg-hero-gradient text-primary-foreground">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <School className="w-4 h-4 mr-1" />}
                {t("Find Universities", "বিশ্ববিদ্যালয় খোঁজো")}
              </Button>
            )}

            {step === 7 && (
              <Button onClick={() => setStep(8)}>
                {t("Document Builders", "ডকুমেন্ট বিল্ডার")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 8 && (
              <Button onClick={() => setStep(9)}>
                {t("Application Roadmap", "আবেদন রোডম্যাপ")} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            {step === 9 && (
              <Button onClick={resetAll} variant="outline">
                <RefreshCw className="w-4 h-4 mr-1" /> {t("Start Over", "আবার শুরু")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyAbroadPage;
