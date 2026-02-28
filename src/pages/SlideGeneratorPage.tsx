import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Presentation, Type, FileText, Globe, Youtube, Sparkles,
  Loader2, GraduationCap, Upload,
} from "lucide-react";
import { toast } from "sonner";
import HistoryDrawer from "@/components/history/HistoryDrawer";
import SlideEditor from "@/components/slides/SlideEditor";
import type { Slide } from "@/components/slides/SlideCanvas";
import FileUploadZone from "@/components/shared/FileUploadZone";
// Slide type is imported from SlideCanvas

interface PresentationData {
  title: string;
  slides: Slide[];
}

type SourceType = "topic" | "bullets" | "website" | "youtube" | "course";
type StyleType = "academic" | "corporate" | "startup" | "minimal";

const SlideGeneratorPage = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<SourceType>("topic");
  const [content, setContent] = useState("");
  const [style, setStyle] = useState<StyleType>("minimal");
  const [slideCount, setSlideCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);

  type ExtSourceType = SourceType | "file";
  const [extSourceType, setExtSourceType] = useState<ExtSourceType>(sourceType);
  
  const sources: { type: ExtSourceType; icon: typeof Type; label: string; placeholder: string }[] = [
    { type: "topic", icon: Type, label: t("Topic Prompt", "টপিক প্রম্পট"), placeholder: t("Enter your presentation topic...", "আপনার প্রেজেন্টেশনের বিষয় লিখুন...") },
    { type: "file", icon: Upload, label: t("Upload File", "ফাইল আপলোড"), placeholder: t("Upload a file to generate slides from", "স্লাইড তৈরির জন্য ফাইল আপলোড করুন") },
    { type: "bullets", icon: FileText, label: t("Bullet Notes", "বুলেট নোটস"), placeholder: t("Enter key points, one per line...", "মূল পয়েন্ট লিখুন, প্রতি লাইনে একটি...") },
    { type: "website", icon: Globe, label: t("Website URL", "ওয়েবসাইট"), placeholder: t("Paste website URL...", "ওয়েবসাইটের লিংক দিন...") },
    { type: "youtube", icon: Youtube, label: t("YouTube Link", "ইউটিউব"), placeholder: t("Paste YouTube video URL...", "ইউটিউব লিংক দিন...") },
    { type: "course", icon: GraduationCap, label: t("Course Topic", "কোর্স টপিক"), placeholder: t("Enter course/chapter topic...", "কোর্স বা অধ্যায়ের বিষয় দিন...") },
  ];

  const styles: { type: StyleType; emoji: string; label: string; desc: string }[] = [
    { type: "academic", emoji: "🎓", label: t("Academic", "একাডেমিক"), desc: t("School & University", "স্কুল ও বিশ্ববিদ্যালয়") },
    { type: "corporate", emoji: "💼", label: t("Corporate", "কর্পোরেট"), desc: t("Business professional", "ব্যবসায়িক পেশাদার") },
    { type: "startup", emoji: "🚀", label: t("Startup Pitch", "স্টার্টআপ পিচ"), desc: t("Investor-ready", "ইনভেস্টর-রেডি") },
    { type: "minimal", emoji: "🎨", label: t("Minimal Modern", "মিনিমাল মডার্ন"), desc: t("Clean & elegant", "পরিষ্কার ও মার্জিত") },
  ];

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error(t("Please enter content", "কনটেন্ট দিন"));
      return;
    }
    setIsLoading(true);
    setPresentation(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slide-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ content, sourceType, style, slideCount, language: lang }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed");
      }

      const data = await resp.json();
      setPresentation(data);
      toast.success(t(`Generated ${data.slides?.length || 0} slides!`, `${data.slides?.length || 0}টি স্লাইড তৈরি হয়েছে!`));
      // Save slides
      if (user && data.slides) {
        supabase.from("saved_slides").insert({
          user_id: user.id,
          title: data.title || content.slice(0, 60),
          slides_data: data.slides as any,
          style,
        } as any).then(() => {});
      }
    } catch (e: any) {
      toast.error(e.message || t("Something went wrong", "কিছু ভুল হয়েছে"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("Sign up required", "সাইন আপ প্রয়োজন")}</h2>
        <p className="text-muted-foreground mb-6">{t("Please sign up first to use AI Slide Generator", "AI স্লাইড জেনারেটর ব্যবহার করতে আগে সাইন আপ করুন")}</p>
        <Link to="/auth" className="inline-block bg-hero-gradient text-primary-foreground px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
          {t("Sign Up", "সাইন আপ")}
        </Link>
      </div>
    );
  }

  // ===== EDITOR MODE =====
  if (presentation) {
    return (
      <SlideEditor
        presentation={presentation}
        onBack={() => setPresentation(null)}
        onUpdate={setPresentation}
      />
    );
  }

  // ===== GENERATOR FORM =====
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Presentation className="w-7 h-7 text-primary" />
            {t("AI Slide Generator", "AI স্লাইড জেনারেটর")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("Create professional presentations in seconds", "মুহূর্তেই প্রফেশনাল প্রেজেন্টেশন তৈরি করুন")}
          </p>
        </div>
        <HistoryDrawer
          config={{
            table: "saved_slides",
            titleField: "title",
            pageTitle: t("Presentations", "প্রেজেন্টেশন"),
            icon: "📊",
            dateField: "updated_at",
            formatSubtitle: (row: any) => row.style ? `Style: ${row.style}` : "",
          }}
          onSelect={(item) => {
            setPresentation({ title: item.title, slides: item.slides_data || [] });
          }}
        />
      </motion.div>

      {/* Input Source */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">{t("Input Source", "ইনপুট সোর্স")}</label>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {sources.map((s) => (
            <button key={s.type} onClick={() => { setExtSourceType(s.type); if (s.type !== "file") setSourceType(s.type as SourceType); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                extSourceType === s.type ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              <s.icon className="w-4 h-4" /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {extSourceType === "file" ? (
        <div className="space-y-3">
          <FileUploadZone
            onTextExtracted={(text) => { setContent(text); setSourceType("bullets"); setExtSourceType("bullets"); }}
            label={t("Upload PDF, DOC, or TXT to generate slides", "স্লাইড তৈরির জন্য PDF, DOC বা TXT আপলোড করুন")}
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
          placeholder={sources.find((s) => s.type === extSourceType)?.placeholder}
          rows={5}
          className="w-full rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      )}

      {/* Style Selection */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">{t("Presentation Style", "প্রেজেন্টেশন স্টাইল")}</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {styles.map((s) => (
            <button key={s.type} onClick={() => setStyle(s.type)}
              className={`p-3 rounded-xl border text-left transition-all ${
                style === s.type ? "bg-primary/10 border-primary" : "bg-card border-border hover:bg-accent"
              }`}
            >
              <span className="text-xl mb-1 block">{s.emoji}</span>
              <span className={`text-sm font-semibold block ${style === s.type ? "text-primary" : "text-foreground"}`}>{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slide Count + Generate */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="text-sm font-semibold text-foreground mb-1.5 block">{t("Number of Slides", "স্লাইড সংখ্যা")}</label>
          <select value={slideCount} onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-card p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {[5, 8, 10, 12, 15, 20].map((n) => (
              <option key={n} value={n}>{n} {t("slides", "স্লাইড")}</option>
            ))}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={isLoading || !content.trim()}
          className="flex-1 md:self-end py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isLoading ? t("Generating...", "তৈরি হচ্ছে...") : t("Generate Slides", "স্লাইড তৈরি করুন")}
        </button>
      </div>
    </div>
  );
};

export default SlideGeneratorPage;
