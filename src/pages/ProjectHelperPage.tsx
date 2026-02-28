import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Globe, Smartphone, Brain, BarChart3, Briefcase, Cog, Wifi,
  FlaskConical, Palette, Lightbulb, Wrench, ArrowLeft, ArrowRight,
  Send, Loader2, FileText, Mic, FolderOpen, Sparkles, CheckCircle2,
  Download, MessageCircle, RefreshCw, Upload,
} from "lucide-react";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import HistoryDrawer from "@/components/history/HistoryDrawer";

const PROJECT_TYPES = [
  { id: "software", icon: Cpu, label: "Software Project", labelBn: "সফটওয়্যার প্রজেক্ট" },
  { id: "webapp", icon: Globe, label: "Web App", labelBn: "ওয়েব অ্যাপ" },
  { id: "mobile", icon: Smartphone, label: "Mobile App", labelBn: "মোবাইল অ্যাপ" },
  { id: "aiml", icon: Brain, label: "AI / ML Project", labelBn: "AI / ML প্রজেক্ট" },
  { id: "data", icon: BarChart3, label: "Data Analysis", labelBn: "ডেটা বিশ্লেষণ" },
  { id: "business", icon: Briefcase, label: "Business Project", labelBn: "ব্যবসায়িক প্রজেক্ট" },
  { id: "hardware", icon: Cog, label: "Engineering Hardware", labelBn: "ইঞ্জিনিয়ারিং হার্ডওয়্যার" },
  { id: "iot", icon: Wifi, label: "IoT Project", labelBn: "IoT প্রজেক্ট" },
  { id: "research", icon: FlaskConical, label: "Research-Based", labelBn: "গবেষণা ভিত্তিক" },
  { id: "design", icon: Palette, label: "Design / Creative", labelBn: "ডিজাইন / সৃজনশীল" },
];

const LEVELS = ["School", "University", "Advanced"];
const BUDGETS = ["Very Low (<$10)", "Low ($10-50)", "Medium ($50-200)", "High ($200+)"];
const TEAMS = ["Solo", "2-3 People", "4-6 People", "Large Team"];

type Step = "type" | "mode" | "idea-form" | "plan-form" | "results" | "copilot";
type TabKey = "blueprint" | "docs" | "viva" | "portfolio" | "chat";

const TAB_ACTION_MAP: Record<string, string> = {
  blueprint: "project-breakdown",
  docs: "documentation",
  viva: "viva-prep",
  portfolio: "portfolio-export",
};

const MarkdownRenderer = ({ content }: { content: string }) => (
  <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_table]:my-4 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_tr:nth-child(even)]:bg-muted/30 [&_table]:rounded-lg [&_table]:overflow-hidden [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_code]:text-xs [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_hr]:my-4 [&_hr]:border-border">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

const HISTORY_CONFIG = {
  table: "project_helper_sessions",
  titleField: "project_plan",
  dateField: "created_at",
  icon: "🛠",
  pageTitle: "Project Sessions",
  formatSubtitle: (row: any) => {
    const type = PROJECT_TYPES.find(p => p.id === row.project_type);
    return type ? `${type.label} • ${row.action}` : row.action || "";
  },
  formatBadge: (row: any) => {
    const type = PROJECT_TYPES.find(p => p.id === row.project_type);
    return type ? { text: type.label, color: "bg-primary/10 text-primary" } : null;
  },
};

const ProjectHelperPage = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [step, setStep] = useState<Step>("type");
  const [projectType, setProjectType] = useState("");
  const [mode, setMode] = useState<"ideas" | "plan" | "">("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("University");
  const [duration, setDuration] = useState("1 month");
  const [budget, setBudget] = useState("Low ($10-50)");
  const [teamSize, setTeamSize] = useState("Solo");
  const [projectPlan, setProjectPlan] = useState("");
  
  const [tabResults, setTabResults] = useState<Record<string, string>>({});
  const [tabLoading, setTabLoading] = useState<Record<string, boolean>>({});
  const [ideasResult, setIdeasResult] = useState("");
  const [ideasLoading, setIdeasLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("blueprint");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save session to DB
  const saveSession = async (action: string, result: string) => {
    if (!user) return;
    try {
      await supabase.from("project_helper_sessions" as any).insert({
        user_id: user.id,
        project_type: projectType,
        project_plan: projectPlan || subject || "Idea Generation",
        action,
        result: result.slice(0, 50000),
      } as any);
    } catch (e) {
      console.error("Save session error:", e);
    }
  };

  const streamAI = async (body: any, onDelta: (t: string) => void) => {
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-helper`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok || !resp.body) throw new Error("Stream failed");
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") return;
        try {
          const parsed = JSON.parse(json);
          const c = parsed.choices?.[0]?.delta?.content;
          if (c) onDelta(c);
        } catch {}
      }
    }
  };

  const generateIdeas = async () => {
    setIdeasLoading(true);
    setIdeasResult("");
    setStep("results");
    let full = "";
    try {
      await streamAI(
        { action: "generate-ideas", projectType, subject, level, duration, budget, teamSize, language: lang },
        (chunk) => { full += chunk; setIdeasResult(full); }
      );
      await saveSession("generate-ideas", full);
    } catch { setIdeasResult("Error generating ideas. Please try again."); }
    setIdeasLoading(false);
  };

  const generateTab = async (tab: string) => {
    const action = TAB_ACTION_MAP[tab];
    if (!action) return;
    setTabLoading((p) => ({ ...p, [tab]: true }));
    setTabResults((p) => ({ ...p, [tab]: "" }));
    let full = "";
    try {
      await streamAI(
        { action, projectType, projectPlan, language: lang },
        (chunk) => { full += chunk; setTabResults((p) => ({ ...p, [tab]: full })); }
      );
      await saveSession(action, full);
    } catch { setTabResults((p) => ({ ...p, [tab]: "Error. Please try again." })); }
    setTabLoading((p) => ({ ...p, [tab]: false }));
  };

  const buildChatContext = () => {
    const typeLabel = PROJECT_TYPES.find((p) => p.id === projectType);
    let ctx = `Project Type: ${typeLabel ? typeLabel.label : projectType}\n`;
    if (projectPlan) ctx += `Project Plan: ${projectPlan}\n`;
    if (tabResults.blueprint) ctx += `\n--- Previously Generated Blueprint ---\n${tabResults.blueprint.slice(0, 2000)}\n`;
    if (tabResults.docs) ctx += `\n--- Previously Generated Docs ---\n${tabResults.docs.slice(0, 1000)}\n`;
    return ctx;
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages((p) => [...p, userMsg]);
    setChatInput("");
    setChatLoading(true);
    let assistantContent = "";
    setChatMessages((p) => [...p, { role: "assistant", content: "" }]);

    const contextMsg = chatMessages.length === 0
      ? `[Project Context]\n${buildChatContext()}\n\n[User Question]\n${chatInput}`
      : chatInput;

    try {
      await streamAI(
        { action: "debug-assist", projectType, projectPlan, chatMessage: contextMsg, language: lang },
        (chunk) => {
          assistantContent += chunk;
          setChatMessages((p) => {
            const copy = [...p];
            copy[copy.length - 1] = { role: "assistant", content: assistantContent };
            return copy;
          });
        }
      );
    } catch { assistantContent = "Error. Try again."; }
    setChatLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  // Restore from history
  const handleHistorySelect = (item: any) => {
    setProjectType(item.project_type || "");
    setProjectPlan(item.project_plan || "");
    const action = item.action || "";
    const result = item.result || "";

    if (action === "generate-ideas") {
      setMode("ideas");
      setIdeasResult(result);
      setStep("results");
    } else {
      setMode("plan");
      const tabKey = Object.entries(TAB_ACTION_MAP).find(([, v]) => v === action)?.[0] || "blueprint";
      setTabResults((p) => ({ ...p, [tabKey]: result }));
      setActiveTab(tabKey as TabKey);
      setStep("copilot");
    }
  };

  const typeLabel = PROJECT_TYPES.find((p) => p.id === projectType);

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use AI Project Helper", "AI প্রজেক্ট হেল্পার ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 overflow-x-hidden">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-7 h-7 text-primary" />
            {t("AI Project Helper", "AI প্রজেক্ট হেল্পার")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("Your AI co-pilot for building amazing projects", "তোমার প্রজেক্ট তৈরির AI সহযোগী")}</p>
        </div>
        <HistoryDrawer config={HISTORY_CONFIG as any} onSelect={handleHistorySelect} />
      </motion.div>

      {/* Breadcrumb */}
      {step !== "type" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => setStep("type")} className="hover:text-primary transition-colors">{t("Type", "ধরন")}</button>
          <ArrowRight className="w-3 h-3" />
          {typeLabel && <span className="text-foreground font-medium">{lang === "bn" ? typeLabel.labelBn : typeLabel.label}</span>}
          {(step === "idea-form" || step === "plan-form" || step === "results" || step === "copilot") && (
            <>
              <ArrowRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{mode === "ideas" ? t("Idea Generator", "আইডিয়া জেনারেটর") : t("My Plan", "আমার প্ল্যান")}</span>
            </>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Project Type */}
        {step === "type" && (
          <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold mb-4">{t("What type of project?", "কোন ধরনের প্রজেক্ট?")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PROJECT_TYPES.map((pt) => (
                <Card
                  key={pt.id}
                  className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${projectType === pt.id ? "ring-2 ring-primary bg-primary/5" : ""}`}
                  onClick={() => { setProjectType(pt.id); setStep("mode"); }}
                >
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <pt.icon className="w-8 h-8 text-primary" />
                    <span className="text-xs md:text-sm font-medium">{lang === "bn" ? pt.labelBn : pt.label}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Mode Selection */}
        {step === "mode" && (
          <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("type")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:scale-[1.02] transition-all hover:shadow-xl border-2 hover:border-primary"
                onClick={() => { setMode("ideas"); setStep("idea-form"); }}
              >
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">{t("I Need Project Ideas", "আমার আইডিয়া দরকার")}</h3>
                  <p className="text-sm text-muted-foreground">{t("AI will generate creative, feasible project ideas for you", "AI তোমার জন্য সৃজনশীল প্রজেক্ট আইডিয়া তৈরি করবে")}</p>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:scale-[1.02] transition-all hover:shadow-xl border-2 hover:border-secondary"
                onClick={() => { setMode("plan"); setStep("plan-form"); }}
              >
                <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold">{t("I Already Have A Plan", "আমার প্ল্যান আছে")}</h3>
                  <p className="text-sm text-muted-foreground">{t("AI becomes your co-pilot: breakdown, debug, document", "AI তোমার সহযোগী হবে: ব্রেকডাউন, ডিবাগ, ডকুমেন্ট")}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* STEP 3A: Idea Form */}
        {step === "idea-form" && (
          <motion.div key="idea-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("mode")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Tell us about your needs", "তোমার প্রয়োজন জানাও")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">{t("Subject / Field", "বিষয় / ক্ষেত্র")}</label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("e.g. IoT, Machine Learning, Marketing", "যেমন: IoT, মেশিন লার্নিং, মার্কেটিং")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Level", "স্তর")}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {LEVELS.map((l) => (
                        <Badge key={l} variant={level === l ? "default" : "outline"} className="cursor-pointer" onClick={() => setLevel(l)}>{l}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Duration", "সময়কাল")}</label>
                    <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 1 month, 2 weeks" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Budget", "বাজেট")}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {BUDGETS.map((b) => (
                        <Badge key={b} variant={budget === b ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setBudget(b)}>{b}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">{t("Team Size", "দলের আকার")}</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {TEAMS.map((ts) => (
                        <Badge key={ts} variant={teamSize === ts ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setTeamSize(ts)}>{ts}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={generateIdeas} disabled={ideasLoading || !subject.trim()} className="w-full gap-2">
                  {ideasLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {t("Generate Ideas", "আইডিয়া তৈরি করো")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 3B: Plan Form */}
        {step === "plan-form" && (
          <motion.div key="plan-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("mode")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("Describe your project", "তোমার প্রজেক্ট বর্ণনা করো")}</CardTitle>
                <CardDescription>{t("The more detail you give, the better AI can help", "যত বেশি বিস্তারিত লিখবে, AI তত ভালো সাহায্য করবে")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUploadZone
                  compact
                  onTextExtracted={(text) => setProjectPlan(prev => prev ? prev + "\n\n" + text : text)}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  label={t("Upload Project Plan/Doc", "প্রজেক্ট প্ল্যান আপলোড")}
                />
                <Textarea
                  value={projectPlan}
                  onChange={(e) => setProjectPlan(e.target.value)}
                  placeholder={t("e.g. I want to build Smart Home Automation using ESP32 with app control...", "যেমন: আমি ESP32 দিয়ে স্মার্ট হোম অটোমেশন তৈরি করতে চাই...")}
                  rows={5}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { setStep("copilot"); setActiveTab("blueprint"); generateTab("blueprint"); }} disabled={tabLoading.blueprint || !projectPlan.trim()} className="gap-2">
                    <Wrench className="w-4 h-4" /> {t("Get Full Blueprint", "সম্পূর্ণ ব্লুপ্রিন্ট")}
                  </Button>
                  <Button variant="outline" onClick={() => { setStep("copilot"); setActiveTab("chat"); }} disabled={!projectPlan.trim()} className="gap-2">
                    <MessageCircle className="w-4 h-4" /> {t("Start Co-Pilot Chat", "কো-পাইলট চ্যাট শুরু")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: Results (Ideas) */}
        {step === "results" && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("idea-form")} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
              </Button>
              <Button variant="outline" size="sm" onClick={generateIdeas} disabled={ideasLoading} className="gap-1">
                <RefreshCw className={`w-3 h-3 ${ideasLoading ? "animate-spin" : ""}`} /> {t("Regenerate", "পুনরায় তৈরি")}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  {t("Project Ideas", "প্রজেক্ট আইডিয়া")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ideasLoading && !ideasResult && (
                  <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" /> {t("Generating creative ideas...", "সৃজনশীল আইডিয়া তৈরি হচ্ছে...")}
                  </div>
                )}
                {ideasResult && (
                  <div className="overflow-x-auto">
                    <MarkdownRenderer content={ideasResult} />
                    {ideasLoading && <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />}
                  </div>
                )}
                {ideasResult && !ideasLoading && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">{t("Like an idea? Describe it and get a full blueprint!", "কোনো আইডিয়া পছন্দ? বিস্তারিত লিখে সম্পূর্ণ ব্লুপ্রিন্ট নাও!")}</p>
                    <Button variant="secondary" size="sm" onClick={() => { setMode("plan"); setStep("plan-form"); }} className="gap-1">
                      <ArrowRight className="w-3 h-3" /> {t("Build This Project", "এই প্রজেক্ট তৈরি করো")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 5: Co-Pilot Mode */}
        {step === "copilot" && (
          <motion.div key="copilot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("plan-form")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> {t("Back", "পিছনে")}
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1 text-xs">
                {typeLabel && (lang === "bn" ? typeLabel.labelBn : typeLabel.label)}
              </Badge>
              {projectPlan && (
                <Badge variant="secondary" className="gap-1 text-xs max-w-xs truncate">
                  {projectPlan.slice(0, 60)}{projectPlan.length > 60 ? "..." : ""}
                </Badge>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="blueprint" className="text-xs md:text-sm gap-1"><Wrench className="w-3 h-3 hidden md:inline" />{t("Blueprint", "ব্লুপ্রিন্ট")}</TabsTrigger>
                <TabsTrigger value="docs" className="text-xs md:text-sm gap-1"><FileText className="w-3 h-3 hidden md:inline" />{t("Docs", "ডক্স")}</TabsTrigger>
                <TabsTrigger value="viva" className="text-xs md:text-sm gap-1"><Mic className="w-3 h-3 hidden md:inline" />{t("Viva", "ভাইভা")}</TabsTrigger>
                <TabsTrigger value="portfolio" className="text-xs md:text-sm gap-1"><FolderOpen className="w-3 h-3 hidden md:inline" />{t("Portfolio", "পোর্টফোলিও")}</TabsTrigger>
                <TabsTrigger value="chat" className="text-xs md:text-sm gap-1"><MessageCircle className="w-3 h-3 hidden md:inline" />{t("Chat", "চ্যাট")}</TabsTrigger>
              </TabsList>

              {(["blueprint", "docs", "viva", "portfolio"] as const).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <Card>
                    <CardContent className="p-4">
                      {!tabResults[tab] && !tabLoading[tab] && (
                        <div className="text-center py-8">
                          <Button onClick={() => generateTab(tab)} className="gap-2">
                            <Sparkles className="w-4 h-4" /> {t("Generate", "তৈরি করো")}
                          </Button>
                        </div>
                      )}
                      {tabLoading[tab] && !tabResults[tab] && (
                        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                          <Loader2 className="w-5 h-5 animate-spin" /> {t("Generating...", "তৈরি হচ্ছে...")}
                        </div>
                      )}
                      {tabResults[tab] && (
                        <div className="overflow-x-auto">
                          <MarkdownRenderer content={tabResults[tab]} />
                          {tabLoading[tab] && <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />}
                        </div>
                      )}
                      {tabResults[tab] && !tabLoading[tab] && (
                        <div className="mt-4 pt-4 border-t border-border flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => generateTab(tab)} className="gap-1">
                            <RefreshCw className="w-3 h-3" /> {t("Regenerate", "পুনরায়")}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}

              <TabsContent value="chat">
                <Card>
                  <CardContent className="p-4">
                    <div className="h-[400px] overflow-y-auto space-y-3 mb-4">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground space-y-3">
                          <MessageCircle className="w-10 h-10 mx-auto opacity-50" />
                          <p className="text-sm">{t("Your AI co-pilot knows about your project. Ask anything!", "তোমার AI কো-পাইলট তোমার প্রজেক্ট সম্পর্কে জানে। যেকোনো কিছু জিজ্ঞেস করো!")}</p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {[
                              t("How do I start?", "কিভাবে শুরু করবো?"),
                              t("What tools do I need?", "কোন টুল লাগবে?"),
                              t("Debug my issue", "সমস্যা সমাধান"),
                            ].map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => { setChatInput(suggestion); }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                            msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            {msg.role === "assistant" ? (
                              <MarkdownRenderer content={msg.content || "..."} />
                            ) : msg.content}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder={t("Ask: My WiFi not connecting...", "জিজ্ঞেস করো: আমার WiFi কানেক্ট হচ্ছে না...")}
                        disabled={chatLoading}
                      />
                      <Button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} size="icon">
                        {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectHelperPage;
