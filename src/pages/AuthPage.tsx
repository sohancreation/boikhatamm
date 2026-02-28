import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, ChevronRight, ChevronLeft, Camera, Sun, Moon, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const CLASS_OPTIONS = [
  { value: "6", en: "Class 6", bn: "৬ষ্ঠ শ্রেণি" },
  { value: "7", en: "Class 7", bn: "৭ম শ্রেণি" },
  { value: "8", en: "Class 8", bn: "৮ম শ্রেণি" },
  { value: "9", en: "Class 9", bn: "৯ম শ্রেণি" },
  { value: "10", en: "Class 10", bn: "১০ম শ্রেণি" },
  { value: "HSC", en: "HSC", bn: "এইচএসসি" },
  { value: "University", en: "University", bn: "বিশ্ববিদ্যালয়" },
  { value: "Job Candidate", en: "Job Candidate 💼", bn: "চাকরি প্রার্থী 💼" },
];

const SUBJECT_GROUP_OPTIONS = [
  { value: "Science", en: "Science", bn: "বিজ্ঞান" },
  { value: "Arts", en: "Arts", bn: "মানবিক" },
  { value: "Commerce", en: "Commerce", bn: "ব্যবসায় শিক্ষা" },
];

const BOARD_OPTIONS = [
  { value: "Dhaka", en: "Dhaka", bn: "ঢাকা" },
  { value: "Rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { value: "Chittagong", en: "Chittagong", bn: "চট্টগ্রাম" },
  { value: "Comilla", en: "Comilla", bn: "কুমিল্লা" },
  { value: "Jessore", en: "Jessore", bn: "যশোর" },
  { value: "Sylhet", en: "Sylhet", bn: "সিলেট" },
  { value: "Dinajpur", en: "Dinajpur", bn: "দিনাজপুর" },
  { value: "Barishal", en: "Barishal", bn: "বরিশাল" },
  { value: "Mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
  { value: "Madrasa", en: "Madrasa", bn: "মাদ্রাসা" },
  { value: "Technical", en: "Technical", bn: "কারিগরি" },
  { value: "English Medium", en: "English Medium", bn: "ইংরেজি মাধ্যম" },
];

const UNIVERSITY_OPTIONS = [
  { value: "BUET", en: "BUET", bn: "বুয়েট" },
  { value: "University of Dhaka", en: "University of Dhaka (DU)", bn: "ঢাকা বিশ্ববিদ্যালয়" },
  { value: "Jahangirnagar University", en: "Jahangirnagar University (JU)", bn: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়" },
  { value: "Rajshahi University", en: "Rajshahi University (RU)", bn: "রাজশাহী বিশ্ববিদ্যালয়" },
  { value: "Chittagong University", en: "Chittagong University (CU)", bn: "চট্টগ্রাম বিশ্ববিদ্যালয়" },
  { value: "KUET", en: "KUET", bn: "কুয়েট" },
  { value: "RUET", en: "RUET", bn: "রুয়েট" },
  { value: "SUST", en: "SUST", bn: "শাবিপ্রবি" },
  { value: "Khulna University", en: "Khulna University", bn: "খুলনা বিশ্ববিদ্যালয়" },
  { value: "Jagannath University", en: "Jagannath University", bn: "জগন্নাথ বিশ্ববিদ্যালয়" },
  { value: "Comilla University", en: "Comilla University", bn: "কুমিল্লা বিশ্ববিদ্যালয়" },
  { value: "National University", en: "National University", bn: "জাতীয় বিশ্ববিদ্যালয়" },
  { value: "BRAC University", en: "BRAC University", bn: "ব্র্যাক বিশ্ববিদ্যালয়" },
  { value: "North South University", en: "North South University (NSU)", bn: "নর্থ সাউথ বিশ্ববিদ্যালয়" },
  { value: "IUB", en: "IUB", bn: "আইইউবি" },
  { value: "AIUB", en: "AIUB", bn: "এআইইউবি" },
  { value: "EWU", en: "East West University", bn: "ইস্ট ওয়েস্ট বিশ্ববিদ্যালয়" },
  { value: "UIU", en: "UIU", bn: "ইউআইইউ" },
  { value: "Daffodil International University", en: "Daffodil International University", bn: "ড্যাফোডিল বিশ্ববিদ্যালয়" },
  { value: "AUST", en: "AUST", bn: "এইউএসটি" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const DEPARTMENT_OPTIONS = [
  { value: "CSE", en: "CSE / Computer Science", bn: "সিএসই / কম্পিউটার সায়েন্স" },
  { value: "EEE", en: "EEE / Electrical Engineering", bn: "ইইই / ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং" },
  { value: "ME", en: "ME / Mechanical Engineering", bn: "এমই / মেকানিক্যাল ইঞ্জিনিয়ারিং" },
  { value: "CE", en: "CE / Civil Engineering", bn: "সিই / সিভিল ইঞ্জিনিয়ারিং" },
  { value: "BBA", en: "BBA / Business Administration", bn: "বিবিএ / ব্যবসায় প্রশাসন" },
  { value: "Economics", en: "Economics", bn: "অর্থনীতি" },
  { value: "English", en: "English", bn: "ইংরেজি" },
  { value: "Bangla", en: "Bangla", bn: "বাংলা" },
  { value: "Mathematics", en: "Mathematics", bn: "গণিত" },
  { value: "Physics", en: "Physics", bn: "পদার্থবিজ্ঞান" },
  { value: "Chemistry", en: "Chemistry", bn: "রসায়ন" },
  { value: "Biology", en: "Biology / Microbiology", bn: "জীববিজ্ঞান / অণুজীববিজ্ঞান" },
  { value: "Pharmacy", en: "Pharmacy", bn: "ফার্মেসি" },
  { value: "Architecture", en: "Architecture", bn: "আর্কিটেকচার" },
  { value: "Law", en: "Law", bn: "আইন" },
  { value: "Media", en: "Media & Communication", bn: "মিডিয়া ও যোগাযোগ" },
  { value: "Sociology", en: "Sociology", bn: "সমাজবিজ্ঞান" },
  { value: "Political Science", en: "Political Science", bn: "রাষ্ট্রবিজ্ঞান" },
  { value: "Public Administration", en: "Public Administration", bn: "লোক প্রশাসন" },
  { value: "Marketing", en: "Marketing", bn: "মার্কেটিং" },
  { value: "Finance", en: "Finance & Banking", bn: "ফিন্যান্স ও ব্যাংকিং" },
  { value: "Accounting", en: "Accounting", bn: "হিসাববিজ্ঞান" },
  { value: "Management", en: "Management", bn: "ম্যানেজমেন্ট" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const CAREER_OPTIONS = [
  { value: "Engineer", en: "Engineer", bn: "ইঞ্জিনিয়ার" },
  { value: "Doctor", en: "Doctor", bn: "ডাক্তার" },
  { value: "Software Developer", en: "Software Developer", bn: "সফটওয়্যার ডেভেলপার" },
  { value: "Freelancer", en: "Freelancer", bn: "ফ্রিল্যান্সার" },
  { value: "Teacher", en: "Teacher", bn: "শিক্ষক" },
  { value: "Business", en: "Business", bn: "ব্যবসা" },
  { value: "Government Job", en: "Government Job", bn: "সরকারি চাকরি" },
  { value: "Not Sure", en: "Not Sure", bn: "নিশ্চিত নই" },
];

const GOVT_JOB_TYPES = [
  { value: "BCS", en: "BCS (Bangladesh Civil Service)", bn: "বিসিএস" },
  { value: "Bank", en: "Bank (Bangladesh Bank, Sonali, etc.)", bn: "ব্যাংক (বাংলাদেশ ব্যাংক, সোনালী ইত্যাদি)" },
  { value: "Primary Teacher", en: "Primary School Teacher (NAPE)", bn: "প্রাথমিক বিদ্যালয় শিক্ষক" },
  { value: "NTRCA", en: "NTRCA (Non-Govt Teacher)", bn: "এনটিআরসিএ (বেসরকারি শিক্ষক)" },
  { value: "Railway", en: "Bangladesh Railway", bn: "বাংলাদেশ রেলওয়ে" },
  { value: "Postal", en: "Postal Department", bn: "ডাক বিভাগ" },
  { value: "Defense", en: "Defense (Army/Navy/Air Force)", bn: "প্রতিরক্ষা (সেনা/নৌ/বিমান)" },
  { value: "Police", en: "Bangladesh Police", bn: "বাংলাদেশ পুলিশ" },
  { value: "Ministry", en: "Ministry / Secretariat", bn: "মন্ত্রণালয় / সচিবালয়" },
  { value: "Autonomous", en: "Autonomous Body", bn: "স্বায়ত্তশাসিত সংস্থা" },
  { value: "Judiciary", en: "Judiciary", bn: "বিচার বিভাগ" },
  { value: "Other Govt", en: "Other Government", bn: "অন্যান্য সরকারি" },
];

const PRIVATE_INDUSTRY_OPTIONS = [
  { value: "Software & IT", en: "Software & IT", bn: "সফটওয়্যার ও আইটি" },
  { value: "Banking & Finance", en: "Banking & Finance", bn: "ব্যাংকিং ও ফিন্যান্স" },
  { value: "Telecommunications", en: "Telecommunications", bn: "টেলিকমিউনিকেশন" },
  { value: "FMCG", en: "FMCG", bn: "এফএমসিজি" },
  { value: "Pharmaceuticals", en: "Pharmaceuticals", bn: "ফার্মাসিউটিক্যালস" },
  { value: "Garments & Textile", en: "Garments & Textile", bn: "গার্মেন্টস ও টেক্সটাইল" },
  { value: "E-commerce", en: "E-commerce", bn: "ই-কমার্স" },
  { value: "EdTech", en: "EdTech", bn: "এডটেক" },
  { value: "Healthcare", en: "Healthcare", bn: "স্বাস্থ্যসেবা" },
  { value: "Manufacturing", en: "Manufacturing", bn: "উৎপাদন" },
  { value: "Consulting", en: "Consulting", bn: "কনসাল্টিং" },
  { value: "Media & Advertising", en: "Media & Advertising", bn: "মিডিয়া ও বিজ্ঞাপন" },
  { value: "NGO / Development", en: "NGO / Development", bn: "এনজিও / উন্নয়ন" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const PRIVATE_ROLE_OPTIONS = [
  { value: "Software Engineer", en: "Software Engineer", bn: "সফটওয়্যার ইঞ্জিনিয়ার" },
  { value: "Marketing Executive", en: "Marketing Executive", bn: "মার্কেটিং এক্সিকিউটিভ" },
  { value: "HR Officer", en: "HR Officer", bn: "এইচআর অফিসার" },
  { value: "Accountant", en: "Accountant", bn: "হিসাবরক্ষক" },
  { value: "Sales Manager", en: "Sales Manager", bn: "সেলস ম্যানেজার" },
  { value: "Data Analyst", en: "Data Analyst", bn: "ডাটা অ্যানালিস্ট" },
  { value: "Content Writer", en: "Content Writer", bn: "কন্টেন্ট রাইটার" },
  { value: "Graphic Designer", en: "Graphic Designer", bn: "গ্রাফিক ডিজাইনার" },
  { value: "Project Manager", en: "Project Manager", bn: "প্রজেক্ট ম্যানেজার" },
  { value: "Business Analyst", en: "Business Analyst", bn: "বিজনেস অ্যানালিস্ট" },
  { value: "Operations Manager", en: "Operations Manager", bn: "অপারেশনস ম্যানেজার" },
  { value: "Other", en: "Other", bn: "অন্যান্য" },
];

const LANG_OPTIONS = [
  { value: "bn", en: "Bangla", bn: "বাংলা" },
  { value: "en", en: "English", bn: "ইংরেজি" },
];

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [subjectGroup, setSubjectGroup] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [universityNameOther, setUniversityNameOther] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentOther, setDepartmentOther] = useState("");
  const [board, setBoard] = useState("");
  const [prefLang, setPrefLang] = useState("bn");
  const [careerGoal, setCareerGoal] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isJobCandidate, setIsJobCandidate] = useState(false);
  const [jobSector, setJobSector] = useState("");
  const [jobType, setJobType] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [jobIndustry, setJobIndustry] = useState("");
  const [isIeltsCandidate, setIsIeltsCandidate] = useState(false);
  const [ieltsTargetBand, setIeltsTargetBand] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp } = useAuth();
  const { t, lang, toggleLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("signup") === "true") {
      setIsLogin(false);
    }
  }, [location]);

  const ADMIN_EMAIL = "sohan420rahman@gmail.com";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      if (email.toLowerCase() === ADMIN_EMAIL) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({ title: t("Error", "ত্রুটি"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSignupStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast({ title: t("Error", "ত্রুটি"), description: t("Please enter your name", "অনুগ্রহ করে নাম লিখুন"), variant: "destructive" });
      return;
    }
    if (!mobile.trim() || mobile.length < 11) {
      toast({ title: t("Error", "ত্রুটি"), description: t("Please enter a valid mobile number", "অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন"), variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const getUniversityValue = () => universityName === "Other" ? universityNameOther : universityName;
  const getDepartmentValue = () => department === "Other" ? departmentOther : department;

  const handleSignupStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classLevel) {
      toast({ title: t("Error", "ত্রুটি"), description: t("Please select your class", "অনুগ্রহ করে শ্রেণি নির্বাচন করো"), variant: "destructive" });
      return;
    }

    if (classLevel !== "University" && classLevel !== "Job Candidate" && !board) {
      toast({ title: t("Error", "ত্রুটি"), description: t("Please select your board", "অনুগ্রহ করে বোর্ড নির্বাচন করো"), variant: "destructive" });
      return;
    }

    if ((classLevel === "9" || classLevel === "10" || classLevel === "HSC") && !subjectGroup) {
      toast({ title: t("Error", "ত্রুটি"), description: t("Please select your subject group", "অনুগ্রহ করে বিষয় বিভাগ নির্বাচন করো"), variant: "destructive" });
      return;
    }

    if (classLevel === "University") {
      const uniVal = getUniversityValue();
      const deptVal = getDepartmentValue();
      if (!uniVal.trim()) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Please select or enter university name", "অনুগ্রহ করে বিশ্ববিদ্যালয়ের নাম নির্বাচন বা লেখো"), variant: "destructive" });
        return;
      }
      if (!deptVal.trim()) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Please select or enter department", "অনুগ্রহ করে বিভাগ নির্বাচন বা লেখো"), variant: "destructive" });
        return;
      }
    }

    // Validate job candidate fields (either from class selection or checkbox)
    const isJobCandidateEffective = classLevel === "Job Candidate" || isJobCandidate;
    if (isJobCandidateEffective) {
      if (!jobSector) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Please select job sector", "অনুগ্রহ করে চাকরির ধরন নির্বাচন করো"), variant: "destructive" });
        return;
      }
      if (jobSector === "sorkari" && !jobType) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Please select government job type", "অনুগ্রহ করে সরকারি চাকরির ধরন নির্বাচন করো"), variant: "destructive" });
        return;
      }
      if (jobSector === "besorkari" && (!jobIndustry || !jobRole)) {
        toast({ title: t("Error", "ত্রুটি"), description: t("Please select industry and target role", "অনুগ্রহ করে শিল্পখাত ও লক্ষ্য পদ নির্বাচন করো"), variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await signUp(email, password, fullName);
      if (error) throw error;

      if (data?.user) {
        await new Promise((r) => setTimeout(r, 500));
        const interests: string[] = [];
        if (subjectGroup) interests.push(subjectGroup);
        if (classLevel === "University") {
          const deptVal = getDepartmentValue();
          if (deptVal) interests.push(deptVal);
          const uniVal = getUniversityValue();
          if (uniVal) interests.push(`University:${uniVal}`);
        }

        let avatarUrl: string | undefined;
        if (avatarFile) {
          const ext = avatarFile.name.split(".").pop();
          const path = `${data.user.id}/avatar.${ext}`;
          const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
            avatarUrl = urlData.publicUrl;
          }
        }

        // Add job candidate info to interests
        const isJobCandidateEffective = classLevel === "Job Candidate" || isJobCandidate;
        if (isJobCandidateEffective) {
          interests.push(`JobCandidate:${jobSector}`);
          if (jobSector === "sorkari" && jobType) interests.push(`GovtJob:${jobType}`);
          if (jobSector === "besorkari") {
            if (jobIndustry) interests.push(`Industry:${jobIndustry}`);
            if (jobRole) interests.push(`Role:${jobRole}`);
          }
        }

        // Add IELTS info to interests
        if (isIeltsCandidate) {
          interests.push("IELTS");
          if (ieltsTargetBand) interests.push(`IELTSBand:${ieltsTargetBand}`);
        }

        const isJobEffective = classLevel === "Job Candidate" || isJobCandidate;
        await supabase
          .from("profiles")
          .update({
            mobile_number: mobile,
            class_level: classLevel === "Job Candidate" ? "Job Candidate" : classLevel,
            board: classLevel === "University" ? getUniversityValue() : classLevel === "Job Candidate" ? null : board,
            language: prefLang,
            goals: isJobEffective ? (jobSector === "sorkari" ? `সরকারি চাকরি - ${jobType}` : `বেসরকারি চাকরি - ${jobIndustry} - ${jobRole}`) : careerGoal,
            interests: interests.length > 0 ? interests : undefined,
            is_job_candidate: isJobEffective,
            job_sector: isJobEffective ? jobSector : null,
            job_type: isJobEffective ? (jobSector === "sorkari" ? jobType : jobIndustry) : null,
            job_role: isJobEffective && jobSector === "besorkari" ? jobRole : null,
            is_ielts_candidate: isIeltsCandidate,
            ielts_target_band: isIeltsCandidate ? ieltsTargetBand : null,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          } as any)
          .eq("user_id", data.user.id);
      }

      toast({
        title: t("Account created!", "অ্যাকাউন্ট তৈরি হয়েছে!"),
        description: t("Welcome to BoiKhata MM!", "BoiKhata MM-এ স্বাগতম!"),
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: t("Error", "ত্রুটি"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none text-sm";
  const selectClass = "w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-ring outline-none text-sm appearance-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 font-bangla relative">
      {/* Language & Dark Mode Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-accent text-sm font-medium text-foreground transition-colors"
          title={t("Switch Language", "ভাষা পরিবর্তন করো")}
        >
          <Globe className="w-4 h-4" />
          {lang === "bn" ? "EN" : "বাং"}
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-muted hover:bg-accent text-foreground transition-colors"
          title={t("Toggle Dark Mode", "ডার্ক মোড টগল করো")}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gradient">📖 BoiKhata MM</h1>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">
            {t("Your AI Mentor for Academic Success", "তোমার AI মেন্টর একাডেমিক সাফল্যের জন্য")}
          </p>
        </div>

        <div className="card-gradient border border-border rounded-xl p-6 shadow-glow-primary">
          <div className="flex mb-5 bg-muted rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setStep(1); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t("Login", "লগইন")}
            </button>
            <button
              onClick={() => { setIsLogin(false); setStep(1); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t("Sign Up", "সাইন আপ")}
            </button>
          </div>

          {isLogin && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t("Email", "ইমেইল")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder={t("your@email.com", "তোমার@ইমেইল.com")} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t("Password", "পাসওয়ার্ড")}</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-10`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("Login", "লগইন")}
              </button>
            </form>
          )}

          {!isLogin && (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSignupStep1}
                  className="space-y-3"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("Step 1 of 2 — Basic Info", "ধাপ ১/২ — মৌলিক তথ্য")}
                  </p>

                  <div className="flex justify-center mb-2">
                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                      <Avatar className="w-20 h-20 border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="Avatar preview" />
                        ) : (
                          <AvatarFallback className="bg-primary/5 text-primary">
                            <Camera className="w-6 h-6" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-background" />
                      </div>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-muted-foreground mb-2">{t("Upload photo (optional)", "ছবি আপলোড করো (ঐচ্ছিক)")}</p>

                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Full Name", "পূর্ণ নাম")} *</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputClass} placeholder={t("Enter your full name", "তোমার পূর্ণ নাম লেখো")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Email", "ইমেইল")} *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder={t("your@email.com", "তোমার@ইমেইল.com")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Mobile Number", "মোবাইল নম্বর")} *</label>
                    <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/[^0-9+]/g, ""))} required className={inputClass} placeholder="01XXXXXXXXX" maxLength={15} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Password", "পাসওয়ার্ড")} *</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={`${inputClass} pr-10`} placeholder={t("Min 6 characters", "সর্বনিম্ন ৬ অক্ষর")} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-muted-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    {t("Next", "পরবর্তী")} <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSignupStep2}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <ChevronLeft className="w-4 h-4" /> {t("Back", "পেছনে")}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      {t("Step 2 of 2 — Academic Info", "ধাপ ২/২ — শিক্ষা তথ্য")}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Current Class", "বর্তমান শ্রেণি")} *</label>
                    <select value={classLevel} onChange={(e) => {
                      const val = e.target.value;
                      setClassLevel(val);
                      setSubjectGroup(""); setUniversityName(""); setUniversityNameOther(""); setDepartment(""); setDepartmentOther("");
                      if (val === "Job Candidate") { setIsJobCandidate(true); } else { setIsJobCandidate(false); setJobSector(""); setJobType(""); setJobRole(""); setJobIndustry(""); }
                    }} required className={selectClass}>
                      <option value="">{t("Select class", "শ্রেণি নির্বাচন করো")}</option>
                      {CLASS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                      ))}
                    </select>
                  </div>

                  {(classLevel === "9" || classLevel === "10" || classLevel === "HSC") && (
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Subject Group", "বিষয় বিভাগ")} *</label>
                      <select value={subjectGroup} onChange={(e) => setSubjectGroup(e.target.value)} required className={selectClass}>
                        <option value="">{t("Select group", "বিভাগ নির্বাচন করো")}</option>
                        {SUBJECT_GROUP_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {classLevel === "University" && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground">{t("University Name", "বিশ্ববিদ্যালয়ের নাম")} *</label>
                        <select value={universityName} onChange={(e) => setUniversityName(e.target.value)} required className={selectClass}>
                          <option value="">{t("Select university", "বিশ্ববিদ্যালয় নির্বাচন করো")}</option>
                          {UNIVERSITY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                          ))}
                        </select>
                      </div>
                      {universityName === "Other" && (
                        <div>
                          <label className="text-sm font-medium text-foreground">{t("Enter University Name", "বিশ্ববিদ্যালয়ের নাম লেখো")} *</label>
                          <input type="text" value={universityNameOther} onChange={(e) => setUniversityNameOther(e.target.value)} required className={inputClass} placeholder={t("e.g. Pabna University of Science & Technology", "যেমন: পাবনা বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়")} />
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-foreground">{t("Department", "বিভাগ")} *</label>
                        <select value={department} onChange={(e) => setDepartment(e.target.value)} required className={selectClass}>
                          <option value="">{t("Select department", "বিভাগ নির্বাচন করো")}</option>
                          {DEPARTMENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                          ))}
                        </select>
                      </div>
                      {department === "Other" && (
                        <div>
                          <label className="text-sm font-medium text-foreground">{t("Enter Department Name", "বিভাগের নাম লেখো")} *</label>
                          <input type="text" value={departmentOther} onChange={(e) => setDepartmentOther(e.target.value)} required className={inputClass} placeholder={t("e.g. Textile Engineering", "যেমন: টেক্সটাইল ইঞ্জিনিয়ারিং")} />
                        </div>
                      )}
                    </>
                  )}

                  {classLevel !== "University" && classLevel !== "Job Candidate" && (
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Board", "বোর্ড")} *</label>
                      <select value={board} onChange={(e) => setBoard(e.target.value)} required className={selectClass}>
                        <option value="">{t("Select board", "বোর্ড নির্বাচন করো")}</option>
                        {BOARD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Preferred Language", "পছন্দের ভাষা")}</label>
                    <select value={prefLang} onChange={(e) => setPrefLang(e.target.value)} className={selectClass}>
                      {LANG_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                      ))}
                    </select>
                  </div>

                  {classLevel !== "Job Candidate" && !isJobCandidate && (
                    <div>
                      <label className="text-sm font-medium text-foreground">{t("Career Goal", "ক্যারিয়ার লক্ষ্য")}</label>
                      <select value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} className={selectClass}>
                        <option value="">{t("Select goal (optional)", "লক্ষ্য নির্বাচন করো (ঐচ্ছিক)")}</option>
                        {CAREER_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Job Candidate Fields — shown when class is "Job Candidate" */}
                  {classLevel === "Job Candidate" && (
                    <div className="border border-primary/20 rounded-lg p-3 space-y-3 bg-primary/5">
                      <p className="text-sm font-semibold text-primary">💼 {t("Job Preparation Details", "চাকরি প্রস্তুতির তথ্য")}</p>
                      <div>
                        <label className="text-sm font-medium text-foreground">{t("Job Sector", "চাকরির ধরন")} *</label>
                        <select value={jobSector} onChange={(e) => { setJobSector(e.target.value); setJobType(""); setJobRole(""); setJobIndustry(""); }} required className={selectClass}>
                          <option value="">{t("Select sector", "ধরন নির্বাচন করো")}</option>
                          <option value="sorkari">{t("Government (সরকারি)", "সরকারি চাকরি")}</option>
                          <option value="besorkari">{t("Private (বেসরকারি)", "বেসরকারি চাকরি")}</option>
                        </select>
                      </div>

                      {jobSector === "sorkari" && (
                        <div>
                          <label className="text-sm font-medium text-foreground">{t("Government Job Type", "সরকারি চাকরির ধরন")} *</label>
                          <select value={jobType} onChange={(e) => setJobType(e.target.value)} required className={selectClass}>
                            <option value="">{t("Select job type", "চাকরির ধরন নির্বাচন করো")}</option>
                            {GOVT_JOB_TYPES.map((opt) => (
                              <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {jobSector === "besorkari" && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-foreground">{t("Industry", "শিল্পখাত")} *</label>
                            <select value={jobIndustry} onChange={(e) => setJobIndustry(e.target.value)} required className={selectClass}>
                              <option value="">{t("Select industry", "শিল্পখাত নির্বাচন করো")}</option>
                              {PRIVATE_INDUSTRY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">{t("Target Role", "লক্ষ্য পদ")} *</label>
                            <select value={jobRole} onChange={(e) => setJobRole(e.target.value)} required className={selectClass}>
                              <option value="">{t("Select role", "পদ নির্বাচন করো")}</option>
                              {PRIVATE_ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{t(opt.en, opt.bn)}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* IELTS Candidate Toggle */}
                  <div className="border border-border rounded-lg p-3 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIeltsCandidate}
                        onChange={(e) => { setIsIeltsCandidate(e.target.checked); setIeltsTargetBand(""); }}
                        className="rounded border-input w-4 h-4 accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">{t("I'm preparing for IELTS", "আমি IELTS প্রস্তুতি নিচ্ছি")}</span>
                    </label>

                    {isIeltsCandidate && (
                      <div className="pl-1">
                        <label className="text-sm font-medium text-foreground">{t("Target Band Score", "টার্গেট ব্যান্ড স্কোর")}</label>
                        <select value={ieltsTargetBand} onChange={(e) => setIeltsTargetBand(e.target.value)} className={selectClass}>
                          <option value="">{t("Select target (optional)", "টার্গেট নির্বাচন (ঐচ্ছিক)")}</option>
                          <option value="4-5">{t("Band 4-5 (Beginner)", "ব্যান্ড ৪-৫ (নতুন)")}</option>
                          <option value="6-7">{t("Band 6-7 (Intermediate)", "ব্যান্ড ৬-৭ (মধ্যম)")}</option>
                          <option value="8+">{t("Band 8+ (Advanced)", "ব্যান্ড ৮+ (উন্নত)")}</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-hero-gradient text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t("Create Account", "অ্যাকাউন্ট তৈরি করো")}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
