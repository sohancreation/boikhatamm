import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Target, Globe, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface JobCareerProfile {
  jobSector: string;
  jobType: string;
  jobRole: string;
  experience: string;
  education: string;
  skills: string;
  certifications: string;
  careerGoal: string;
  countryPref: string;
  hasLinkedIn: boolean;
  hasPortfolio: boolean;
  currentStatus: string;
}

interface Props {
  onSubmit: (profile: JobCareerProfile) => void;
  isLoading: boolean;
}

const govtExams = [
  "BCS (Bangladesh Civil Service)",
  "Primary School Teacher",
  "Bank (Bangladesh Bank / Govt)",
  "NTRCA (Teacher Registration)",
  "Judicial Service",
  "Police / Armed Forces",
  "Other Govt Job",
];

const privateSectors = [
  "Software & IT", "Banking & Finance", "Telecommunications", "FMCG",
  "Pharmaceuticals", "Garments & Textile", "E-commerce", "EdTech",
  "Healthcare", "Manufacturing", "Consulting", "Media & Advertising",
  "NGO / Development", "Freelancing", "Startup",
];

const JobCareerProfileForm = ({ onSubmit, isLoading }: Props) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<JobCareerProfile>({
    jobSector: "", jobType: "", jobRole: "",
    experience: "", education: "", skills: "",
    certifications: "", careerGoal: "", countryPref: "Bangladesh",
    hasLinkedIn: false, hasPortfolio: false, currentStatus: "",
  });

  const updateField = (key: keyof JobCareerProfile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const steps = [
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: t("Job Profile", "চাকরি প্রোফাইল"),
      subtitle: t("Tell us about your job preference", "তোমার চাকরির পছন্দ সম্পর্কে বলো"),
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: t("Background & Skills", "ব্যাকগ্রাউন্ড ও দক্ষতা"),
      subtitle: t("Your education and experience", "তোমার শিক্ষা ও অভিজ্ঞতা"),
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t("Goals & Preparation", "লক্ষ্য ও প্রস্তুতি"),
      subtitle: t("Your career aspirations", "তোমার ক্যারিয়ার আকাঙ্ক্ষা"),
    },
  ];

  const canProceed = () => {
    if (step === 0) return profile.jobType && profile.jobSector;
    if (step === 1) return profile.education;
    return true;
  };

  return (
    <Card className="card-gradient border-border shadow-glow-primary max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i === step ? "bg-primary text-primary-foreground scale-110" :
                i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <CardTitle className="flex items-center gap-2 text-xl">
          {steps[step].icon}
          {steps[step].title}
        </CardTitle>
        <p className="text-muted-foreground text-sm">{steps[step].subtitle}</p>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <div>
                  <Label>{t("Job Type", "চাকরির ধরন")} *</Label>
                  <Select value={profile.jobType} onValueChange={v => { updateField("jobType", v); updateField("jobSector", ""); }}>
                    <SelectTrigger><SelectValue placeholder={t("Select type", "ধরন বাছাই করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sorkari">{t("Sorkari (Government)", "সরকারি")}</SelectItem>
                      <SelectItem value="besorkari">{t("Besorkari (Private)", "বেসরকারি")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Job Sector / Exam", "চাকরির সেক্টর / পরীক্ষা")} *</Label>
                  <Select value={profile.jobSector} onValueChange={v => updateField("jobSector", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select sector", "সেক্টর বাছাই করো")} /></SelectTrigger>
                    <SelectContent>
                      {(profile.jobType === "sorkari" ? govtExams : privateSectors).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {profile.jobType === "besorkari" && (
                  <div>
                    <Label>{t("Target Role", "লক্ষ্য পদ")}</Label>
                    <Input placeholder={t("e.g. Software Engineer, Marketing Executive", "যেমন: সফটওয়্যার ইঞ্জিনিয়ার, মার্কেটিং এক্সিকিউটিভ")}
                      value={profile.jobRole} onChange={e => updateField("jobRole", e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>{t("Current Status", "বর্তমান অবস্থা")}</Label>
                  <Select value={profile.currentStatus} onValueChange={v => updateField("currentStatus", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select status", "অবস্থা বাছাই করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">{t("Student", "ছাত্র/ছাত্রী")}</SelectItem>
                      <SelectItem value="fresh_graduate">{t("Fresh Graduate", "ফ্রেশ গ্র্যাজুয়েট")}</SelectItem>
                      <SelectItem value="employed">{t("Currently Employed", "বর্তমানে কর্মরত")}</SelectItem>
                      <SelectItem value="unemployed">{t("Job Seeking", "চাকরি খুঁজছি")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <Label>{t("Highest Education", "সর্বোচ্চ শিক্ষা")} *</Label>
                  <Select value={profile.education} onValueChange={v => updateField("education", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select education", "শিক্ষা বাছাই করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HSC">{t("HSC / Diploma", "এইচএসসি / ডিপ্লোমা")}</SelectItem>
                      <SelectItem value="Honours">{t("Honours (Running/Completed)", "অনার্স (চলমান/সম্পন্ন)")}</SelectItem>
                      <SelectItem value="Masters">{t("Masters", "মাস্টার্স")}</SelectItem>
                      <SelectItem value="PhD">{t("PhD", "পিএইচডি")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Work Experience", "কাজের অভিজ্ঞতা")}</Label>
                  <Input placeholder={t("e.g. 2 years at XYZ, Intern at ABC", "যেমন: XYZ তে ২ বছর, ABC তে ইন্টার্ন")}
                    value={profile.experience} onChange={e => updateField("experience", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Key Skills", "মূল দক্ষতা")}</Label>
                  <Input placeholder={t("e.g. Excel, Communication, Programming", "যেমন: এক্সেল, কমিউনিকেশন, প্রোগ্রামিং")}
                    value={profile.skills} onChange={e => updateField("skills", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Certifications / Training", "সার্টিফিকেশন / ট্রেনিং")}</Label>
                  <Input placeholder={t("e.g. Google Analytics, IELTS 7.0", "যেমন: Google Analytics, IELTS 7.0")}
                    value={profile.certifications} onChange={e => updateField("certifications", e.target.value)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>{t("Career Goal", "ক্যারিয়ার লক্ষ্য")}</Label>
                  <Input placeholder={t("e.g. Become a BCS Cadre, Senior Developer", "যেমন: BCS ক্যাডার হওয়া, সিনিয়র ডেভেলপার")}
                    value={profile.careerGoal} onChange={e => updateField("careerGoal", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Country Preference", "দেশের পছন্দ")}</Label>
                  <Select value={profile.countryPref} onValueChange={v => updateField("countryPref", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bangladesh">{t("Bangladesh", "বাংলাদেশ")}</SelectItem>
                      <SelectItem value="Abroad">{t("Abroad", "বিদেশ")}</SelectItem>
                      <SelectItem value="Both">{t("Both", "উভয়")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  {[
                    { key: "hasLinkedIn" as const, label: "LinkedIn" },
                    { key: "hasPortfolio" as const, label: t("Portfolio / CV", "পোর্টফোলিও / সিভি") },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border"
                        checked={profile[key] as boolean}
                        onChange={e => updateField(key, e.target.checked)} />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
          </Button>

          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => onSubmit(profile)} disabled={isLoading}
              className="bg-hero-gradient text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-1" />
              {isLoading ? t("Analyzing...", "বিশ্লেষণ হচ্ছে...") : t("Get Career Guidance", "ক্যারিয়ার গাইডেন্স পাও")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCareerProfileForm;
