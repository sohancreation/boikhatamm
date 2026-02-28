import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  FileText, BookOpen, User, FlaskConical, Loader2, Sparkles,
  Copy, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Props {
  profile: any;
  lang: string;
  userName?: string;
}

const DocumentBuilders = ({ profile, lang, userName }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [sop, setSop] = useState<any>(null);
  const [lor, setLor] = useState<any>(null);
  const [cv, setCv] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [sopUni, setSopUni] = useState("");
  const [sopCountry, setSopCountry] = useState("");
  const [proposalTopic, setProposalTopic] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:ring-2 focus:ring-ring outline-none text-sm";

  const generate = async (action: string, extra?: any) => {
    setLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("study-abroad", {
        body: { action, profile, language: lang, extra },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === "generate_sop") setSop(data);
      else if (action === "generate_lor_guide") setLor(data);
      else if (action === "generate_academic_cv") setCv(data);
      else if (action === "generate_research_proposal") setProposal(data);

      toast({ title: t("Generated!", "তৈরি হয়েছে!") });
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: t("Copied!", "কপি হয়েছে!") });
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <Button variant="ghost" size="sm" onClick={() => copyText(text, id)} className="h-7 text-xs">
      {copied === id ? <CheckCircle2 className="w-3 h-3 mr-1 text-primary" /> : <Copy className="w-3 h-3 mr-1" />}
      {copied === id ? t("Copied", "কপি হয়েছে") : t("Copy", "কপি")}
    </Button>
  );

  const CollapsibleSection = ({ title, content, id, icon }: { title: string; content: string; id: string; icon?: React.ReactNode }) => (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => toggleSection(id)} className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
        <span className="text-sm font-medium text-foreground flex items-center gap-2">{icon}{title}</span>
        {expandedSections[id] ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expandedSections[id] && (
        <div className="p-3 border-t border-border bg-accent/10">
          <div className="flex justify-end mb-1"><CopyBtn text={content} id={id} /></div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground whitespace-pre-wrap">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        {t("📝 Document Builders", "📝 ডকুমেন্ট বিল্ডার")}
      </h3>

      <Tabs defaultValue="sop" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="sop" className="text-xs py-2">📄 SOP</TabsTrigger>
          <TabsTrigger value="lor" className="text-xs py-2">📨 LOR</TabsTrigger>
          <TabsTrigger value="cv" className="text-xs py-2">📋 CV</TabsTrigger>
          <TabsTrigger value="proposal" className="text-xs py-2">🔬 {t("Proposal", "প্রস্তাব")}</TabsTrigger>
        </TabsList>

        {/* SOP Builder */}
        <TabsContent value="sop" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{t("Generate a personalized Statement of Purpose for your application", "তোমার আবেদনের জন্য একটি ব্যক্তিগত SOP তৈরি করো")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">{t("Target University", "লক্ষ্য বিশ্ববিদ্যালয়")}</label>
              <input type="text" value={sopUni} onChange={e => setSopUni(e.target.value)} placeholder="e.g. University of Toronto" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("Target Country", "লক্ষ্য দেশ")}</label>
              <input type="text" value={sopCountry} onChange={e => setSopCountry(e.target.value)} placeholder="e.g. Canada" className={inputClass} />
            </div>
          </div>
          <Button onClick={() => generate("generate_sop", { university: sopUni, country: sopCountry })} disabled={loading === "generate_sop"} className="bg-hero-gradient text-primary-foreground">
            {loading === "generate_sop" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {t("Generate SOP", "SOP তৈরি করো")}
          </Button>

          {sop && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="bg-accent/20 rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{t("Word Count", "শব্দ সংখ্যা")}: {sop.wordCount}</span>
                  <CopyBtn text={sop.sop} id="sop-full" />
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground whitespace-pre-wrap">
                  {sop.sop}
                </div>
              </div>
              {sop.tips?.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <h4 className="text-xs font-semibold text-primary mb-1">💡 {t("Tips", "টিপস")}</h4>
                  {sop.tips.map((tip: string, i: number) => <p key={i} className="text-xs text-foreground">• {tip}</p>)}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        {/* LOR Guide */}
        <TabsContent value="lor" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{t("Get guidance on securing strong Letters of Recommendation", "শক্তিশালী রেকমেন্ডেশন লেটার পাওয়ার নির্দেশনা")}</p>
          <Button onClick={() => generate("generate_lor_guide")} disabled={loading === "generate_lor_guide"} className="bg-hero-gradient text-primary-foreground">
            {loading === "generate_lor_guide" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <BookOpen className="w-4 h-4 mr-1" />}
            {t("Generate LOR Guide", "LOR গাইড তৈরি করো")}
          </Button>

          {lor && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {lor.recommendedReferees?.map((ref: any, i: number) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold text-foreground">👤 {ref.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{ref.why}</p>
                    <p className="text-xs text-primary mt-1 italic">"{ref.approachScript}"</p>
                  </CardContent>
                </Card>
              ))}
              {lor.emailTemplate && <CollapsibleSection title={t("Email Template", "ইমেইল টেমপ্লেট")} content={lor.emailTemplate} id="lor-email" icon={<span>📧</span>} />}
              {lor.lorTemplate && <CollapsibleSection title={t("LOR Structure Template", "LOR কাঠামো")} content={lor.lorTemplate} id="lor-template" icon={<span>📄</span>} />}
              {lor.timeline && (
                <div className="bg-accent/20 rounded-lg p-3 border border-border">
                  <p className="text-xs font-semibold text-foreground">⏰ {t("Timeline", "সময়সূচী")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lor.timeline}</p>
                </div>
              )}
              {lor.tips?.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <h4 className="text-xs font-semibold text-primary mb-1">💡 {t("Tips", "টিপস")}</h4>
                  {lor.tips.map((tip: string, i: number) => <p key={i} className="text-xs text-foreground">• {tip}</p>)}
                </div>
              )}
              {lor.commonMistakes?.length > 0 && (
                <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                  <h4 className="text-xs font-semibold text-destructive mb-1">⚠️ {t("Common Mistakes", "সাধারণ ভুল")}</h4>
                  {lor.commonMistakes.map((m: string, i: number) => <p key={i} className="text-xs text-foreground">• {m}</p>)}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        {/* Academic CV */}
        <TabsContent value="cv" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{t("Generate an academic CV formatted for graduate school applications", "গ্র্যাজুয়েট স্কুলের জন্য একাডেমিক CV তৈরি করো")}</p>
          <Button onClick={() => generate("generate_academic_cv", { name: userName || "Student" })} disabled={loading === "generate_academic_cv"} className="bg-hero-gradient text-primary-foreground">
            {loading === "generate_academic_cv" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <User className="w-4 h-4 mr-1" />}
            {t("Generate Academic CV", "একাডেমিক CV তৈরি করো")}
          </Button>

          {cv && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="bg-accent/20 rounded-xl p-4 border border-border">
                <div className="flex justify-end mb-1"><CopyBtn text={cv.cv} id="cv-full" /></div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
                  <ReactMarkdown>{cv.cv}</ReactMarkdown>
                </div>
              </div>
              {cv.improvements?.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <h4 className="text-xs font-semibold text-primary mb-1">🚀 {t("Improvements", "উন্নতি")}</h4>
                  {cv.improvements.map((imp: string, i: number) => <p key={i} className="text-xs text-foreground">• {imp}</p>)}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>

        {/* Research Proposal */}
        <TabsContent value="proposal" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{t("Generate a research proposal outline for PhD/research programs", "পিএইচডি/গবেষণা প্রোগ্রামের জন্য গবেষণা প্রস্তাব তৈরি করো")}</p>
          <div>
            <label className="text-sm font-medium text-foreground">{t("Research Topic (optional)", "গবেষণার বিষয় (ঐচ্ছিক)")}</label>
            <input type="text" value={proposalTopic} onChange={e => setProposalTopic(e.target.value)} placeholder={t("e.g. Deep Learning for Medical Imaging", "যেমন: মেডিকেল ইমেজিংয়ে ডিপ লার্নিং")} className={inputClass} />
          </div>
          <Button onClick={() => generate("generate_research_proposal", { topic: proposalTopic })} disabled={loading === "generate_research_proposal"} className="bg-hero-gradient text-primary-foreground">
            {loading === "generate_research_proposal" ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FlaskConical className="w-4 h-4 mr-1" />}
            {t("Generate Proposal", "প্রস্তাব তৈরি করো")}
          </Button>

          {proposal && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {proposal.title && (
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{t("Proposed Title", "প্রস্তাবিত শিরোনাম")}</p>
                  <p className="text-sm font-semibold text-foreground">{proposal.title}</p>
                </div>
              )}
              <div className="bg-accent/20 rounded-xl p-4 border border-border">
                <div className="flex justify-end mb-1"><CopyBtn text={proposal.proposal} id="proposal-full" /></div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground">
                  <ReactMarkdown>{proposal.proposal}</ReactMarkdown>
                </div>
              </div>
              {proposal.relatedTopics?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">{t("Related Topics:", "সম্পর্কিত বিষয়:")}</span>
                  {proposal.relatedTopics.map((topic: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{topic}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentBuilders;
