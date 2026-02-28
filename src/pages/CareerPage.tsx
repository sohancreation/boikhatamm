import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, GraduationCap, School, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CareerProfileForm, { type CareerProfile } from "@/components/career/CareerProfileForm";
import CareerResults from "@/components/career/CareerResults";
import JobCareerProfileForm, { type JobCareerProfile } from "@/components/career/JobCareerProfileForm";
import JobCareerResults from "@/components/career/JobCareerResults";
import HistoryDrawer from "@/components/history/HistoryDrawer";

type Mode = "select" | "uni-form" | "uni-results" | "job-form" | "job-results";

const CareerPage = () => {
  const { t } = useLanguage();
  const { user, userPlan } = useAuth();
  const planOrder = ["free", "basic", "pro", "premium"];
  const locked = planOrder.indexOf(userPlan) < planOrder.indexOf("pro");

  const [mode, setMode] = useState<Mode>("select");
  const [uniProfile, setUniProfile] = useState<CareerProfile | null>(null);
  const [jobProfile, setJobProfile] = useState<JobCareerProfile | null>(null);
  const [isLoading] = useState(false);

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <main className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Please sign up first to use Career Mentor", "ক্যারিয়ার মেন্টর ব্যবহার করতে আগে সাইন আপ করুন")}</p>
            <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              {t("Sign Up", "সাইন আপ")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <main className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Pro Plan Required", "প্রো প্ল্যান প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Get AI-powered career guidance tailored to your interests and skills.", "তোমার আগ্রহ ও দক্ষতা অনুযায়ী AI-চালিত ক্যারিয়ার গাইডেন্স পাও।")}</p>
            <Link to="/pricing" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              {t("Upgrade to Pro", "প্রো তে আপগ্রেড করো")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "uni-results" && uniProfile) {
    return (
      <div className="p-4 md:p-6">
        <CareerResults profile={uniProfile} onBack={() => setMode("uni-form")} />
      </div>
    );
  }

  if (mode === "job-results" && jobProfile) {
    return (
      <div className="p-4 md:p-6">
        <JobCareerResults profile={jobProfile} onBack={() => setMode("job-form")} />
      </div>
    );
  }

  if (mode === "uni-form") {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          🎓 {t("University Career Mentor", "বিশ্ববিদ্যালয় ক্যারিয়ার মেন্টর")}
        </h1>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          {t("Fill in your profile to get personalized AI career guidance", "ব্যক্তিগতকৃত AI ক্যারিয়ার গাইডেন্স পেতে প্রোফাইল পূরণ করো")}
        </p>
        <CareerProfileForm
          isLoading={isLoading}
          onSubmit={(p) => {
            setUniProfile(p);
            setMode("uni-results");
          }}
        />
      </div>
    );
  }

  if (mode === "job-form") {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          💼 {t("Job Career Mentor", "চাকরি ক্যারিয়ার মেন্টর")}
        </h1>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          {t("Fill in your profile for AI-powered job preparation guidance", "AI-চালিত চাকরি প্রস্তুতি গাইডেন্স পেতে প্রোফাইল পূরণ করো")}
        </p>
        <JobCareerProfileForm
          isLoading={isLoading}
          onSubmit={(p) => {
            setJobProfile(p);
            setMode("job-results");
          }}
        />
      </div>
    );
  }

  // Mode selection
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            🎯 {t("Career Mentor", "ক্যারিয়ার মেন্টর")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("Choose your track to get started", "শুরু করতে তোমার ট্র্যাক নির্বাচন করো")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "career_results",
            titleField: "profile_data",
            pageTitle: t("Career Results", "ক্যারিয়ার ফলাফল"),
            icon: "🎯",
            formatSubtitle: (row: any) => {
              const p = row.profile_data;
              if (p?.mode === "job") return `${p.jobSector || ""} • ${p.jobType || ""}`;
              return p?.department ? `${p.department} • ${p.university || ""}` : "Career Analysis";
            },
          }}
          onSelect={(item) => {
            const p = item.profile_data as any;
            if (p?.mode === "job") {
              setJobProfile(p as JobCareerProfile);
              setMode("job-results");
            } else {
              setUniProfile(p as CareerProfile);
              setMode("uni-results");
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {/* School Mode */}
        <button
          onClick={() => {}}
          className="group p-6 rounded-2xl border border-border card-gradient hover:shadow-glow-primary transition-all text-left"
        >
          <School className="w-10 h-10 text-primary mb-3" />
          <h3 className="font-bold text-foreground mb-1">{t("School / College", "স্কুল / কলেজ")}</h3>
          <p className="text-xs text-muted-foreground">{t("SSC, HSC, Admission prep", "SSC, HSC, ভর্তি প্রস্তুতি")}</p>
          <span className="mt-3 inline-block text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {t("Coming Soon", "শীঘ্রই আসছে")}
          </span>
        </button>

        {/* University Mode */}
        <button
          onClick={() => setMode("uni-form")}
          className="group p-6 rounded-2xl border-2 border-primary card-gradient hover:shadow-glow-primary transition-all text-left relative overflow-hidden"
        >
          <GraduationCap className="w-10 h-10 text-primary mb-3" />
          <h3 className="font-bold text-foreground mb-1">{t("University", "বিশ্ববিদ্যালয়")}</h3>
          <p className="text-xs text-muted-foreground">{t("Career mapping, readiness score, action plan", "ক্যারিয়ার ম্যাপিং, রেডিনেস স্কোর, অ্যাকশন প্ল্যান")}</p>
          <span className="mt-3 inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            {t("Start Now →", "শুরু করো →")}
          </span>
        </button>

        {/* Job Candidate Mode */}
        <button
          onClick={() => setMode("job-form")}
          className="group p-6 rounded-2xl border-2 border-secondary card-gradient hover:shadow-glow-primary transition-all text-left relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</div>
          <Briefcase className="w-10 h-10 text-secondary mb-3" />
          <h3 className="font-bold text-foreground mb-1">{t("Job Preparation", "চাকরি প্রস্তুতি")}</h3>
          <p className="text-xs text-muted-foreground">{t("BCS, Bank, Private job guidance", "BCS, ব্যাংক, বেসরকারি চাকরি গাইডেন্স")}</p>
          <span className="mt-3 inline-block text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">
            {t("Start Now →", "শুরু করো →")}
          </span>
        </button>
      </div>
    </div>
  );
};

export default CareerPage;
