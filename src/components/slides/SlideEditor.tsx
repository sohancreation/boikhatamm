import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, ChevronLeft, ChevronRight, Plus, Trash2, Copy,
  Maximize, MessageSquare, Grid3X3, ArrowLeft, X,
  ArrowUp, ArrowDown, ZoomIn, ZoomOut, Layout, FileText,
  Columns, Quote, Hash, Image, BarChart3, Layers,
  Undo2, Redo2, Play, Sparkles, Wand2, ImagePlus,
  AlignLeft, AlignCenter, AlignRight, FileDown, Palette,
  Type, PaintBucket, Loader2, ChevronDown, Move, MousePointer,
  Circle, Square, RectangleHorizontal, Bold, Italic, Underline,
  Strikethrough, Upload, Frame, Crop, GalleryHorizontal,
  LayoutGrid, PanelTop, ImageIcon, Rows3, PieChart, TrendingUp, Zap,
  RotateCcw, Minimize2, BookOpen, Megaphone, Languages, Pen,
  Save, Clock,
} from "lucide-react";
import { toast } from "sonner";
import PptxGenJS from "pptxgenjs";
import SlideCanvas, { Slide, SlideElement } from "./SlideCanvas";
import { slideThemes, getTheme, applyThemeOverrides, SlideTheme, FONT_OPTIONS } from "./themes";
import ChartEditor, { ChartData } from "./ChartEditor";
import AnimationEditor, { SlideAnimation, DEFAULT_ANIMATION, getTransitionVariants } from "./AnimationEditor";

interface PresentationData {
  title: string;
  slides: Slide[];
}

interface SlideEditorProps {
  presentation: PresentationData;
  onBack: () => void;
  onUpdate: (presentation: PresentationData) => void;
}

const LAYOUTS = [
  { id: "content", icon: FileText, label: "Content" },
  { id: "section", icon: Layers, label: "Section" },
  { id: "two-column", icon: Columns, label: "Two Column" },
  { id: "comparison", icon: Columns, label: "Comparison" },
  { id: "full-image-bg", icon: Maximize, label: "Full Image BG" },
  { id: "quote", icon: Quote, label: "Quote" },
  { id: "big-number", icon: Hash, label: "Big Number" },
  { id: "image-focus", icon: Image, label: "Image Focus" },
  { id: "image-header", icon: PanelTop, label: "Image Header" },
  { id: "image-center", icon: ImageIcon, label: "Image Center" },
  { id: "two-image", icon: GalleryHorizontal, label: "2 Images" },
  { id: "three-image", icon: Rows3, label: "3 Images" },
  { id: "chart", icon: BarChart3, label: "Chart" },
];

const IMAGE_POSITIONS = [
  { id: "right", label: "Right" },
  { id: "left", label: "Left" },
  { id: "background", label: "BG" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
];

const IMAGE_SHAPES = [
  { id: "rectangle", label: "Rect", icon: RectangleHorizontal },
  { id: "rounded", label: "Round", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
];

const IMAGE_FRAMES = [
  { id: "none", label: "None" },
  { id: "shadow", label: "Shadow" },
  { id: "border", label: "Border" },
  { id: "polaroid", label: "Polaroid" },
  { id: "double-border", label: "Double" },
];

const IMAGE_FITS = [
  { id: "cover", label: "Cover" },
  { id: "contain", label: "Contain" },
  { id: "fill", label: "Fill" },
];

const WORD_ART_PRESETS = [
  { id: "none", label: "None", emoji: "—" },
  { id: "shadow", label: "Shadow", emoji: "🌑" },
  { id: "outline", label: "Outline", emoji: "🔲" },
  { id: "glow", label: "Glow", emoji: "✨" },
  { id: "gradient", label: "Gradient", emoji: "🌈" },
  { id: "retro", label: "Retro", emoji: "📺" },
  { id: "neon", label: "Neon", emoji: "💡" },
];

const AI_TEXT_ACTIONS = [
  { id: "rewrite", label: "Rewrite", labelBn: "পুনর্লিখন", icon: Pen, desc: "Fresh wording" },
  { id: "shorten", label: "Shorten", labelBn: "সংক্ষিপ্ত", icon: Minimize2, desc: "More concise" },
  { id: "expand", label: "Expand", labelBn: "বিস্তৃত", icon: Maximize, desc: "More detail" },
  { id: "academic", label: "Academic", labelBn: "একাডেমিক", icon: BookOpen, desc: "Scholarly tone" },
  { id: "persuasive", label: "Persuasive", labelBn: "প্ররোচনামূলক", icon: Megaphone, desc: "Compelling" },
  { id: "simplify", label: "Simplify", labelBn: "সরলীকরণ", icon: Languages, desc: "Easy language" },
  { id: "formal", label: "Formal", labelBn: "আনুষ্ঠানিক", icon: FileText, desc: "Business tone" },
  { id: "casual", label: "Casual", labelBn: "অনানুষ্ঠানিক", icon: MessageSquare, desc: "Friendly tone" },
];

const SlideEditor = ({ presentation, onBack, onUpdate }: SlideEditorProps) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [themeId, setThemeId] = useState("midnight");
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const [gridView, setGridView] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [editingTitle, setEditingTitle] = useState(false);
  const [history, setHistory] = useState<PresentationData[]>([presentation]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [generatingImageIdx, setGeneratingImageIdx] = useState<number | null>(null);
  const [improvingTextIdx, setImprovingTextIdx] = useState<number | null>(null);
  const [propertiesTab, setPropertiesTab] = useState<"layout" | "style" | "theme" | "elements" | "charts" | "animation">("layout");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showAiTextMenu, setShowAiTextMenu] = useState(false);
  const [transformingText, setTransformingText] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const deviceImageRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseTheme = getTheme(themeId);
  const theme = Object.keys(themeOverrides).length > 0 ? applyThemeOverrides(baseTheme, themeOverrides) : baseTheme;
  const slide = presentation.slides[currentSlide];
  const selectedElement = slide?.elements?.find(el => el.id === selectedElementId);

  // ===== AUTOSAVE =====
  useEffect(() => {
    if (!user) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const { data: existing } = await supabase
          .from("saved_slides")
          .select("id")
          .eq("user_id", user.id)
          .eq("title", presentation.title)
          .limit(1);
        
        if (existing && existing.length > 0) {
          await supabase.from("saved_slides").update({
            slides_data: presentation.slides as any,
            style: themeId,
          } as any).eq("id", existing[0].id);
        } else {
          await supabase.from("saved_slides").insert({
            user_id: user.id,
            title: presentation.title,
            slides_data: presentation.slides as any,
            style: themeId,
          } as any);
        }
        setLastSaved(new Date());
      } catch {}
    }, 5000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [presentation, user, themeId]);

  // History
  const pushHistory = useCallback((p: PresentationData) => {
    setHistory(prev => [...prev.slice(0, historyIdx + 1), p].slice(-50));
    setHistoryIdx(prev => Math.min(prev + 1, 49));
    onUpdate(p);
  }, [historyIdx, onUpdate]);

  const undo = useCallback(() => {
    if (historyIdx > 0) { const i = historyIdx - 1; setHistoryIdx(i); onUpdate(history[i]); }
  }, [historyIdx, history, onUpdate]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) { const i = historyIdx + 1; setHistoryIdx(i); onUpdate(history[i]); }
  }, [historyIdx, history, onUpdate]);

  const updateSlide = useCallback((idx: number, updated: Slide) => {
    const slides = [...presentation.slides]; slides[idx] = updated;
    pushHistory({ ...presentation, slides });
  }, [presentation, pushHistory]);

  const addSlide = useCallback(() => {
    const newSlide: Slide = { slideNumber: 0, title: "New Slide", bullets: ["Add your content here"], speakerNotes: "", visualSuggestion: "", layout: "content" };
    const slides = [...presentation.slides, newSlide];
    slides.forEach((s, i) => (s.slideNumber = i + 1));
    pushHistory({ ...presentation, slides });
    setCurrentSlide(slides.length - 1);
  }, [presentation, pushHistory]);

  const addSlideWithLayout = useCallback((layout: string) => {
    const templates: Record<string, Partial<Slide>> = {
      section: { title: "Section Title", bullets: ["Section subtitle"], layout: "section" },
      quote: { title: "Your inspiring quote goes here", bullets: ["Author Name"], layout: "quote" },
      "big-number": { title: "85%", bullets: ["Key metric description", "Supporting detail"], layout: "big-number" },
      "two-column": { title: "Comparison", bullets: ["Left point 1", "Left point 2", "Right point 1", "Right point 2"], layout: "two-column" },
      comparison: { title: "Option A vs Option B", bullets: ["Pro: Feature 1", "Pro: Feature 2", "Con: Limitation 1", "Con: Limitation 2"], layout: "comparison" },
      "full-image-bg": { title: "Bold Statement", bullets: ["Supporting context"], layout: "full-image-bg" },
      "image-focus": { title: "Visual Highlight", bullets: ["Key insight"], visualSuggestion: "Add your image here", layout: "image-focus" },
      "image-header": { title: "Header Image", bullets: ["Key description"], visualSuggestion: "Full-width header image", layout: "image-header" },
      "image-center": { title: "Centered Visual", bullets: ["Caption text"], visualSuggestion: "Center image", layout: "image-center" },
      "two-image": { title: "Compare Two", bullets: ["First image description", "Second image description"], layout: "two-image" },
      "three-image": { title: "Three Highlights", bullets: ["First", "Second", "Third"], layout: "three-image" },
      chart: { title: "Data Overview", bullets: ["Insight 1", "Insight 2"], visualSuggestion: "Chart", layout: "chart" },
      content: { title: "New Slide", bullets: ["Add your content here"], layout: "content" },
    };
    const tmpl = templates[layout] || templates.content;
    const newSlide: Slide = { slideNumber: 0, title: tmpl.title!, bullets: tmpl.bullets!, speakerNotes: "", visualSuggestion: tmpl.visualSuggestion || "", layout: tmpl.layout || "content" };
    const slides = [...presentation.slides]; slides.splice(currentSlide + 1, 0, newSlide);
    slides.forEach((s, i) => (s.slideNumber = i + 1));
    pushHistory({ ...presentation, slides }); setCurrentSlide(currentSlide + 1);
  }, [presentation, currentSlide, pushHistory]);

  const duplicateSlide = useCallback(() => {
    const slides = [...presentation.slides]; slides.splice(currentSlide + 1, 0, { ...slides[currentSlide], elements: slides[currentSlide].elements?.map(e => ({ ...e, id: crypto.randomUUID() })) });
    slides.forEach((s, i) => (s.slideNumber = i + 1));
    pushHistory({ ...presentation, slides }); setCurrentSlide(currentSlide + 1);
  }, [presentation, currentSlide, pushHistory]);

  const deleteSlide = useCallback(() => {
    if (presentation.slides.length <= 1) return;
    const slides = presentation.slides.filter((_, i) => i !== currentSlide);
    slides.forEach((s, i) => (s.slideNumber = i + 1));
    pushHistory({ ...presentation, slides }); setCurrentSlide(Math.min(currentSlide, slides.length - 1));
  }, [presentation, currentSlide, pushHistory]);

  const moveSlide = useCallback((dir: -1 | 1) => {
    const newIdx = currentSlide + dir;
    if (newIdx < 0 || newIdx >= presentation.slides.length) return;
    const slides = [...presentation.slides];
    [slides[currentSlide], slides[newIdx]] = [slides[newIdx], slides[currentSlide]];
    slides.forEach((s, i) => (s.slideNumber = i + 1));
    pushHistory({ ...presentation, slides }); setCurrentSlide(newIdx);
  }, [presentation, currentSlide, pushHistory]);

  const changeLayout = useCallback((layout: string) => { updateSlide(currentSlide, { ...slide, layout }); }, [currentSlide, slide, updateSlide]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSlide(currentSlide, { ...slide, speakerNotes: e.target.value });
  }, [currentSlide, slide, updateSlide]);

  const handleTitleSave = useCallback(() => {
    if (!titleRef.current) return;
    pushHistory({ ...presentation, title: titleRef.current.value }); setEditingTitle(false);
  }, [presentation, pushHistory]);

  // ===== FREEFORM ELEMENT MANAGEMENT =====
  const toggleFreeformMode = useCallback(() => {
    updateSlide(currentSlide, { ...slide, freeformMode: !slide.freeformMode, elements: slide.elements || [] });
  }, [currentSlide, slide, updateSlide]);

  const addElement = useCallback((type: "text" | "image") => {
    const elements = [...(slide.elements || [])];
    const newEl: SlideElement = {
      id: crypto.randomUUID(), type,
      x: 10 + Math.random() * 30, y: 20 + Math.random() * 30,
      width: type === "text" ? 30 : 20, height: type === "text" ? 10 : 20,
      content: type === "text" ? "Edit this text" : undefined,
      fontSize: 28, fontWeight: "normal", fontStyle: "normal",
      fontFamily: theme.slide.fontBody, color: theme.slide.bodyText,
      align: "left", imageShape: "rounded", imageFrame: "none",
      imageFit: "cover", opacity: 1, wordArt: "none",
    };
    elements.push(newEl);
    updateSlide(currentSlide, { ...slide, freeformMode: true, elements });
    setSelectedElementId(newEl.id); setPropertiesTab("elements");
  }, [currentSlide, slide, updateSlide, theme]);

  const deleteElement = useCallback(() => {
    if (!selectedElementId || !slide.elements) return;
    const elements = slide.elements.filter(el => el.id !== selectedElementId);
    updateSlide(currentSlide, { ...slide, elements });
    setSelectedElementId(null);
  }, [currentSlide, slide, updateSlide, selectedElementId]);

  const updateElement = useCallback((updates: Partial<SlideElement>) => {
    if (!selectedElementId || !slide.elements) return;
    const elements = slide.elements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el);
    updateSlide(currentSlide, { ...slide, elements });
  }, [currentSlide, slide, updateSlide, selectedElementId]);

  // ===== DEVICE IMAGE UPLOAD =====
  const handleDeviceImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (selectedElement?.type === "image") {
        updateElement({ imageUrl: dataUrl });
      } else {
        updateSlide(currentSlide, { ...slide, imageUrl: dataUrl });
      }
      toast.success(t("Image uploaded!", "ছবি আপলোড হয়েছে!"));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [currentSlide, slide, updateSlide, selectedElement, updateElement, t]);

  // ===== AI IMAGE GENERATION =====
  const generateImage = useCallback(async () => {
    const prompt = slide.visualSuggestion || slide.title;
    setGeneratingImageIdx(currentSlide);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slide-ai-tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "generate-image", prompt }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      if (data.imageUrl) {
        if (selectedElement?.type === "image") { updateElement({ imageUrl: data.imageUrl }); }
        else { updateSlide(currentSlide, { ...slide, imageUrl: data.imageUrl }); }
        toast.success(t("Image generated!", "ছবি তৈরি হয়েছে!"));
      }
    } catch (e: any) {
      toast.error(e.message || t("Image generation failed", "ছবি তৈরি ব্যর্থ"));
    } finally { setGeneratingImageIdx(null); }
  }, [currentSlide, slide, updateSlide, t, selectedElement, updateElement]);

  // ===== AI TEXT IMPROVEMENT (legacy) =====
  const improveText = useCallback(async () => {
    setImprovingTextIdx(currentSlide);
    try {
      const text = `Title: ${slide.title}\nBullets:\n${slide.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slide-ai-tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "improve-text", text, language: lang }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      if (data.title && data.bullets) {
        updateSlide(currentSlide, { ...slide, title: data.title, bullets: data.bullets });
        toast.success(t("Text improved!", "টেক্সট উন্নত হয়েছে!"));
      }
    } catch (e: any) {
      toast.error(e.message || t("Text improvement failed", "টেক্সট উন্নতি ব্যর্থ"));
    } finally { setImprovingTextIdx(null); }
  }, [currentSlide, slide, updateSlide, lang, t]);

  // ===== AI TEXT TRANSFORM (new: rewrite/shorten/expand/tone) =====
  const transformText = useCallback(async (tone: string) => {
    setTransformingText(tone);
    setShowAiTextMenu(false);
    try {
      const text = `Title: ${slide.title}\nBullets:\n${slide.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slide-ai-tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: "transform-text", text, language: lang, tone }),
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed"); }
      const data = await resp.json();
      if (data.title && data.bullets) {
        updateSlide(currentSlide, { ...slide, title: data.title, bullets: data.bullets });
        const action = AI_TEXT_ACTIONS.find(a => a.id === tone);
        toast.success(t(`Text ${action?.label || "transformed"}!`, `টেক্সট ${action?.labelBn || "রূপান্তরিত"}!`));
      }
    } catch (e: any) {
      toast.error(e.message || t("Text transformation failed", "টেক্সট রূপান্তর ব্যর্থ"));
    } finally { setTransformingText(null); }
  }, [currentSlide, slide, updateSlide, lang, t]);

  // ===== PPTX EXPORT =====
  const downloadPptx = async () => {
    const c = theme.pptx;
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; pptx.author = "BoiKhata MM"; pptx.title = presentation.title;

    for (const sl of presentation.slides) {
      const s = pptx.addSlide();
      const isTitle = sl.layout === "title" || sl.slideNumber === 1;

      if (isTitle || sl.layout === "section") {
        s.background = sl.imageUrl && sl.imagePosition === "background" ? { data: sl.imageUrl } as any : { color: c.titleBg };
        if (sl.imageUrl && sl.imagePosition === "background") {
          s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "000000", transparency: 50 } });
        }
        s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: c.accent } });
        s.addText(sl.title, { x: 0.8, y: 2.0, w: "85%", h: 1.8, fontSize: isTitle ? 44 : 40, color: c.titleText, bold: true, align: isTitle ? "center" : "left", fontFace: "Arial" });
        if (sl.bullets?.[0]) s.addText(sl.bullets[0], { x: 0.8, y: 4.0, w: "85%", h: 0.8, fontSize: 22, color: c.bodyText, align: isTitle ? "center" : "left", fontFace: "Arial" });
      } else if (sl.layout === "quote") {
        s.background = { color: c.bg };
        s.addText(`"${sl.title}"`, { x: 1.5, y: 2.0, w: "75%", h: 2.5, fontSize: 32, color: c.bodyText, italic: true, align: "center", fontFace: "Georgia" });
        if (sl.bullets?.[0]) s.addText(`— ${sl.bullets[0]}`, { x: 1.5, y: 4.8, w: "75%", h: 0.6, fontSize: 20, color: c.accent, bold: true, align: "center", fontFace: "Arial" });
      } else if (sl.layout === "big-number") {
        s.background = { color: c.titleBg };
        s.addText(sl.title, { x: 0.8, y: 1.5, w: "40%", h: 3.0, fontSize: 96, color: c.accent, bold: true, fontFace: "Arial" });
        const bulletText = sl.bullets.map((b, i) => ({ text: b, options: { fontSize: i === 0 ? 28 : 18, color: i === 0 ? c.titleText : c.bodyText, bold: i === 0, breakLine: true, paraSpaceAfter: 8 } }));
        s.addText(bulletText as any, { x: 6.5, y: 2.0, w: "45%", h: 3.0, fontFace: "Arial", valign: "middle" });
      } else {
        s.background = { color: c.bg };
        if (sl.imageUrl && sl.imagePosition !== "background") {
          try {
            const imgOpts: any = { data: sl.imageUrl, sizing: { type: "cover" as const } };
            if (sl.imagePosition === "right" || !sl.imagePosition) Object.assign(imgOpts, { x: 7.5, y: 1.3, w: 5.0, h: 4.0 });
            else if (sl.imagePosition === "left") Object.assign(imgOpts, { x: 0.5, y: 1.3, w: 5.0, h: 4.0 });
            else Object.assign(imgOpts, { x: 0.5, y: 1.3, w: "95%", h: 2.5 });
            s.addImage(imgOpts);
          } catch {}
        }
        if (sl.imageUrl && sl.imagePosition === "background") {
          try { s.background = { data: sl.imageUrl } as any; } catch { s.background = { color: c.bg }; }
          s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: "000000", transparency: 50 } });
        }
        s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.0, fill: { color: c.titleBg } });
        s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.25, w: 0.08, h: 0.5, fill: { color: c.accent } });
        s.addText(sl.title, { x: 0.8, y: 0.18, w: "85%", h: 0.65, fontSize: 28, color: c.titleText, bold: true, fontFace: "Arial" });
        const hasVisual = sl.imageUrl && (sl.imagePosition === "right" || !sl.imagePosition);
        const bulletText = sl.bullets.map((b) => ({ text: b, options: { fontSize: 18, color: c.bodyText, bullet: { code: "2022", color: c.accent }, breakLine: true, paraSpaceAfter: 10 } }));
        s.addText(bulletText as any, { x: 0.8, y: 1.3, w: hasVisual ? "50%" : "90%", h: 4.5, fontFace: "Arial", valign: "top" });
        s.addText(`${sl.slideNumber}`, { x: 12.2, y: 6.8, w: 0.8, h: 0.4, fontSize: 10, color: c.bodyText, align: "right" });
      }
      if (sl.speakerNotes) s.addNotes(sl.speakerNotes);
    }
    await pptx.writeFile({ fileName: `${presentation.title.replace(/[^a-zA-Z0-9\u0980-\u09FF ]/g, "")}.pptx` });
    toast.success(t("Downloaded PPTX!", "PPTX ডাউনলোড হয়েছে!"));
  };

  // ===== PDF EXPORT =====
  const downloadPdf = useCallback(() => {
    const printWin = window.open("", "_blank");
    if (!printWin) { toast.error("Popup blocked"); return; }
    const slidesHtml = presentation.slides.map((sl) => `
      <div style="width:1920px;height:1080px;transform:scale(0.52);transform-origin:top left;page-break-after:always;margin-bottom:-520px;">
        <div style="width:1920px;height:1080px;background:${theme.slide.bg};font-family:${theme.slide.fontBody};overflow:hidden;position:relative;">
          <div style="background:${theme.slide.titleBg};padding:30px 60px;min-height:130px;display:flex;align-items:center;">
            <div style="width:6px;height:56px;border-radius:9999px;background:${theme.slide.accent};margin-right:28px;flex-shrink:0;"></div>
            <div style="color:${theme.slide.titleText};font-size:${sl.titleSize || 44}px;font-weight:700;font-family:${theme.slide.fontHeading};">${sl.title}</div>
          </div>
          <div style="padding:48px 64px;">
            ${sl.bullets.map(b => `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;">
              <div style="width:14px;height:14px;border-radius:50%;background:${theme.slide.bulletColor};margin-top:8px;flex-shrink:0;"></div>
              <div style="color:${theme.slide.bodyText};font-size:${sl.bodySize || 26}px;line-height:1.6;">${b}</div>
            </div>`).join("")}
          </div>
          <div style="position:absolute;bottom:20px;right:48px;color:${theme.slide.subtitleText};font-size:14px;">${sl.slideNumber}</div>
        </div>
      </div>
    `).join("");
    printWin.document.write(`<!DOCTYPE html><html><head><title>${presentation.title}</title>
      <style>@media print{body{margin:0;}@page{size:landscape;margin:0;}}</style>
    </head><body style="margin:0;background:#fff;">${slidesHtml}</body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500);
    toast.success(t("PDF ready!", "PDF প্রস্তুত!"));
  }, [presentation, theme, t]);

  // Fullscreen
  const startPresentation = () => { setIsPresenting(true); setCurrentSlide(0); document.documentElement.requestFullscreen?.().catch(() => {}); };
  const exitPresentation = useCallback(() => { setIsPresenting(false); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isPresenting) {
        if (e.key === "Escape") exitPresentation();
        else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setCurrentSlide(c => Math.min(c + 1, presentation.slides.length - 1)); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSlide(c => Math.max(c - 1, 0)); }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      if (e.key === "Delete" && selectedElementId) { e.preventDefault(); deleteElement(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPresenting, exitPresentation, presentation.slides.length, undo, redo, selectedElementId, deleteElement]);

  // Hidden file inputs
  const HiddenInputs = () => (
    <>
      <input ref={deviceImageRef} type="file" accept="image/*" className="hidden" onChange={handleDeviceImageUpload} />
    </>
  );

  // ===== FULLSCREEN PRESENTING =====
  if (isPresenting) {
    const currentAnim = presentation.slides[currentSlide]?.animation;
    const variants = getTransitionVariants(currentAnim);

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: theme.slide.titleBg }}
        onClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          if (e.clientX > r.width * 0.3) setCurrentSlide(c => Math.min(c + 1, presentation.slides.length - 1));
          else setCurrentSlide(c => Math.max(c - 1, 0));
        }}>
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} className="w-full h-full"
            initial={variants.slide.initial}
            animate={variants.slide.animate}
            exit={{ opacity: 0 }}
            transition={variants.slide.transition}>
            <SlideCanvas slide={presentation.slides[currentSlide]} theme={theme} className="w-full h-full" />
          </motion.div>
        </AnimatePresence>
        <div className="fixed bottom-0 left-0 right-0 h-1 z-[10001]" style={{ background: `${theme.slide.accent}20` }}>
          <div className="h-full transition-all duration-300" style={{ background: theme.slide.accent, width: `${((currentSlide + 1) / presentation.slides.length) * 100}%` }} />
        </div>
        <div className="fixed bottom-4 right-4 z-[10001] px-3 py-1.5 rounded-lg text-xs font-mono" style={{ background: `${theme.slide.titleBg}cc`, color: theme.slide.subtitleText }}>
          {currentSlide + 1} / {presentation.slides.length}
        </div>
        <button onClick={(e) => { e.stopPropagation(); exitPresentation(); }} className="fixed top-4 right-4 z-[10001] px-3 py-1.5 rounded-lg text-sm" style={{ background: `${theme.slide.titleBg}cc`, color: theme.slide.subtitleText }}>ESC</button>
      </div>
    );
  }

  // ===== GRID VIEW =====
  if (gridView) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-background">
        <HiddenInputs />
        <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
          <button onClick={() => setGridView(false)} className="p-2 rounded-lg hover:bg-accent text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <h2 className="font-bold text-foreground">{t("All Slides", "সকল স্লাইড")} ({presentation.slides.length})</h2>
          <div className="flex-1" />
          <button onClick={addSlide} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {t("Add", "যোগ")}
          </button>
          <button onClick={() => setGridView(false)} className="p-2 rounded-lg hover:bg-accent text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {presentation.slides.map((sl, i) => (
              <motion.button key={i} layout onClick={() => { setCurrentSlide(i); setGridView(false); }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all hover:shadow-xl group ${i === currentSlide ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                <SlideCanvas slide={sl} theme={theme} scale={0.13} />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5" style={{ background: `linear-gradient(transparent, ${theme.slide.titleBg}dd)` }}>
                  <span className="text-white text-xs font-bold">{i + 1}</span>
                  <span className="text-white/70 text-[10px] truncate max-w-[80%]">{sl.title}</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); const slides = [...presentation.slides]; slides.splice(i + 1, 0, { ...sl }); slides.forEach((s, j) => s.slideNumber = j + 1); pushHistory({ ...presentation, slides }); }}
                    className="w-6 h-6 rounded bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80"><Copy className="w-3 h-3" /></button>
                  {presentation.slides.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); const slides = presentation.slides.filter((_, j) => j !== i); slides.forEach((s, j) => s.slideNumber = j + 1); pushHistory({ ...presentation, slides }); if (currentSlide >= slides.length) setCurrentSlide(slides.length - 1); }}
                      className="w-6 h-6 rounded bg-red-500/70 text-white flex items-center justify-center text-xs hover:bg-red-500/90"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN EDITOR (FULLSCREEN) =====
  return (
    <div ref={mainRef} className="fixed inset-0 z-[100] flex flex-col bg-background">
      <HiddenInputs />
      {/* ===== TOP TOOLBAR ===== */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card/95 backdrop-blur-sm flex-wrap flex-shrink-0">
        {/* Close button */}
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0 transition-colors" title="Close editor">
          <X className="w-5 h-5" />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {editingTitle ? (
          <input ref={titleRef} defaultValue={presentation.title} onBlur={handleTitleSave} onKeyDown={(e) => e.key === "Enter" && handleTitleSave()} autoFocus
            className="text-sm font-bold text-foreground bg-accent px-3 py-1.5 rounded-lg outline-none border border-primary/30 max-w-[200px]" />
        ) : (
          <button onClick={() => setEditingTitle(true)} className="text-sm font-bold text-foreground hover:bg-accent px-3 py-1.5 rounded-lg truncate max-w-[200px] transition-colors">{presentation.title}</button>
        )}

        <div className="h-5 w-px bg-border mx-0.5" />
        <button onClick={undo} disabled={historyIdx <= 0} className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground" title="Undo (Ctrl+Z)"><Undo2 className="w-4 h-4" /></button>
        <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground" title="Redo (Ctrl+Y)"><Redo2 className="w-4 h-4" /></button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* Add Elements */}
        <button onClick={() => addElement("text")} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-accent transition-all">
          <Type className="w-3.5 h-3.5" /> {t("Text", "টেক্সট")}
        </button>
        <button onClick={() => addElement("image")} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-accent transition-all">
          <Image className="w-3.5 h-3.5" /> {t("Image", "ছবি")}
        </button>
        <button onClick={() => deviceImageRef.current?.click()} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-accent transition-all">
          <Upload className="w-3.5 h-3.5" /> {t("Upload", "আপলোড")}
        </button>
        <button onClick={() => { updateSlide(currentSlide, { ...slide, chartData: slide.chartData || { type: "bar", data: [{ label: "A", value: 40 }, { label: "B", value: 30 }, { label: "C", value: 20 }] }, layout: "chart" }); setPropertiesTab("charts"); }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-accent transition-all">
          <BarChart3 className="w-3.5 h-3.5" /> {t("Chart", "চার্ট")}
        </button>

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* AI Buttons */}
        <button onClick={generateImage} disabled={generatingImageIdx !== null}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-pink-500/20 disabled:opacity-50 transition-all">
          {generatingImageIdx !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          {t("AI Image", "AI ছবি")}
        </button>

        {/* AI Text Menu */}
        <div className="relative">
          <button onClick={() => setShowAiTextMenu(!showAiTextMenu)} disabled={transformingText !== null}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 disabled:opacity-50 transition-all">
            {transformingText ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {t("AI Text", "AI টেক্সট")} <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showAiTextMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAiTextMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl p-1.5 w-52">
                  {AI_TEXT_ACTIONS.map((action) => (
                    <button key={action.id} onClick={() => transformText(action.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                      <action.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <span className="font-medium">{lang === "bn" ? action.labelBn : action.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{action.desc}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        {/* Autosave indicator */}
        {lastSaved && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Save className="w-3 h-3" /> {t("Saved", "সংরক্ষিত")}
          </span>
        )}

        {/* Freeform toggle */}
        <button onClick={toggleFreeformMode}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            slide.freeformMode ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-muted-foreground hover:bg-accent"
          }`}>
          <Move className="w-3.5 h-3.5" /> {t("Free Edit", "ফ্রি এডিট")}
        </button>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg px-1 py-0.5">
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 rounded hover:bg-accent text-muted-foreground"><ZoomOut className="w-3.5 h-3.5" /></button>
          <span className="text-xs font-mono text-muted-foreground w-8 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1 rounded hover:bg-accent text-muted-foreground"><ZoomIn className="w-3.5 h-3.5" /></button>
        </div>

        <div className="h-5 w-px bg-border mx-0.5" />
        <button onClick={() => setGridView(true)} className="p-1.5 rounded-lg hover:bg-accent text-foreground"><Grid3X3 className="w-4 h-4" /></button>
        <button onClick={() => setShowNotes(!showNotes)} className={`p-1.5 rounded-lg hover:bg-accent ${showNotes ? "text-primary bg-primary/10" : "text-foreground"}`}><MessageSquare className="w-4 h-4" /></button>
        <button onClick={() => setShowProperties(!showProperties)} className={`p-1.5 rounded-lg hover:bg-accent ${showProperties ? "text-primary bg-primary/10" : "text-foreground"}`}><Layout className="w-4 h-4" /></button>

        <div className="h-5 w-px bg-border mx-0.5" />
        <button onClick={startPresentation} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90">
          <Play className="w-3.5 h-3.5" /> {t("Present", "প্রেজেন্ট")}
        </button>

        {/* Export dropdown */}
        <div className="relative">
          <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-bold hover:opacity-90">
            <Download className="w-3.5 h-3.5" /> <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-1.5 w-40">
                  <button onClick={() => { downloadPptx(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent">
                    <FileDown className="w-4 h-4 text-blue-500" /> PPTX
                  </button>
                  <button onClick={() => { downloadPdf(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent">
                    <FileDown className="w-4 h-4 text-red-500" /> PDF
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <div className="w-40 lg:w-48 border-r border-border bg-muted/20 overflow-y-auto flex-shrink-0 py-2 px-1.5 space-y-1.5">
          {presentation.slides.map((sl, i) => (
            <div key={i} className="relative group">
              <button onClick={() => { setCurrentSlide(i); setSelectedElementId(null); }}
                className={`relative w-full rounded-lg overflow-hidden border-2 transition-all ${i === currentSlide ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-transparent hover:border-border"}`}>
                <SlideCanvas slide={sl} theme={theme} scale={0.085} />
                <div className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${i === currentSlide ? "bg-primary text-primary-foreground" : "bg-black/50 text-white"}`}>{i + 1}</div>
              </button>
              <div className="absolute -right-1 top-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {i > 0 && <button onClick={() => { setCurrentSlide(i); moveSlide(-1); }} className="w-5 h-5 rounded bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowUp className="w-3 h-3" /></button>}
                {i < presentation.slides.length - 1 && <button onClick={() => { setCurrentSlide(i); moveSlide(1); }} className="w-5 h-5 rounded bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground"><ArrowDown className="w-3 h-3" /></button>}
              </div>
            </div>
          ))}
          <button onClick={addSlide} className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-1 text-xs font-medium">
            <Plus className="w-3 h-3" /> {t("Add", "যোগ")}
          </button>
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto" style={{ background: "var(--muted)" }}>
            <div style={{ width: `${zoom}%`, maxWidth: "1200px", minWidth: "400px" }}>
              <SlideCanvas slide={slide} theme={theme} editable onUpdate={(updated) => updateSlide(currentSlide, updated)}
                isGeneratingImage={generatingImageIdx === currentSlide}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                className="rounded-xl shadow-2xl ring-1 ring-black/10" />
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-card text-xs flex-shrink-0">
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="p-1 rounded hover:bg-accent disabled:opacity-30 text-foreground"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-muted-foreground font-medium px-2">{currentSlide + 1} / {presentation.slides.length}</span>
              <button onClick={() => setCurrentSlide(Math.min(presentation.slides.length - 1, currentSlide + 1))} disabled={currentSlide === presentation.slides.length - 1} className="p-1 rounded hover:bg-accent disabled:opacity-30 text-foreground"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-2">{t("Layout", "লেআউট")}: {slide.layout}</span>
              <button onClick={duplicateSlide} className="p-1 rounded hover:bg-accent text-muted-foreground" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={deleteSlide} disabled={presentation.slides.length <= 1} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Speaker Notes */}
          <AnimatePresence>
            {showNotes && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border bg-card overflow-hidden flex-shrink-0">
                <div className="p-2">
                  <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase tracking-wider">{t("Speaker Notes", "স্পিকার নোটস")}</label>
                  <textarea value={slide.speakerNotes} onChange={handleNotesChange} placeholder={t("Add speaker notes...", "স্পিকার নোটস যোগ করুন...")} rows={2}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ===== RIGHT SIDEBAR: Properties ===== */}
        <AnimatePresence>
          {showProperties && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              className="border-l border-border bg-card overflow-y-auto overflow-x-hidden flex-shrink-0">
              <div className="p-3 w-[300px] space-y-3">
                {/* Tabs */}
                <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 flex-wrap">
                  {([["layout", "Layout", "লেআউট"], ["style", "Style", "স্টাইল"], ["elements", "Elements", "এলিমেন্ট"], ["charts", "Charts", "চার্ট"], ["animation", "Anim", "অ্যানিম"], ["theme", "Theme", "থিম"]] as const).map(([id, en, bn]) => (
                    <button key={id} onClick={() => setPropertiesTab(id)}
                      className={`flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all ${propertiesTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {t(en, bn)}
                    </button>
                  ))}
                </div>

                {/* ===== LAYOUT TAB ===== */}
                {propertiesTab === "layout" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Slide Layout", "স্লাইড লেআউট")}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {LAYOUTS.map((l) => (
                          <button key={l.id} onClick={() => changeLayout(l.id)}
                            className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-[9px] font-medium transition-all ${(slide.layout || "content") === l.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                            <l.icon className="w-3.5 h-3.5" />{l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Image Position", "ছবির পজিশন")}</p>
                      <div className="grid grid-cols-5 gap-1">
                        {IMAGE_POSITIONS.map((p) => (
                          <button key={p.id} onClick={() => updateSlide(currentSlide, { ...slide, imagePosition: p.id as any })}
                            className={`px-1.5 py-1.5 rounded-lg text-[9px] font-medium border transition-all ${(slide.imagePosition || "right") === p.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload image from device for slide */}
                    <button onClick={() => deviceImageRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-accent border border-border">
                      <Upload className="w-3.5 h-3.5 text-primary" /> {t("Upload Image from Device", "ডিভাইস থেকে ছবি আপলোড")}
                    </button>

                    {slide.imageUrl && (
                      <button onClick={() => updateSlide(currentSlide, { ...slide, imageUrl: undefined })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-destructive/20">
                        <Trash2 className="w-3.5 h-3.5" /> {t("Remove Image", "ছবি মুছুন")}
                      </button>
                    )}

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Insert Slide", "স্লাইড যোগ")}</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {LAYOUTS.map((l) => (
                          <button key={l.id} onClick={() => addSlideWithLayout(l.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-accent">
                            <l.icon className="w-3 h-3 text-muted-foreground" />{l.label}<Plus className="w-3 h-3 ml-auto text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Actions", "অ্যাকশন")}</p>
                      <div className="space-y-1">
                        <button onClick={duplicateSlide} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-accent"><Copy className="w-3.5 h-3.5 text-muted-foreground" /> {t("Duplicate", "ডুপ্লিকেট")}</button>
                        <button onClick={() => moveSlide(-1)} disabled={currentSlide === 0} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-accent disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5 text-muted-foreground" /> {t("Move Up", "উপরে")}</button>
                        <button onClick={() => moveSlide(1)} disabled={currentSlide === presentation.slides.length - 1} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-foreground hover:bg-accent disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5 text-muted-foreground" /> {t("Move Down", "নিচে")}</button>
                        <button onClick={deleteSlide} disabled={presentation.slides.length <= 1} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /> {t("Delete", "মুছুন")}</button>
                      </div>
                    </div>
                  </>
                )}

                {/* ===== STYLE TAB ===== */}
                {propertiesTab === "style" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Title Alignment", "শিরোনাম অ্যালাইনমেন্ট")}</p>
                      <div className="flex gap-1">
                        {[{ id: "left", icon: AlignLeft }, { id: "center", icon: AlignCenter }, { id: "right", icon: AlignRight }].map((a) => (
                          <button key={a.id} onClick={() => updateSlide(currentSlide, { ...slide, titleAlign: a.id as any })}
                            className={`flex-1 p-2 rounded-lg border transition-all ${(slide.titleAlign || "left") === a.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                            <a.icon className="w-4 h-4 mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Content Alignment", "কন্টেন্ট অ্যালাইনমেন্ট")}</p>
                      <div className="flex gap-1">
                        {[{ id: "left", icon: AlignLeft }, { id: "center", icon: AlignCenter }, { id: "right", icon: AlignRight }].map((a) => (
                          <button key={a.id} onClick={() => updateSlide(currentSlide, { ...slide, contentAlign: a.id as any })}
                            className={`flex-1 p-2 rounded-lg border transition-all ${(slide.contentAlign || "left") === a.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
                            <a.icon className="w-4 h-4 mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Title Size", "শিরোনাম সাইজ")}: {slide.titleSize || 44}px</p>
                      <input type="range" min={24} max={96} value={slide.titleSize || 44}
                        onChange={(e) => updateSlide(currentSlide, { ...slide, titleSize: Number(e.target.value) })} className="w-full accent-primary" />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Body Size", "বডি সাইজ")}: {slide.bodySize || 26}px</p>
                      <input type="range" min={14} max={48} value={slide.bodySize || 26}
                        onChange={(e) => updateSlide(currentSlide, { ...slide, bodySize: Number(e.target.value) })} className="w-full accent-primary" />
                    </div>
                  </>
                )}

                {/* ===== ELEMENTS TAB ===== */}
                {propertiesTab === "elements" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Add Element", "এলিমেন্ট যোগ")}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => addElement("text")} className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border hover:bg-accent transition-all">
                          <Type className="w-4 h-4 text-primary" /><span className="text-[9px] font-medium text-foreground">{t("Text", "টেক্সট")}</span>
                        </button>
                        <button onClick={() => addElement("image")} className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border hover:bg-accent transition-all">
                          <Image className="w-4 h-4 text-primary" /><span className="text-[9px] font-medium text-foreground">{t("Image", "ছবি")}</span>
                        </button>
                        <button onClick={() => deviceImageRef.current?.click()} className="flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border hover:bg-accent transition-all">
                          <Upload className="w-4 h-4 text-primary" /><span className="text-[9px] font-medium text-foreground">{t("Upload", "আপলোড")}</span>
                        </button>
                      </div>
                    </div>

                    {/* Elements list */}
                    {slide.elements && slide.elements.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t("Elements", "এলিমেন্ট")} ({slide.elements.length})</p>
                        <div className="space-y-0.5 max-h-28 overflow-y-auto">
                          {slide.elements.map((el) => (
                            <button key={el.id} onClick={() => setSelectedElementId(el.id)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${selectedElementId === el.id ? "bg-primary/10 border border-primary text-primary" : "border border-border text-foreground hover:bg-accent"}`}>
                              {el.type === "text" ? <Type className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                              <span className="truncate flex-1 text-left">{el.type === "text" ? (el.content || "Text").slice(0, 20) : "Image"}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected element properties */}
                    {selectedElement && (
                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {selectedElement.type === "text" ? t("Text Properties", "টেক্সট প্রপার্টি") : t("Image Properties", "ছবি প্রপার্টি")}
                        </p>

                        {selectedElement.type === "text" && (
                          <>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Font", "ফন্ট")}</p>
                              <select value={selectedElement.fontFamily || theme.slide.fontBody}
                                onChange={(e) => updateElement({ fontFamily: e.target.value })}
                                className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground">
                                {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Size", "সাইজ")}: {selectedElement.fontSize || 24}px</p>
                              <input type="range" min={12} max={120} value={selectedElement.fontSize || 24}
                                onChange={(e) => updateElement({ fontSize: Number(e.target.value) })} className="w-full accent-primary" />
                            </div>
                            <div className="flex gap-0.5 flex-wrap">
                              <button onClick={() => updateElement({ fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })}
                                className={`p-1.5 rounded-lg border transition-all ${selectedElement.fontWeight === "bold" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                                <Bold className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateElement({ fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })}
                                className={`p-1.5 rounded-lg border transition-all ${selectedElement.fontStyle === "italic" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                                <Italic className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateElement({ textDecoration: selectedElement.textDecoration === "underline" ? "none" : "underline" })}
                                className={`p-1.5 rounded-lg border transition-all ${selectedElement.textDecoration === "underline" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                                <Underline className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => updateElement({ textDecoration: selectedElement.textDecoration === "line-through" ? "none" : "line-through" })}
                                className={`p-1.5 rounded-lg border transition-all ${selectedElement.textDecoration === "line-through" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                                <Strikethrough className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-px bg-border mx-0.5" />
                              {[{ id: "left", icon: AlignLeft }, { id: "center", icon: AlignCenter }, { id: "right", icon: AlignRight }].map((a) => (
                                <button key={a.id} onClick={() => updateElement({ align: a.id as any })}
                                  className={`p-1.5 rounded-lg border transition-all ${(selectedElement.align || "left") === a.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}>
                                  <a.icon className="w-3.5 h-3.5" />
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="color" value={selectedElement.color || theme.slide.bodyText}
                                onChange={(e) => updateElement({ color: e.target.value })}
                                className="w-7 h-7 rounded-lg border border-border cursor-pointer" />
                              <span className="text-[10px] text-foreground">{t("Text Color", "টেক্সট রং")}</span>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{t("Word Art", "ওয়ার্ড আর্ট")}</p>
                              <div className="grid grid-cols-4 gap-1">
                                {WORD_ART_PRESETS.map((w) => (
                                  <button key={w.id} onClick={() => updateElement({ wordArt: w.id as any })}
                                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[8px] font-medium transition-all ${
                                      (selectedElement.wordArt || "none") === w.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
                                    }`}>
                                    <span className="text-sm">{w.emoji}</span>{w.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {selectedElement.type === "image" && (
                          <>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Image URL", "ছবির URL")}</p>
                              <input type="text" value={selectedElement.imageUrl || ""} placeholder="https://..."
                                onChange={(e) => updateElement({ imageUrl: e.target.value })}
                                className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground" />
                            </div>
                            <button onClick={() => deviceImageRef.current?.click()}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-accent border border-border">
                              <Upload className="w-3.5 h-3.5 text-primary" /> {t("Upload from Device", "ডিভাইস থেকে আপলোড")}
                            </button>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Shape", "শেইপ")}</p>
                              <div className="flex gap-1">
                                {IMAGE_SHAPES.map((sh) => (
                                  <button key={sh.id} onClick={() => updateElement({ imageShape: sh.id as any })}
                                    className={`flex-1 flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[9px] transition-all ${
                                      (selectedElement.imageShape || "rectangle") === sh.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"
                                    }`}>
                                    <sh.icon className="w-3.5 h-3.5" />{sh.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Frame", "ফ্রেম")}</p>
                              <div className="grid grid-cols-3 gap-1">
                                {IMAGE_FRAMES.map((f) => (
                                  <button key={f.id} onClick={() => updateElement({ imageFrame: f.id as any })}
                                    className={`px-1.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                                      (selectedElement.imageFrame || "none") === f.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
                                    }`}>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Crop / Fit", "ক্রপ / ফিট")}</p>
                              <div className="flex gap-1">
                                {IMAGE_FITS.map((f) => (
                                  <button key={f.id} onClick={() => updateElement({ imageFit: f.id as any })}
                                    className={`flex-1 px-1.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                                      (selectedElement.imageFit || "cover") === f.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
                                    }`}>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Corner Radius", "কর্নার রেডিয়াস")}: {selectedElement.borderRadius ?? 12}px</p>
                              <input type="range" min={0} max={100} value={selectedElement.borderRadius ?? 12}
                                onChange={(e) => updateElement({ borderRadius: Number(e.target.value) })} className="w-full accent-primary" />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">{t("Shadow", "শ্যাডো")}: {selectedElement.shadowIntensity ?? 0}%</p>
                              <input type="range" min={0} max={100} value={selectedElement.shadowIntensity ?? 0}
                                onChange={(e) => updateElement({ shadowIntensity: Number(e.target.value) })} className="w-full accent-primary" />
                            </div>
                            <button onClick={generateImage} disabled={generatingImageIdx !== null}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-pink-500/20 disabled:opacity-50">
                              {generatingImageIdx !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                              {t("Generate AI Image", "AI ছবি তৈরি")}
                            </button>
                          </>
                        )}

                        {/* Opacity */}
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">{t("Opacity", "স্বচ্ছতা")}: {Math.round((selectedElement.opacity ?? 1) * 100)}%</p>
                          <input type="range" min={10} max={100} value={Math.round((selectedElement.opacity ?? 1) * 100)}
                            onChange={(e) => updateElement({ opacity: Number(e.target.value) / 100 })} className="w-full accent-primary" />
                        </div>

                        {/* Position */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">X: {Math.round(selectedElement.x)}%</p>
                            <input type="range" min={0} max={90} value={selectedElement.x}
                              onChange={(e) => updateElement({ x: Number(e.target.value) })} className="w-full accent-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Y: {Math.round(selectedElement.y)}%</p>
                            <input type="range" min={0} max={90} value={selectedElement.y}
                              onChange={(e) => updateElement({ y: Number(e.target.value) })} className="w-full accent-primary" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">W: {Math.round(selectedElement.width)}%</p>
                            <input type="range" min={5} max={100} value={selectedElement.width}
                              onChange={(e) => updateElement({ width: Number(e.target.value) })} className="w-full accent-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">H: {Math.round(selectedElement.height)}%</p>
                            <input type="range" min={5} max={100} value={selectedElement.height}
                              onChange={(e) => updateElement({ height: Number(e.target.value) })} className="w-full accent-primary" />
                          </div>
                        </div>

                        {/* Delete element */}
                        <button onClick={deleteElement}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-destructive/20">
                          <Trash2 className="w-3.5 h-3.5" /> {t("Delete Element", "এলিমেন্ট মুছুন")}
                        </button>
                      </div>
                    )}

                    {!selectedElement && slide.elements && slide.elements.length > 0 && (
                      <p className="text-[10px] text-muted-foreground text-center py-2">
                        {t("Click an element to edit its properties", "প্রপার্টি এডিট করতে এলিমেন্ট ক্লিক করুন")}
                      </p>
                    )}
                  </>
                )}

                {/* ===== CHARTS TAB ===== */}
                {propertiesTab === "charts" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        {t("Chart Editor", "চার্ট এডিটর")}
                      </p>
                      <p className="text-[9px] text-muted-foreground mb-2">
                        {t("Add a chart to this slide. Set layout to 'Chart' for best results.", "এই স্লাইডে চার্ট যোগ করুন। সেরা ফলাফলের জন্য লেআউট 'Chart' সেট করুন।")}
                      </p>
                      {!slide.chartData && (
                        <button onClick={() => updateSlide(currentSlide, { ...slide, chartData: { type: "bar", data: [{ label: "A", value: 40 }, { label: "B", value: 30 }, { label: "C", value: 20 }, { label: "D", value: 10 }] }, layout: "chart" })}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 border border-primary/30">
                          <BarChart3 className="w-4 h-4" /> {t("Add Chart", "চার্ট যোগ করুন")}
                        </button>
                      )}
                    </div>
                    {slide.chartData && (
                      <>
                        <ChartEditor
                          chart={slide.chartData}
                          onChange={(chartData) => updateSlide(currentSlide, { ...slide, chartData })}
                          accentColor={theme.slide.accent}
                        />
                        <button onClick={() => updateSlide(currentSlide, { ...slide, chartData: undefined })}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-destructive hover:bg-destructive/10 border border-destructive/20">
                          <Trash2 className="w-3.5 h-3.5" /> {t("Remove Chart", "চার্ট মুছুন")}
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* ===== ANIMATION TAB ===== */}
                {propertiesTab === "animation" && (
                  <>
                    <AnimationEditor
                      animation={slide.animation}
                      onChange={(animation) => updateSlide(currentSlide, { ...slide, animation })}
                    />
                    {slide.animation && slide.animation.transition !== "none" && (
                      <p className="text-[9px] text-muted-foreground italic">
                        {t("Animations play during presentation mode", "অ্যানিমেশন প্রেজেন্টেশন মোডে চলবে")}
                      </p>
                    )}
                  </>
                )}

                {/* ===== THEME TAB ===== */}
                {propertiesTab === "theme" && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Choose Theme", "থিম বেছে নিন")}</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {slideThemes.map((th) => (
                          <button key={th.id} onClick={() => { setThemeId(th.id); setThemeOverrides({}); }}
                            className={`rounded-xl overflow-hidden border-2 transition-all ${themeId === th.id ? "border-primary ring-2 ring-primary/30 scale-105" : "border-border hover:border-primary/50 hover:scale-105"}`}
                            title={th.name}>
                            <div className="w-full aspect-[16/10] rounded-t-lg" style={{ background: th.preview }} />
                            <p className="text-[8px] font-medium text-foreground truncate px-1 py-0.5 bg-muted/50">{th.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Custom Colors", "কাস্টম রং")}</p>
                      <div className="space-y-1.5">
                        {[
                          { key: "accent", label: t("Accent / Primary", "অ্যাকসেন্ট / প্রাইমারি"), value: themeOverrides.accent || theme.slide.accent },
                          { key: "bg", label: t("Background", "ব্যাকগ্রাউন্ড"), value: themeOverrides.bg || theme.slide.bg },
                          { key: "titleBg", label: t("Title Background", "শিরোনাম ব্যাকগ্রাউন্ড"), value: themeOverrides.titleBg || theme.slide.titleBg },
                          { key: "titleText", label: t("Title Text", "শিরোনাম টেক্সট"), value: themeOverrides.titleText || theme.slide.titleText },
                          { key: "bodyText", label: t("Body Text", "বডি টেক্সট"), value: themeOverrides.bodyText || theme.slide.bodyText },
                        ].map((c) => (
                          <div key={c.key} className="flex items-center gap-2">
                            <input type="color" value={c.value}
                              onChange={(e) => setThemeOverrides(prev => ({ ...prev, [c.key]: e.target.value }))}
                              className="w-7 h-7 rounded-lg border border-border cursor-pointer flex-shrink-0" />
                            <span className="text-[10px] text-foreground">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Heading Font", "হেডিং ফন্ট")}</p>
                      <select value={themeOverrides.fontHeading || theme.slide.fontHeading}
                        onChange={(e) => setThemeOverrides(prev => ({ ...prev, fontHeading: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground">
                        {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("Body Font", "বডি ফন্ট")}</p>
                      <select value={themeOverrides.fontBody || theme.slide.fontBody}
                        onChange={(e) => setThemeOverrides(prev => ({ ...prev, fontBody: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background p-1.5 text-xs text-foreground">
                        {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>

                    {Object.keys(themeOverrides).length > 0 && (
                      <button onClick={() => setThemeOverrides({})}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent border border-border">
                        <RotateCcw className="w-3.5 h-3.5" /> {t("Reset Customizations", "কাস্টমাইজেশন রিসেট")}
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SlideEditor;
