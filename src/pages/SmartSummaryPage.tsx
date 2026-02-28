import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  FileText, Youtube, Globe, Type, Sparkles, Loader2,
  Copy, Check, Download, ChevronDown, Upload,
} from "lucide-react";
import { toast } from "sonner";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import FileUploadZone from "@/components/shared/FileUploadZone";

type SourceType = "text" | "youtube" | "website" | "notes" | "file";
type OutputFormat = "short" | "detailed" | "exam" | "formula" | "mcq";

const SmartSummaryPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [content, setContent] = useState("");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("short");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const sources: { type: SourceType; icon: typeof FileText; label: string; placeholder: string }[] = [
    { type: "text", icon: Type, label: t("Raw Text", "টেক্সট"), placeholder: t("Paste your text, article, or study material here...", "এখানে আপনার টেক্সট, আর্টিকেল বা পড়ার উপকরণ পেস্ট করুন...") },
    { type: "file", icon: Upload, label: t("Upload File", "ফাইল আপলোড"), placeholder: t("Upload a PDF, DOC, TXT or image file", "PDF, DOC, TXT বা ছবি ফাইল আপলোড করুন") },
    { type: "youtube", icon: Youtube, label: t("YouTube Link", "ইউটিউব লিংক"), placeholder: t("Paste YouTube video URL here...", "ইউটিউব ভিডিও লিংক দিন...") },
    { type: "website", icon: Globe, label: t("Website URL", "ওয়েবসাইট"), placeholder: t("Paste website URL here...", "ওয়েবসাইটের লিংক দিন...") },
    { type: "notes", icon: FileText, label: t("Notes / PDF Text", "নোটস"), placeholder: t("Paste text from your PDF or handwritten notes...", "PDF বা হাতে লেখা নোটসের টেক্সট পেস্ট করুন...") },
  ];

  const outputFormats: { type: OutputFormat; label: string; desc: string }[] = [
    { type: "short", label: t("Short Summary", "সংক্ষিপ্ত সারাংশ"), desc: t("5-10 bullet points", "৫-১০ বুলেট পয়েন্ট") },
    { type: "detailed", label: t("Detailed Summary", "বিস্তারিত সারাংশ"), desc: t("Comprehensive notes", "বিস্তৃত নোটস") },
    { type: "exam", label: t("Exam Notes", "পরীক্ষার নোটস"), desc: t("Key definitions & formulas", "মূল সংজ্ঞা ও সূত্র") },
    { type: "formula", label: t("Key Formulas", "মূল সূত্র"), desc: t("Formulas & equations", "সূত্র ও সমীকরণ") },
    { type: "mcq", label: t("MCQ from Content", "MCQ তৈরি"), desc: t("10 MCQs with answers", "উত্তরসহ ১০টি MCQ") },
  ];

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error(t("Please enter some content", "কিছু কনটেন্ট দিন"));
      return;
    }
    setIsLoading(true);
    setResult("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content, sourceType, outputFormat, language: lang }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed");
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader");

      let buffer = "";
      let full = "";

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
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              full += c;
              setResult(full);
            }
          } catch { /* partial */ }
        }
      }
      // Save summary result after streaming completes
      if (user && full) {
        supabase.from("ai_summaries").insert({
          user_id: user.id,
          source_type: sourceType,
          source_content: content.slice(0, 2000),
          output_format: outputFormat,
          result: full,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast.error(e.message || t("Something went wrong", "কিছু ভুল হয়েছে"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t("Copied!", "কপি হয়েছে!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use AI Smart Summary", "AI স্মার্ট সামারি ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            {t("AI Smart Summary", "AI স্মার্ট সারাংশ")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Convert any content into clean study notes instantly", "যেকোনো কনটেন্ট থেকে সাথে সাথে স্টাডি নোটস তৈরি করুন")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "ai_summaries",
            titleField: "source_content",
            pageTitle: t("Summaries", "সারাংশ"),
            icon: "✨",
            formatSubtitle: (row: any) => `${row.source_type} → ${row.output_format}`,
          }}
          onSelect={(item) => {
            setContent(item.source_content || "");
            setSourceType(item.source_type || "text");
            setOutputFormat(item.output_format || "short");
            setResult(item.result || "");
          }}
        />
      </motion.div>

      {/* Source Type Selection */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {t("Input Source", "ইনপুট সোর্স")}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sources.map((s) => (
            <button
              key={s.type}
              onClick={() => setSourceType(s.type)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                sourceType === s.type
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Input */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {t("Content", "কনটেন্ট")}
        </label>
        {sourceType === "file" ? (
          <div className="space-y-3">
            <FileUploadZone
              onTextExtracted={(text) => { setContent(text); setSourceType("text"); }}
              label={t("Upload PDF, DOC, TXT, or Image", "PDF, DOC, TXT বা ছবি আপলোড করুন")}
              description={t("File content will be extracted for summarization", "সারাংশের জন্য ফাইলের কনটেন্ট বের করা হবে")}
            />
            {content && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={sources.find((s) => s.type === sourceType)?.placeholder}
            rows={6}
            className="w-full rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        )}
      </div>

      {/* Output Format */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          {t("Output Format", "আউটপুট ফরম্যাট")}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {outputFormats.map((f) => (
            <button
              key={f.type}
              onClick={() => setOutputFormat(f.type)}
              className={`p-3 rounded-xl border text-left transition-all ${
                outputFormat === f.type
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-border hover:bg-accent"
              }`}
            >
              <span className={`text-sm font-semibold block ${outputFormat === f.type ? "text-primary" : "text-foreground"}`}>
                {f.label}
              </span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !content.trim()}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("Generating...", "তৈরি হচ্ছে...")}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {t("Generate Summary", "সারাংশ তৈরি করুন")}
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {t("Result", "ফলাফল")}
            </h3>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={handleDownload} className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={resultRef} className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SmartSummaryPage;
