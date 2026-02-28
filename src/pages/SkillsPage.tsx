import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Trophy, Lock, ArrowLeft, ChevronRight, Sparkles, Building2, DollarSign, FileCode2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { skillTracks, type SkillTrack, type SkillItem } from "@/components/skills/skillsData";
import SkillStreamView from "@/components/skills/SkillStreamView";

type View = "tracks" | "skills" | "action" | "results";
type ActionType = "skill-assessment" | "career-roadmap" | "project-review" | "company-prep" | "salary-projection";

const SkillsPage = () => {
  const { t } = useLanguage();
  const { user, userPlan } = useAuth();
  const locked = userPlan === "free";

  const [view, setView] = useState<View>("tracks");
  const [selectedTrack, setSelectedTrack] = useState<SkillTrack | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [actionType, setActionType] = useState<ActionType>("skill-assessment");
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <main className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <Lock className="w-16 h-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Please sign up first to use Skill Learning", "স্কিল শেখার ফিচার ব্যবহার করতে আগে সাইন আপ করুন")}</p>
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
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("Plus Plan Required", "প্লাস প্ল্যান প্রয়োজন")}</h2>
            <p className="text-muted-foreground mb-6">{t("Learn coding, design, freelancing and more with AI-guided courses.", "AI-গাইডেড কোর্স দিয়ে কোডিং, ডিজাইন, ফ্রিল্যান্সিং ও আরও শেখো।")}</p>
            <Link to="/pricing" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
              {t("Upgrade Now", "এখনই আপগ্রেড করো")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Results view
  if (view === "results") {
    const data: Record<string, string | boolean> = {
      ...formData,
      skillName: selectedSkill?.nameEn || "",
      track: selectedTrack?.nameEn || "",
    };

    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => setView("action")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
        </Button>
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {selectedTrack?.icon} {t(selectedTrack?.nameEn || "", selectedTrack?.nameBn || "")}
          </span>
          {selectedSkill && (
            <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-medium">
              {selectedSkill.icon} {t(selectedSkill.nameEn, selectedSkill.nameBn)}
            </span>
          )}
        </div>
        <SkillStreamView action={actionType} data={data} />
      </div>
    );
  }

  // Action selection + form
  if (view === "action" && selectedTrack) {
    const actions: { id: ActionType; icon: React.ReactNode; nameEn: string; nameBn: string; descEn: string; descBn: string }[] = [
      { id: "skill-assessment", icon: <Trophy className="w-5 h-5" />, nameEn: "Skill Assessment", nameBn: "স্কিল অ্যাসেসমেন্ট", descEn: "AI checks your current level", descBn: "AI তোমার বর্তমান লেভেল চেক করবে" },
      { id: "career-roadmap", icon: <Sparkles className="w-5 h-5" />, nameEn: "Career Roadmap", nameBn: "ক্যারিয়ার রোডম্যাপ", descEn: "6-month plan with projects & interviews", descBn: "প্রজেক্ট ও ইন্টারভিউ সহ ৬ মাসের প্ল্যান" },
      { id: "project-review", icon: <FileCode2 className="w-5 h-5" />, nameEn: "Project Review", nameBn: "প্রজেক্ট রিভিউ", descEn: "AI reviews your project", descBn: "AI তোমার প্রজেক্ট রিভিউ করবে" },
      { id: "company-prep", icon: <Building2 className="w-5 h-5" />, nameEn: "Company Prep", nameBn: "কোম্পানি প্রস্তুতি", descEn: "Company-specific interview prep", descBn: "কোম্পানি-নির্দিষ্ট ইন্টারভিউ প্রস্তুতি" },
      { id: "salary-projection", icon: <DollarSign className="w-5 h-5" />, nameEn: "Salary Projection", nameBn: "স্যালারি প্রজেকশন", descEn: "Expected salary by skill", descBn: "দক্ষতা অনুযায়ী প্রত্যাশিত বেতন" },
    ];

    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => { setView("skills"); setActionType("skill-assessment"); setFormData({}); }} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back", "পিছনে")}
        </Button>

        <h2 className="text-xl font-bold text-foreground mb-1">
          {selectedSkill ? `${selectedSkill.icon} ${t(selectedSkill.nameEn, selectedSkill.nameBn)}` : t(selectedTrack.nameEn, selectedTrack.nameBn)}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">{t("Choose what you want to do", "তুমি কী করতে চাও বেছে নাও")}</p>

        {/* Action tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {actions.map(a => (
            <button
              key={a.id}
              onClick={() => setActionType(a.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                actionType === a.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {a.icon} {t(a.nameEn, a.nameBn)}
            </button>
          ))}
        </div>

        {/* Dynamic form based on action type */}
        <Card className="card-gradient border-border">
          <CardContent className="pt-6 space-y-4">
            {actionType === "skill-assessment" && (
              <>
                <div>
                  <Label>{t("Your experience with this skill", "এই দক্ষতায় তোমার অভিজ্ঞতা")}</Label>
                  <Select value={formData.experience || ""} onValueChange={v => setFormData(p => ({ ...p, experience: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Select level", "লেভেল নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No experience">{t("No experience", "কোনো অভিজ্ঞতা নেই")}</SelectItem>
                      <SelectItem value="Beginner - some tutorials">{t("Beginner - some tutorials", "বিগিনার - কিছু টিউটোরিয়াল")}</SelectItem>
                      <SelectItem value="Intermediate - done projects">{t("Intermediate - done projects", "ইন্টারমিডিয়েট - প্রজেক্ট করেছি")}</SelectItem>
                      <SelectItem value="Advanced - professional work">{t("Advanced - professional work", "অ্যাডভান্সড - প্রফেশনাল কাজ")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("Career Goal", "ক্যারিয়ার লক্ষ্য")}</Label>
                  <Input placeholder={t("e.g. Software Engineer at Google", "যেমন: Google-এ সফটওয়্যার ইঞ্জিনিয়ার")}
                    value={formData.careerGoal || ""} onChange={e => setFormData(p => ({ ...p, careerGoal: e.target.value }))} />
                </div>
              </>
            )}

            {actionType === "career-roadmap" && (
              <>
                <div>
                  <Label>{t("Career Goal", "ক্যারিয়ার লক্ষ্য")} *</Label>
                  <Input placeholder={t("e.g. Software Engineer in 1 year", "যেমন: ১ বছরে সফটওয়্যার ইঞ্জিনিয়ার")}
                    value={formData.careerGoal || ""} onChange={e => setFormData(p => ({ ...p, careerGoal: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t("Timeline", "সময়সীমা")}</Label>
                    <Select value={formData.timeline || ""} onValueChange={v => setFormData(p => ({ ...p, timeline: v }))}>
                      <SelectTrigger><SelectValue placeholder={t("Select", "নির্বাচন করো")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3 months">{t("3 months", "৩ মাস")}</SelectItem>
                        <SelectItem value="6 months">{t("6 months", "৬ মাস")}</SelectItem>
                        <SelectItem value="1 year">{t("1 year", "১ বছর")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("Daily Hours", "দৈনিক সময়")}</Label>
                    <Select value={formData.dailyHours || ""} onValueChange={v => setFormData(p => ({ ...p, dailyHours: v }))}>
                      <SelectTrigger><SelectValue placeholder={t("Hours", "ঘণ্টা")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2 hours">{t("1-2 hours", "১-২ ঘণ্টা")}</SelectItem>
                        <SelectItem value="2-3 hours">{t("2-3 hours", "২-৩ ঘণ্টা")}</SelectItem>
                        <SelectItem value="4+ hours">{t("4+ hours", "৪+ ঘণ্টা")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>{t("Current Skills", "বর্তমান দক্ষতা")}</Label>
                  <Input placeholder={t("e.g. HTML, CSS, basic Python", "যেমন: HTML, CSS, বেসিক Python")}
                    value={formData.currentSkills || ""} onChange={e => setFormData(p => ({ ...p, currentSkills: e.target.value }))} />
                </div>
              </>
            )}

            {actionType === "project-review" && (
              <>
                <div>
                  <Label>{t("Project Name", "প্রজেক্টের নাম")} *</Label>
                  <Input value={formData.projectName || ""} onChange={e => setFormData(p => ({ ...p, projectName: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("Description", "বিবরণ")} *</Label>
                  <Textarea placeholder={t("What does your project do?", "তোমার প্রজেক্ট কী করে?")}
                    value={formData.description || ""} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("Technologies Used", "ব্যবহৃত প্রযুক্তি")} *</Label>
                  <Input placeholder="React, Node.js, MongoDB..."
                    value={formData.technologies || ""} onChange={e => setFormData(p => ({ ...p, technologies: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("GitHub URL (optional)", "GitHub URL (ঐচ্ছিক)")}</Label>
                  <Input placeholder="https://github.com/..."
                    value={formData.githubUrl || ""} onChange={e => setFormData(p => ({ ...p, githubUrl: e.target.value }))} />
                </div>
              </>
            )}

            {actionType === "company-prep" && (
              <>
                <div>
                  <Label>{t("Company Name", "কোম্পানির নাম")} *</Label>
                  <Input placeholder={t("e.g. Google, Grameenphone, BRAC", "যেমন: Google, গ্রামীণফোন, BRAC")}
                    value={formData.company || ""} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("Target Role", "লক্ষ্য পদ")}</Label>
                  <Input placeholder={t("e.g. Software Engineer", "যেমন: সফটওয়্যার ইঞ্জিনিয়ার")}
                    value={formData.targetRole || ""} onChange={e => setFormData(p => ({ ...p, targetRole: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("Your Skills", "তোমার দক্ষতা")}</Label>
                  <Input placeholder="Python, React, SQL..."
                    value={formData.skills || ""} onChange={e => setFormData(p => ({ ...p, skills: e.target.value }))} />
                </div>
              </>
            )}

            {actionType === "salary-projection" && (
              <>
                <div>
                  <Label>{t("Skills / Role", "দক্ষতা / পদ")} *</Label>
                  <Input placeholder={t("e.g. React Developer, Data Analyst", "যেমন: React Developer, Data Analyst")}
                    value={formData.skills || ""} onChange={e => setFormData(p => ({ ...p, skills: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("Experience Level", "অভিজ্ঞতার স্তর")}</Label>
                  <Select value={formData.experience || ""} onValueChange={v => setFormData(p => ({ ...p, experience: v }))}>
                    <SelectTrigger><SelectValue placeholder={t("Select", "নির্বাচন করো")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fresh graduate">{t("Fresh Graduate", "সদ্য গ্র্যাজুয়েট")}</SelectItem>
                      <SelectItem value="1-2 years">{t("1-2 years", "১-২ বছর")}</SelectItem>
                      <SelectItem value="3-5 years">{t("3-5 years", "৩-৫ বছর")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              onClick={() => setView("results")}
              className="w-full bg-hero-gradient text-primary-foreground"
              disabled={
                (actionType === "career-roadmap" && !formData.careerGoal) ||
                (actionType === "project-review" && (!formData.projectName || !formData.description || !formData.technologies)) ||
                (actionType === "company-prep" && !formData.company) ||
                (actionType === "salary-projection" && !formData.skills)
              }
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {t("Generate with AI", "AI দিয়ে তৈরি করো")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Skills list view
  if (view === "skills" && selectedTrack) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => { setView("tracks"); setSelectedTrack(null); }} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back to Tracks", "ট্র্যাকে ফিরে যাও")}
        </Button>

        <h2 className="text-xl font-bold text-foreground mb-1">
          {selectedTrack.icon} {t(selectedTrack.nameEn, selectedTrack.nameBn)}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">{t(selectedTrack.descEn, selectedTrack.descBn)}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedTrack.skills.map((skill, i) => (
            <motion.button
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { setSelectedSkill(skill); setView("action"); }}
              className="p-4 rounded-xl border border-border card-gradient hover:shadow-glow-primary transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">{skill.icon}</span>
                  <h3 className="font-bold text-foreground mt-2">{t(skill.nameEn, skill.nameBn)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t(skill.descEn, skill.descBn)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick actions without specific skill */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-foreground mb-3">🛠️ {t("Quick Tools", "কুইক টুলস")}</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { action: "company-prep" as ActionType, label: t("Company Prep", "কোম্পানি প্রস্তুতি"), icon: "🏢" },
              { action: "salary-projection" as ActionType, label: t("Salary Check", "স্যালারি চেক"), icon: "💰" },
              { action: "project-review" as ActionType, label: t("Project Review", "প্রজেক্ট রিভিউ"), icon: "📁" },
            ].map(q => (
              <button
                key={q.action}
                onClick={() => { setSelectedSkill(null); setActionType(q.action); setView("action"); }}
                className="px-4 py-2 rounded-xl border border-border bg-card hover:border-primary/50 transition-all text-sm font-medium text-foreground"
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Track selection (default)
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground text-center mb-1">
        🎯 {t("Skill শিক্ষা", "Skill শিক্ষা")}
      </h1>
      <p className="text-muted-foreground text-center mb-8 text-sm">
        {t("Industry-focused skill tracks for university students", "বিশ্ববিদ্যালয় শিক্ষার্থীদের জন্য ইন্ডাস্ট্রি-ফোকাসড স্কিল ট্র্যাক")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {skillTracks.map((track, i) => (
          <motion.button
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => { setSelectedTrack(track); setView("skills"); }}
            className={`p-6 rounded-2xl border bg-gradient-to-br ${track.colorClass} hover:scale-[1.02] transition-all text-left group`}
          >
            <span className="text-3xl">{track.icon}</span>
            <h3 className="font-bold text-foreground text-lg mt-3">{t(track.nameEn, track.nameBn)}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t(track.descEn, track.descBn)}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {track.skills.slice(0, 3).map(s => (
                <span key={s.id} className="text-xs bg-background/50 text-foreground px-2 py-0.5 rounded-full">
                  {s.icon} {t(s.nameEn, s.nameBn)}
                </span>
              ))}
              {track.skills.length > 3 && (
                <span className="text-xs text-muted-foreground px-2 py-0.5">+{track.skills.length - 3} more</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-primary font-medium">
              {t("Explore", "দেখো")} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SkillsPage;
