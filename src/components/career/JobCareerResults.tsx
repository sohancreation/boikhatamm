import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, BarChart3, CalendarDays, ArrowLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import type { JobCareerProfile } from "./JobCareerProfileForm";

interface Props {
  profile: JobCareerProfile;
  onBack: () => void;
}

type TabKey = "job-mapping" | "readiness-score" | "preparation-plan";

const JobCareerResults = ({ profile, onBack }: Props) => {
  const { t, lang: language } = useLanguage();
  const { user } = useAuth();
  const savedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<TabKey>("job-mapping");
  const [results, setResults] = useState<Record<TabKey, string>>({
    "job-mapping": "", "readiness-score": "", "preparation-plan": "",
  });
  const [loading, setLoading] = useState<Record<TabKey, boolean>>({
    "job-mapping": false, "readiness-score": false, "preparation-plan": false,
  });
  const [scores, setScores] = useState<Record<string, number> | null>(null);

  const streamResult = async (action: TabKey) => {
    if (results[action]) return;
    setLoading(prev => ({ ...prev, [action]: true }));

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-mentor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action, profile, language, mode: "job" }),
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

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
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResults(prev => ({ ...prev, [action]: fullText }));

              if (action === "readiness-score") {
                const match = fullText.match(/SCORES_JSON:\s*(\{[^}]+\})/);
                if (match) {
                  try { setScores(JSON.parse(match[1])); } catch {}
                }
              }
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
      setResults(prev => ({ ...prev, [action]: t("Error loading results. Please try again.", "ফলাফল লোড করতে সমস্যা। আবার চেষ্টা করো।") }));
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
      if (user && !savedRef.current) {
        savedRef.current = true;
        supabase.from("career_results").insert({
          user_id: user.id,
          profile_data: { ...profile, mode: "job" } as any,
          results_data: results as any,
        } as any).then(() => {});
      }
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabKey);
    streamResult(tab as TabKey);
  };

  if (!results["job-mapping"] && !loading["job-mapping"]) {
    streamResult("job-mapping");
  }

  const scoreLabels: Record<string, string> = {
    technical: t("Technical Skills", "টেকনিক্যাল স্কিল"),
    communication: t("Communication", "কমিউনিকেশন"),
    experience: t("Experience", "অভিজ্ঞতা"),
    education: t("Education", "শিক্ষা"),
    cv: t("CV/Resume", "সিভি/রেজিউমি"),
    onlinePresence: t("Online Presence", "অনলাইন উপস্থিতি"),
    preparation: t("Exam Prep", "পরীক্ষার প্রস্তুতি"),
    networking: t("Networking", "নেটওয়ার্কিং"),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back to Profile", "প্রোফাইলে ফিরে যাও")}
      </Button>

      <Card className="card-gradient border-border">
        <CardContent className="py-4 flex flex-wrap gap-3 text-sm">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">💼 {profile.jobType === "sorkari" ? t("Govt", "সরকারি") : t("Private", "বেসরকারি")}</span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">🏢 {profile.jobSector}</span>
          <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium">🎓 {profile.education}</span>
          {profile.jobRole && <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full font-medium">🎯 {profile.jobRole}</span>}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="job-mapping" className="gap-1 text-xs sm:text-sm">
            <Map className="w-4 h-4" /> {t("Job Map", "জব ম্যাপ")}
          </TabsTrigger>
          <TabsTrigger value="readiness-score" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4" /> {t("Readiness", "প্রস্তুতি")}
          </TabsTrigger>
          <TabsTrigger value="preparation-plan" className="gap-1 text-xs sm:text-sm">
            <CalendarDays className="w-4 h-4" /> {t("Prep Plan", "প্রস্তুতি প্ল্যান")}
          </TabsTrigger>
        </TabsList>

        {(["job-mapping", "readiness-score", "preparation-plan"] as TabKey[]).map(tab => (
          <TabsContent key={tab} value={tab}>
            {tab === "readiness-score" && scores && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="mb-4 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      📊 {t("Job Readiness Score", "চাকরি প্রস্তুতি স্কোর")}:
                      <span className={`text-2xl ${scores.overall >= 70 ? "text-green-500" : scores.overall >= 40 ? "text-secondary" : "text-destructive"}`}>
                        {scores.overall}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(scoreLabels).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-bold text-foreground">{scores[key] ?? 0}%</span>
                        </div>
                        <Progress value={scores[key] ?? 0} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <Card className="border-border">
              <CardContent className="pt-6">
                {loading[tab] && !results[tab] ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("AI is analyzing...", "AI বিশ্লেষণ করছে...")}
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{
                      tab === "readiness-score"
                        ? results[tab].replace(/SCORES_JSON:\s*\{[^}]+\}/, "")
                        : results[tab]
                    }</ReactMarkdown>
                    {loading[tab] && <span className="inline-block w-2 h-4 bg-primary animate-pulse rounded-sm ml-1" />}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default JobCareerResults;
