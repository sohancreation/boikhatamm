import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Briefcase, Globe, Building2, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface CareerProfile {
  university: string;
  universityOther: string;
  department: string;
  departmentOther: string;
  cgpa: string;
  year: string;
  careerGoal: string;
  countryPref: string;
  industry: string;
  skills: string;
  internships: string;
  projects: string;
  extracurriculars: string;
  hasLinkedIn: boolean;
  hasGitHub: boolean;
  hasPortfolio: boolean;
}

interface Props {
  onSubmit: (profile: CareerProfile) => void;
  isLoading: boolean;
}

const universities = [
  "BUET", "University of Dhaka (DU)",
  "Jahangirnagar University (JU)", "Rajshahi University (RU)", "Chittagong University (CU)",
  "KUET", "RUET", "SUST", "Khulna University", "Jagannath University",
  "Comilla University", "National University",
  "BRAC University", "North South University (NSU)", "IUB", "AIUB", "EWU", "UIU",
  "Daffodil International University", "East West University", "AUST",
  "Other"
];

const departments = [
  "CSE / Computer Science", "EEE / Electrical Engineering", "ME / Mechanical Engineering",
  "CE / Civil Engineering", "BBA / Business Administration", "Economics", "English",
  "Bangla", "Mathematics", "Physics", "Chemistry", "Biology / Microbiology",
  "Pharmacy", "Architecture", "Law", "Media & Communication", "Sociology",
  "Political Science", "Public Administration", "Marketing", "Finance & Banking",
  "Accounting", "Management", "Other"
];

const industries = [
  "Software & IT", "Banking & Finance", "Telecommunications", "FMCG",
  "Pharmaceuticals", "Garments & Textile", "E-commerce", "EdTech",
  "Healthcare", "Manufacturing", "Consulting", "Media & Advertising",
  "NGO / Development", "Government / Public Sector", "Freelancing", "Other"
];

const CareerProfileForm = ({ onSubmit, isLoading }: Props) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<CareerProfile>({
    university: "", universityOther: "", department: "", departmentOther: "",
    cgpa: "", year: "",
    careerGoal: "", countryPref: "", industry: "",
    skills: "", internships: "", projects: "", extracurriculars: "",
    hasLinkedIn: false, hasGitHub: false, hasPortfolio: false,
  });

  const updateField = (key: keyof CareerProfile, value: string | boolean) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const steps = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: t("Academic Profile", "একাডেমিক প্রোফাইল"),
      subtitle: t("Tell us about your university", "তোমার বিশ্ববিদ্যালয় সম্পর্কে বলো"),
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: t("Career Goals", "ক্যারিয়ার লক্ষ্য"),
      subtitle: t("What do you want to achieve?", "তুমি কী অর্জন করতে চাও?"),
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: t("Skills & Experience", "দক্ষতা ও অভিজ্ঞতা"),
      subtitle: t("Your current preparation", "তোমার বর্তমান প্রস্তুতি"),
    },
  ];

  const getUniversityFinal = () => profile.university === "Other" ? profile.universityOther : profile.university;
  const getDepartmentFinal = () => profile.department === "Other" ? profile.departmentOther : profile.department;

  const canProceed = () => {
    if (step === 0) {
      const uniOk = profile.university && (profile.university !== "Other" || profile.universityOther.trim());
      const deptOk = profile.department && (profile.department !== "Other" || profile.departmentOther.trim());
      return uniOk && deptOk && profile.cgpa && profile.year;
    }
    if (step === 1) return profile.careerGoal && profile.countryPref;
    return true;
  };

  return (
    <Card className="card-gradient border-border shadow-glow-primary max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        {/* Step indicators */}
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
                  <Label>{t("University", "বিশ্ববিদ্যালয়")} *</Label>
                  <Select value={profile.university} onValueChange={v => { updateField("university", v); if (v !== "Other") updateField("universityOther", ""); }}>
                    <SelectTrigger><SelectValue placeholder={t("Select university", "বিশ্ববিদ্যালয় নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      {universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {profile.university === "Other" && (
                  <div>
                    <Label>{t("Enter University Name", "বিশ্ববিদ্যালয়ের নাম লেখো")} *</Label>
                    <Input placeholder={t("e.g. Pabna University of Science & Technology", "যেমন: পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়")}
                      value={profile.universityOther} onChange={e => updateField("universityOther", e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>{t("Department / Major", "বিভাগ / মেজর")} *</Label>
                  <Select value={profile.department} onValueChange={v => { updateField("department", v); if (v !== "Other") updateField("departmentOther", ""); }}>
                    <SelectTrigger><SelectValue placeholder={t("Select department", "বিভাগ নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {profile.department === "Other" && (
                  <div>
                    <Label>{t("Enter Department Name", "বিভাগের নাম লেখো")} *</Label>
                    <Input placeholder={t("e.g. Textile Engineering", "যেমন: টেক্সটাইল ইঞ্জিনিয়ারিং")}
                      value={profile.departmentOther} onChange={e => updateField("departmentOther", e.target.value)} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("CGPA", "সিজিপিএ")} *</Label>
                    <Input type="number" step="0.01" min="0" max="4" placeholder="3.50"
                      value={profile.cgpa} onChange={e => updateField("cgpa", e.target.value)} />
                  </div>
                  <div>
                    <Label>{t("Current Year", "বর্তমান বর্ষ")} *</Label>
                    <Select value={profile.year} onValueChange={v => updateField("year", v)}>
                      <SelectTrigger><SelectValue placeholder={t("Year", "বর্ষ")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">{t("1st Year", "১ম বর্ষ")}</SelectItem>
                        <SelectItem value="2nd Year">{t("2nd Year", "২য় বর্ষ")}</SelectItem>
                        <SelectItem value="3rd Year">{t("3rd Year", "৩য় বর্ষ")}</SelectItem>
                        <SelectItem value="4th/Final Year">{t("4th/Final Year", "৪র্থ/শেষ বর্ষ")}</SelectItem>
                        <SelectItem value="Masters">{t("Masters", "মাস্টার্স")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <Label>{t("Career Goal", "ক্যারিয়ার লক্ষ্য")} *</Label>
                  <Select value={profile.careerGoal} onValueChange={v => updateField("careerGoal", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select goal", "লক্ষ্য নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Job in Bangladesh">{t("Job in Bangladesh", "বাংলাদেশে চাকরি")}</SelectItem>
                      <SelectItem value="Job Abroad">{t("Job Abroad", "বিদেশে চাকরি")}</SelectItem>
                      <SelectItem value="Higher Study">{t("Higher Study", "উচ্চশিক্ষা")}</SelectItem>
                      <SelectItem value="Freelancing">{t("Freelancing", "ফ্রিল্যান্সিং")}</SelectItem>
                      <SelectItem value="Startup">{t("Startup", "স্টার্টআপ")}</SelectItem>
                      <SelectItem value="Research">{t("Research", "গবেষণা")}</SelectItem>
                      <SelectItem value="Government Job">{t("Government Job", "সরকারি চাকরি")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Country Preference", "দেশের পছন্দ")} *</Label>
                  <Select value={profile.countryPref} onValueChange={v => updateField("countryPref", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select preference", "পছন্দ নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bangladesh">{t("Bangladesh", "বাংলাদেশ")}</SelectItem>
                      <SelectItem value="Abroad">{t("Abroad", "বিদেশ")}</SelectItem>
                      <SelectItem value="Both">{t("Both", "উভয়")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Interested Industry", "আগ্রহী শিল্পখাত")}</Label>
                  <Select value={profile.industry} onValueChange={v => updateField("industry", v)}>
                    <SelectTrigger><SelectValue placeholder={t("Select industry", "শিল্পখাত নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>{t("Current Skills", "বর্তমান দক্ষতা")}</Label>
                  <Input placeholder={t("e.g. Python, React, Excel, Public Speaking", "যেমন: Python, React, Excel, Public Speaking")}
                    value={profile.skills} onChange={e => updateField("skills", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Internship Experience", "ইন্টার্নশিপ অভিজ্ঞতা")}</Label>
                  <Input placeholder={t("e.g. 2 months at XYZ company", "যেমন: XYZ কোম্পানিতে ২ মাস")}
                    value={profile.internships} onChange={e => updateField("internships", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Projects Done", "সম্পন্ন প্রজেক্ট")}</Label>
                  <Input placeholder={t("e.g. E-commerce site, ML model", "যেমন: ই-কমার্স সাইট, ML মডেল")}
                    value={profile.projects} onChange={e => updateField("projects", e.target.value)} />
                </div>
                <div>
                  <Label>{t("Extracurriculars", "এক্সট্রা-কারিকুলার")}</Label>
                  <Input placeholder={t("e.g. Debate club, Hackathons", "যেমন: বিতর্ক ক্লাব, হ্যাকাথন")}
                    value={profile.extracurriculars} onChange={e => updateField("extracurriculars", e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  {[
                    { key: "hasLinkedIn" as const, label: "LinkedIn" },
                    { key: "hasGitHub" as const, label: "GitHub" },
                    { key: "hasPortfolio" as const, label: t("Portfolio", "পোর্টফোলিও") },
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
            <Button onClick={() => onSubmit({ ...profile, university: getUniversityFinal(), department: getDepartmentFinal() })} disabled={isLoading}
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

export default CareerProfileForm;
