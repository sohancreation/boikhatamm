import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Search, Sparkles, Loader2, Upload, Target, FileUp, FileText, X,
} from "lucide-react";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import FileUploadZone from "@/components/shared/FileUploadZone";
import ResumeAnalysisResults from "@/components/resume/ResumeAnalysisResults";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-ai`;
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

export default function ResumeBuilderAdvanced() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [atsScore, setAtsScore] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("File too large (max 5MB)", "ফাইল খুব বড় (সর্বোচ্চ ৫MB)"));
      return;
    }
    setFileName(file.name);
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      setResumeText(await file.text());
      toast.success(t("File loaded!", "ফাইল লোড হয়েছে!"));
    } else {
      const text = await file.text();
      const cleaned = text.replace(/[^\x20-\x7E\n\r\t\u0980-\u09FF]/g, " ").replace(/\s{3,}/g, "\n").trim();
      setResumeText(cleaned.length > 100 ? cleaned : `[Uploaded file: ${file.name}]\nPlease paste the text content manually for best results.`);
      toast.success(t("Text extracted!", "টেক্সট বের হয়েছে!"));
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!user) {
      toast.error(t("Please sign up first to analyze your resume", "রিজিউমি বিশ্লেষণ করতে আগে সাইন আপ করুন"));
      navigate("/auth");
      return;
    }

    if (!resumeText.trim()) {
      toast.error(t("Please upload or paste your resume", "রিজিউমি আপলোড বা পেস্ট করুন"));
      return;
    }
    setLoading(true);
    setResult("");
    setAtsScore(null);

    try {
      const atsPromise = fetch(AI_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "ats_score", data: { resumeData: { text: resumeText }, careerMode: targetRole || "general" }, language: lang }),
      });

      const resp = await fetch(AI_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "analyze", data: { resumeText, targetRole }, language: lang }),
      });

      if (!resp.ok) throw new Error("Failed");
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "", full = "";
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
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { full += c; setResult(full); }
          } catch {}
        }
      }

      try {
        const atsResp = await atsPromise;
        if (atsResp.ok) {
          const atsData = await atsResp.json();
          setAtsScore(atsData.result);
        }
      } catch {}

      // Navigate to results view
      setShowResults(true);

      if (user && full) {
        supabase.from("saved_resumes").insert({
          user_id: user.id,
          title: fileName || `Resume Analysis - ${targetRole || "General"}`,
          resume_data: { text: resumeText.slice(0, 10000), analysis: full.slice(0, 20000), targetRole } as any,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast.error(e.message || t("Something went wrong", "কিছু ভুল হয়েছে"));
    } finally {
      setLoading(false);
    }
  };

  // ===== RESULTS PAGE =====
  if (showResults && (result || atsScore)) {
    return (
      <ResumeAnalysisResults
        result={result}
        atsScore={atsScore}
        targetRole={targetRole}
        onBack={() => setShowResults(false)}
      />
    );
  }

  // ===== INPUT FORM =====
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Search className="w-7 h-7 text-primary" />
            {t("AI Resume Analyzer", "AI রিজিউমি বিশ্লেষক")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("Upload your resume and get AI-powered feedback, ATS score, and improvement suggestions",
              "আপনার রিজিউমি আপলোড করুন এবং AI ফিডব্যাক, ATS স্কোর ও উন্নতির পরামর্শ পান")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "saved_resumes",
            titleField: "title",
            pageTitle: t("Analysis History", "বিশ্লেষণ ইতিহাস"),
            icon: "📄",
            dateField: "updated_at",
          }}
          onSelect={(item) => {
            const rd = item.resume_data;
            if (rd?.text) setResumeText(rd.text);
            if (rd?.analysis) { setResult(rd.analysis); setShowResults(true); }
            if (rd?.targetRole) setTargetRole(rd.targetRole);
          }}
        />
      </motion.div>

      {/* File Upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all group"
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} className="hidden" />
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <FileUp className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {t("Upload Your Resume", "আপনার রিজিউমি আপলোড করুন")}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {t("PDF, DOC, DOCX, or TXT (max 5MB)", "PDF, DOC, DOCX বা TXT (সর্বোচ্চ ৫MB)")}
        </p>
        {fileName && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
            <FileText className="w-4 h-4" />
            {fileName}
            <button onClick={(e) => { e.stopPropagation(); setFileName(""); setResumeText(""); }} className="hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Paste text */}
      <div className="relative">
        <div className="absolute -top-3 left-4 px-2 bg-background text-xs font-medium text-muted-foreground">
          {t("Or paste your resume text", "অথবা রিজিউমির টেক্সট পেস্ট করুন")}
        </div>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder={t("Paste your full resume text here...", "এখানে আপনার রিজিউমির সম্পূর্ণ টেক্সট পেস্ট করুন...")}
          rows={8}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Target Role */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-primary" />
          {t("Target Role (Optional)", "লক্ষ্য পদ (ঐচ্ছিক)")}
        </label>
        <input
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder={t("e.g. Software Engineer, Data Analyst", "যেমন: সফটওয়্যার ইঞ্জিনিয়ার, ডেটা অ্যানালিস্ট")}
          className={inputClass}
        />
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !resumeText.trim()}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />{t("Analyzing...", "বিশ্লেষণ হচ্ছে...")}</>
        ) : (
          <><Sparkles className="w-5 h-5" />{t("Analyze Resume & Get Score", "রিজিউমি বিশ্লেষণ ও স্কোর পান")}</>
        )}
      </button>
    </div>
  );
}
