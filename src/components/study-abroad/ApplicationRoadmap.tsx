import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  Route, Calendar, Loader2, Sparkles, AlertTriangle,
  CheckCircle2, Clock, DollarSign, FileCheck, Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Props {
  profile: any;
  lang: string;
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-secondary/10 text-secondary border-secondary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const typeIcons: Record<string, string> = {
  application: "📝",
  test: "📚",
  scholarship: "💰",
  visa: "✈️",
};

const ApplicationRoadmap = ({ profile, lang }: Props) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-abroad", {
        body: { action: "generate_roadmap", profile, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRoadmap(data);
      toast({ title: t("Roadmap generated!", "রোডম্যাপ তৈরি হয়েছে!") });
    } catch (e: any) {
      toast({ title: t("Error", "ত্রুটি"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (key: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (!roadmap) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Route className="w-5 h-5 text-primary" />
          {t("🗺️ Application Roadmap & Deadlines", "🗺️ আবেদন রোডম্যাপ ও ডেডলাইন")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("Get a personalized month-by-month application plan with deadlines and visa guidance", "ডেডলাইন ও ভিসা গাইডেন্স সহ মাসভিত্তিক আবেদন পরিকল্পনা পাও")}</p>
        <Button onClick={generate} disabled={loading} className="bg-hero-gradient text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {t("Generate Roadmap", "রোডম্যাপ তৈরি করো")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <Route className="w-5 h-5 text-primary" />
        {t("🗺️ Application Roadmap", "🗺️ আবেদন রোডম্যাপ")}
      </h3>

      {roadmap.summary && (
        <div className="bg-accent/30 rounded-xl p-3">
          <p className="text-sm text-foreground">{roadmap.summary}</p>
        </div>
      )}

      {/* Timeline */}
      {roadmap.roadmap?.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> {t("Step-by-Step Timeline", "ধাপে ধাপে সময়সূচী")}
          </h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            {roadmap.roadmap.map((phase: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative pl-10 pb-6">
                <div className="absolute left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center z-10">
                  {i + 1}
                </div>
                <Card className="border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary">{phase.month}</span>
                      <span className="text-sm font-semibold text-foreground">{phase.title}</span>
                    </div>
                    <div className="space-y-1.5">
                      {phase.tasks?.map((task: any, j: number) => {
                        const key = `${i}-${j}`;
                        const done = completedTasks.has(key);
                        return (
                          <div key={j} className={`flex items-start gap-2 p-2 rounded-lg transition-all cursor-pointer ${done ? "bg-primary/5 line-through opacity-60" : "bg-accent/20 hover:bg-accent/40"}`} onClick={() => toggleTask(key)}>
                            <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${done ? "bg-primary border-primary" : "border-border"}`}>
                              {done && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">{task.task}</p>
                              {task.details && <p className="text-[10px] text-muted-foreground mt-0.5">{task.details}</p>}
                              <div className="flex items-center gap-2 mt-1">
                                {task.priority && <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColors[task.priority] || ""}`}>{task.priority}</Badge>}
                                {task.duration && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-3 h-3" />{task.duration}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Deadlines */}
      {roadmap.deadlines?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" /> {t("📆 Key Deadlines", "📆 গুরুত্বপূর্ণ ডেডলাইন")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roadmap.deadlines.map((d: any, i: number) => (
              <div key={i} className={`rounded-lg border p-3 ${d.urgent ? "border-destructive/30 bg-destructive/5" : "border-border bg-accent/10"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{typeIcons[d.type] || "📌"} {d.item}</span>
                  {d.urgent && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Urgent</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">📅 {d.date} • {d.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visa Checklist */}
      {roadmap.visaChecklist?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" /> {t("✈️ Visa & Requirements", "✈️ ভিসা ও প্রয়োজনীয়তা")}
          </h4>
          {roadmap.visaChecklist.map((v: any, i: number) => (
            <div key={i} className="flex items-start gap-2 bg-accent/20 rounded-lg p-2.5">
              <FileCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">{v.item}</p>
                <p className="text-[10px] text-muted-foreground">{v.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Financial Guide */}
      {roadmap.financialGuide && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> {t("💰 Financial Guide", "💰 আর্থিক গাইড")}
          </h4>
          {roadmap.financialGuide.bankStatement && (
            <div className="bg-accent/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-foreground">🏦 {t("Bank Statement", "ব্যাংক স্টেটমেন্ট")}</p>
              <p className="text-xs text-muted-foreground mt-1">{roadmap.financialGuide.bankStatement}</p>
            </div>
          )}
          {roadmap.financialGuide.estimatedCosts?.length > 0 && (
            <div className="bg-accent/10 rounded-lg p-3 border border-border">
              <p className="text-xs font-semibold text-foreground mb-2">{t("Estimated Costs", "আনুমানিক খরচ")}</p>
              {roadmap.financialGuide.estimatedCosts.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{c.item}</span>
                  <span className="font-semibold text-foreground">{c.amount}</span>
                </div>
              ))}
            </div>
          )}
          {roadmap.financialGuide.tips?.length > 0 && (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <h4 className="text-xs font-semibold text-primary mb-1">💡 {t("Tips", "টিপস")}</h4>
              {roadmap.financialGuide.tips.map((tip: string, i: number) => <p key={i} className="text-xs text-foreground">• {tip}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Regenerate */}
      <div className="flex justify-center pt-2">
        <Button onClick={generate} disabled={loading} variant="outline" size="sm">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {t("Regenerate Roadmap", "রোডম্যাপ পুনরায় তৈরি করো")}
        </Button>
      </div>
    </div>
  );
};

export default ApplicationRoadmap;
