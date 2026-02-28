import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import {
  FlaskConical, Compass, Lightbulb, FileText, BookOpen, Wrench,
  BarChart3, Globe, Mic, CheckCircle2, ChevronRight, Loader2,
  GraduationCap, Target, ArrowRight, Sparkles, X, Upload,
} from "lucide-react";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResearchProfile {
  degreeLevel: string;
  major: string;
  university: string;
  researchInterest: string;
  thesisTopic: string;
  publicationStatus: string;
  toolsKnown: string[];
  futureGoal: string;
}

const TOOLS_OPTIONS = [
  "SPSS", "Python", "R", "MATLAB", "STATA", "Excel", "TensorFlow",
  "PyTorch", "LaTeX", "NVivo", "Tableau", "Power BI", "SAS",
];

const DEGREE_LEVELS = [
  { value: "undergraduate", en: "Undergraduate (Final Year)", bn: "আন্ডারগ্র্যাজুয়েট (ফাইনাল ইয়ার)" },
  { value: "masters", en: "Master's Student", bn: "মাস্টার্স শিক্ষার্থী" },
  { value: "phd", en: "PhD Aspirant / Applicant", bn: "পিএইচডি আকাঙ্ক্ষী / আবেদনকারী" },
];

const FUTURE_GOALS = [
  { value: "masters_abroad", en: "Masters Abroad", bn: "বিদেশে মাস্টার্স" },
  { value: "phd", en: "PhD", bn: "পিএইচডি" },
  { value: "academic", en: "Academic Career", bn: "একাডেমিক ক্যারিয়ার" },
  { value: "industry_rd", en: "Industry R&D", bn: "ইন্ডাস্ট্রি আরঅ্যান্ডডি" },
];

const MODULES = [
  { id: "research-direction", icon: Compass, en: "Research Direction", bn: "গবেষণা দিকনির্দেশনা", color: "text-blue-500" },
  { id: "topic-generator", icon: Lightbulb, en: "Topic Generator", bn: "টপিক জেনারেটর", color: "text-amber-500" },
  { id: "proposal-builder", icon: FileText, en: "Proposal Builder", bn: "প্রোপোজাল বিল্ডার", color: "text-green-500" },
  { id: "literature-review", icon: BookOpen, en: "Literature Review", bn: "সাহিত্য পর্যালোচনা", color: "text-purple-500" },
  { id: "methodology-suggestion", icon: BarChart3, en: "Methodology", bn: "মেথডোলজি", color: "text-indigo-500" },
  { id: "tool-guidance", icon: Wrench, en: "Tool Guidance", bn: "টুল গাইডেন্স", color: "text-orange-500" },
  { id: "publication-roadmap", icon: Globe, en: "Publication Roadmap", bn: "পাবলিকেশন রোডম্যাপ", color: "text-teal-500" },
  { id: "mock-viva", icon: Mic, en: "Mock Viva", bn: "মক ভাইভা", color: "text-red-500" },
];

const ResearchMentorPage = () => {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();

  // Profile state
  const [profileSetup, setProfileSetup] = useState(true);
  const [researchProfile, setResearchProfile] = useState<ResearchProfile>({
    degreeLevel: "", major: "", university: "", researchInterest: "",
    thesisTopic: "", publicationStatus: "none", toolsKnown: [], futureGoal: "",
  });

  // Module state
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Module-specific inputs
  const [interestQuery, setInterestQuery] = useState("");
  const [topicQuery, setTopicQuery] = useState("");
  const [proposalTopic, setProposalTopic] = useState("");
  const [proposalPurpose, setProposalPurpose] = useState("thesis");
  const [proposalNotes, setProposalNotes] = useState("");
  const [paperAbstract, setPaperAbstract] = useState("");
  const [methodologyTopic, setMethodologyTopic] = useState("");
  const [researchType, setResearchType] = useState("");
  const [paperStage, setPaperStage] = useState("planning");
  const [journalType, setJournalType] = useState("");
  const [defenseType, setDefenseType] = useState("thesis");
  const [vivaTopicDetail, setVivaTopicDetail] = useState("");

  // Progress tracker
  const [milestones, setMilestones] = useState<{ label: string; done: boolean }[]>([
    { label: t("Literature Review", "সাহিত্য পর্যালোচনা"), done: false },
    { label: t("Research Gap Identified", "গবেষণা গ্যাপ চিহ্নিত"), done: false },
    { label: t("Methodology Finalized", "মেথডোলজি চূড়ান্ত"), done: false },
    { label: t("Data Collection", "ডেটা সংগ্রহ"), done: false },
    { label: t("Data Analysis", "ডেটা বিশ্লেষণ"), done: false },
    { label: t("First Draft", "প্রথম ড্রাফট"), done: false },
    { label: t("Revision & Review", "সংশোধন ও পর্যালোচনা"), done: false },
    { label: t("Final Submission", "চূড়ান্ত জমা"), done: false },
  ]);

  const resultRef = useRef<HTMLDivElement>(null);

  const toggleTool = (tool: string) => {
    setResearchProfile(prev => ({
      ...prev,
      toolsKnown: prev.toolsKnown.includes(tool)
        ? prev.toolsKnown.filter(t => t !== tool)
        : [...prev.toolsKnown, tool],
    }));
  };

  const handleProfileSubmit = () => {
    if (!researchProfile.degreeLevel || !researchProfile.major) {
      toast({ title: t("Please fill required fields", "অনুগ্রহ করে প্রয়োজনীয় ক্ষেত্রগুলো পূরণ করুন"), variant: "destructive" });
      return;
    }
    setProfileSetup(false);
  };

  const streamAI = useCallback(async (action: string, extraData: Record<string, any> = {}) => {
    if (!user) return;
    setLoading(true);
    setResult("");
    setActiveModule(action);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action,
            data: { ...researchProfile, ...extraData },
            language: lang,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        toast({ title: err.error || "Error", variant: "destructive" });
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch {}
        }
      }
    } catch (e) {
      toast({ title: t("Network error", "নেটওয়ার্ক ত্রুটি"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, researchProfile, lang]);

  const toggleMilestone = (i: number) => {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, done: !m.done } : m));
  };

  const completedMilestones = milestones.filter(m => m.done).length;
  const progressPercent = Math.round((completedMilestones / milestones.length) * 100);

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use Research Mentor", "রিসার্চ মেন্টর ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  // Profile setup screen
  if (profileSetup) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-8 h-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("Research Mentor", "রিসার্চ মেন্টর")}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            {t("Set up your research profile to get personalized guidance", "ব্যক্তিগতকৃত নির্দেশনার জন্য আপনার গবেষণা প্রোফাইল সেট করুন")}
          </p>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Degree Level *", "ডিগ্রি লেভেল *")}</Label>
                  <Select value={researchProfile.degreeLevel} onValueChange={v => setResearchProfile(p => ({ ...p, degreeLevel: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Select", "নির্বাচন করুন")} /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_LEVELS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{lang === "bn" ? d.bn : d.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Major/Subject *", "বিষয় *")}</Label>
                  <Input placeholder={t("e.g. Computer Science", "যেমন: কম্পিউটার সায়েন্স")}
                    value={researchProfile.major}
                    onChange={e => setResearchProfile(p => ({ ...p, major: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("University", "বিশ্ববিদ্যালয়")}</Label>
                  <Input placeholder={t("e.g. University of Dhaka", "যেমন: ঢাকা বিশ্ববিদ্যালয়")}
                    value={researchProfile.university}
                    onChange={e => setResearchProfile(p => ({ ...p, university: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Research Interest", "গবেষণার আগ্রহ")}</Label>
                  <Input placeholder={t("e.g. Machine Learning, NLP", "যেমন: মেশিন লার্নিং, NLP")}
                    value={researchProfile.researchInterest}
                    onChange={e => setResearchProfile(p => ({ ...p, researchInterest: e.target.value }))} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("Thesis Topic (if any)", "থিসিস টপিক (যদি থাকে)")}</Label>
                  <Input placeholder={t("Your current or planned thesis topic", "আপনার বর্তমান বা পরিকল্পিত থিসিস টপিক")}
                    value={researchProfile.thesisTopic}
                    onChange={e => setResearchProfile(p => ({ ...p, thesisTopic: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Publication Status", "প্রকাশনার অবস্থা")}</Label>
                  <Select value={researchProfile.publicationStatus} onValueChange={v => setResearchProfile(p => ({ ...p, publicationStatus: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("No publications", "কোনো প্রকাশনা নেই")}</SelectItem>
                      <SelectItem value="in_progress">{t("Paper in progress", "পেপার চলমান")}</SelectItem>
                      <SelectItem value="submitted">{t("Submitted to journal", "জার্নালে জমা দেওয়া হয়েছে")}</SelectItem>
                      <SelectItem value="published_1">{t("1 publication", "১টি প্রকাশনা")}</SelectItem>
                      <SelectItem value="published_2plus">{t("2+ publications", "২+ প্রকাশনা")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("Future Goal", "ভবিষ্যৎ লক্ষ্য")}</Label>
                  <Select value={researchProfile.futureGoal} onValueChange={v => setResearchProfile(p => ({ ...p, futureGoal: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Select", "নির্বাচন করুন")} /></SelectTrigger>
                    <SelectContent>
                      {FUTURE_GOALS.map(g => (
                        <SelectItem key={g.value} value={g.value}>{lang === "bn" ? g.bn : g.en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Tools Known", "পরিচিত টুলস")}</Label>
                <div className="flex flex-wrap gap-2">
                  {TOOLS_OPTIONS.map(tool => (
                    <Badge key={tool} variant={researchProfile.toolsKnown.includes(tool) ? "default" : "outline"}
                      className="cursor-pointer" onClick={() => toggleTool(tool)}>
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button onClick={handleProfileSubmit} className="w-full" size="lg">
                <ArrowRight className="w-4 h-4 mr-2" />
                {t("Start Research Mentoring", "গবেষণা মেন্টরিং শুরু করুন")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main module view
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-7 h-7 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {t("Research Mentor", "রিসার্চ মেন্টর")}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setProfileSetup(true)}>
          {t("Edit Profile", "প্রোফাইল এডিট")}
        </Button>
      </div>

      {/* Profile Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center text-sm">
          <Badge variant="secondary">{researchProfile.degreeLevel}</Badge>
          <Badge variant="secondary">{researchProfile.major}</Badge>
          {researchProfile.university && <Badge variant="outline">{researchProfile.university}</Badge>}
          {researchProfile.researchInterest && <Badge variant="outline">🔬 {researchProfile.researchInterest}</Badge>}
          {researchProfile.futureGoal && <Badge variant="outline">🎯 {researchProfile.futureGoal}</Badge>}
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="modules">{t("AI Modules", "AI মডিউল")}</TabsTrigger>
          <TabsTrigger value="tracker">{t("Progress Tracker", "প্রগ্রেস ট্র্যাকার")}</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-4 mt-4">
          {/* Module Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MODULES.map(mod => (
              <motion.button key={mod.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveModule(mod.id); setResult(""); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeModule === mod.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                }`}>
                <mod.icon className={`w-6 h-6 mb-1 ${mod.color}`} />
                <p className="text-xs font-semibold text-foreground">{lang === "bn" ? mod.bn : mod.en}</p>
              </motion.button>
            ))}
          </div>

          {/* Module Input Area */}
          <AnimatePresence mode="wait">
            {activeModule && (
              <motion.div key={activeModule} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {MODULES.find(m => m.id === activeModule)?.icon && (() => {
                        const Icon = MODULES.find(m => m.id === activeModule)!.icon;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                      {lang === "bn"
                        ? MODULES.find(m => m.id === activeModule)?.bn
                        : MODULES.find(m => m.id === activeModule)?.en}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Research Direction */}
                    {activeModule === "research-direction" && (
                      <>
                        <Input placeholder={t("Specific interest area (optional)", "নির্দিষ্ট আগ্রহের ক্ষেত্র (ঐচ্ছিক)")}
                          value={interestQuery} onChange={e => setInterestQuery(e.target.value)} />
                        <Button onClick={() => streamAI("research-direction", { interestQuery })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Compass className="w-4 h-4 mr-2" />}
                          {t("Find Directions", "দিকনির্দেশনা খুঁজুন")}
                        </Button>
                      </>
                    )}

                    {/* Topic Generator */}
                    {activeModule === "topic-generator" && (
                      <>
                        <Textarea placeholder={t("Describe what kind of topics you want...", "কি ধরনের টপিক চান বর্ণনা করুন...")}
                          value={topicQuery} onChange={e => setTopicQuery(e.target.value)} rows={3} />
                        <Button onClick={() => streamAI("topic-generator", { topicQuery })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                          {t("Generate Topics", "টপিক তৈরি করুন")}
                        </Button>
                      </>
                    )}

                    {/* Proposal Builder */}
                    {activeModule === "proposal-builder" && (
                      <>
                        <Input placeholder={t("Proposal topic/title", "প্রোপোজাল টপিক/শিরোনাম")}
                          value={proposalTopic} onChange={e => setProposalTopic(e.target.value)} />
                        <Select value={proposalPurpose} onValueChange={setProposalPurpose}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thesis">{t("Thesis/Dissertation", "থিসিস/ডিজার্টেশন")}</SelectItem>
                            <SelectItem value="scholarship">{t("Scholarship Application", "স্কলারশিপ আবেদন")}</SelectItem>
                            <SelectItem value="grant">{t("Research Grant", "গবেষণা গ্রান্ট")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea placeholder={t("Additional notes (optional)", "অতিরিক্ত নোট (ঐচ্ছিক)")}
                          value={proposalNotes} onChange={e => setProposalNotes(e.target.value)} rows={2} />
                        <Button onClick={() => streamAI("proposal-builder", { proposalTopic, proposalPurpose, proposalNotes })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                          {t("Build Proposal", "প্রোপোজাল তৈরি করুন")}
                        </Button>
                      </>
                    )}

                    {/* Literature Review */}
                    {activeModule === "literature-review" && (
                      <>
                        <FileUploadZone
                          compact
                          onTextExtracted={(text) => setPaperAbstract(prev => prev ? prev + "\n\n" + text : text)}
                          accept=".pdf,.doc,.docx,.txt"
                          label={t("Upload Research Paper", "গবেষণা পেপার আপলোড")}
                        />
                        <Textarea placeholder={t("Paste paper abstract or content here...", "পেপারের অ্যাবস্ট্রাক্ট বা কনটেন্ট এখানে পেস্ট করুন...")}
                          value={paperAbstract} onChange={e => setPaperAbstract(e.target.value)} rows={5} />
                        <Button onClick={() => streamAI("literature-review", { paperAbstract })} disabled={loading || !paperAbstract.trim()} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
                          {t("Analyze Paper", "পেপার বিশ্লেষণ করুন")}
                        </Button>
                      </>
                    )}

                    {/* Methodology */}
                    {activeModule === "methodology-suggestion" && (
                      <>
                        <Input placeholder={t("Research topic for methodology", "মেথডোলজির জন্য গবেষণা টপিক")}
                          value={methodologyTopic} onChange={e => setMethodologyTopic(e.target.value)} />
                        <Select value={researchType} onValueChange={setResearchType}>
                          <SelectTrigger><SelectValue placeholder={t("Research type", "গবেষণার ধরন")} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quantitative">{t("Quantitative", "পরিমাণগত")}</SelectItem>
                            <SelectItem value="qualitative">{t("Qualitative", "গুণগত")}</SelectItem>
                            <SelectItem value="mixed">{t("Mixed Methods", "মিশ্র পদ্ধতি")}</SelectItem>
                            <SelectItem value="technical">{t("Technical/CS", "টেকনিক্যাল/সিএস")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={() => streamAI("methodology-suggestion", { methodologyTopic, researchType })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                          {t("Get Methodology", "মেথডোলজি পান")}
                        </Button>
                      </>
                    )}

                    {/* Tool Guidance */}
                    {activeModule === "tool-guidance" && (
                      <Button onClick={() => streamAI("tool-guidance")} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wrench className="w-4 h-4 mr-2" />}
                        {t("Get Tool Recommendations", "টুল সুপারিশ পান")}
                      </Button>
                    )}

                    {/* Publication Roadmap */}
                    {activeModule === "publication-roadmap" && (
                      <>
                        <Select value={paperStage} onValueChange={setPaperStage}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">{t("Planning", "পরিকল্পনা")}</SelectItem>
                            <SelectItem value="writing">{t("Writing", "লেখা চলছে")}</SelectItem>
                            <SelectItem value="review">{t("Under Review", "রিভিউতে")}</SelectItem>
                            <SelectItem value="revision">{t("Revision", "সংশোধন")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder={t("Target journal type (optional)", "টার্গেট জার্নাল ধরন (ঐচ্ছিক)")}
                          value={journalType} onChange={e => setJournalType(e.target.value)} />
                        <Button onClick={() => streamAI("publication-roadmap", { paperStage, journalType })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                          {t("Get Roadmap", "রোডম্যাপ পান")}
                        </Button>
                      </>
                    )}

                    {/* Mock Viva */}
                    {activeModule === "mock-viva" && (
                      <>
                        <Select value={defenseType} onValueChange={setDefenseType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="thesis">{t("Thesis Defense", "থিসিস ডিফেন্স")}</SelectItem>
                            <SelectItem value="proposal">{t("Proposal Defense", "প্রোপোজাল ডিফেন্স")}</SelectItem>
                            <SelectItem value="scholarship">{t("Scholarship Interview", "স্কলারশিপ ইন্টারভিউ")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder={t("Research topic detail", "গবেষণা টপিক বিস্তারিত")}
                          value={vivaTopicDetail} onChange={e => setVivaTopicDetail(e.target.value)} />
                        <Button onClick={() => streamAI("mock-viva", { defenseType, vivaTopicDetail })} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                          {t("Start Viva Prep", "ভাইভা প্রস্তুতি শুরু করুন")}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Display */}
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} ref={resultRef}>
              <Card>
                <CardContent className="p-4 md:p-6 prose prose-sm dark:prose-invert max-w-none overflow-x-auto">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Progress Tracker Tab */}
        <TabsContent value="tracker" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                {t("Research Progress", "গবেষণা অগ্রগতি")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="flex-1" />
                <span className="text-sm font-bold text-primary">{progressPercent}%</span>
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.98 }}
                    onClick={() => toggleMilestone(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      m.done ? "bg-green-500/10 border-green-500/30" : "bg-card border-border hover:border-primary/40"
                    }`}>
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${m.done ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${m.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {t(`Week ${i + 1}`, `সপ্তাহ ${i + 1}`)} → {m.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Scholarship connection hint */}
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("Research + Scholarship Connection", "গবেষণা + স্কলারশিপ সংযোগ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t(
                        "With 1 publication, your PhD scholarship probability may increase by 25%. Keep building your research portfolio!",
                        "১টি প্রকাশনা থাকলে আপনার পিএইচডি স্কলারশিপের সম্ভাবনা ২৫% বাড়তে পারে। আপনার গবেষণা পোর্টফোলিও তৈরি করতে থাকুন!"
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResearchMentorPage;
