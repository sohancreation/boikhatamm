import { useRef, useEffect, useState, useCallback } from "react";
import { SlideTheme } from "./themes";
import { Image, BarChart3, Loader2, GripVertical, Type, Move } from "lucide-react";
import type { ChartData } from "./ChartEditor";
import { SlideChartRender } from "./ChartEditor";
import type { SlideAnimation } from "./AnimationEditor";

export interface SlideElement {
  id: string;
  type: "text" | "image" | "shape";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  imageUrl?: string;
  imageShape?: "rectangle" | "rounded" | "circle" | "blob";
  imageFrame?: "none" | "shadow" | "border" | "polaroid" | "double-border";
  imageFit?: "cover" | "contain" | "fill";
  opacity?: number;
  wordArt?: "none" | "shadow" | "outline" | "glow" | "gradient" | "retro" | "neon";
  textDecoration?: "none" | "underline" | "line-through";
  borderRadius?: number;
  shadowIntensity?: number;
}

export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  speakerNotes: string;
  visualSuggestion: string;
  layout: string;
  imageUrl?: string;
  imagePosition?: "right" | "left" | "background" | "top" | "bottom";
  titleAlign?: "left" | "center" | "right";
  contentAlign?: "left" | "center" | "right";
  titleSize?: number;
  bodySize?: number;
  elements?: SlideElement[];
  freeformMode?: boolean;
  chartData?: ChartData;
  animation?: SlideAnimation;
}

interface SlideCanvasProps {
  slide: Slide;
  theme: SlideTheme;
  editable?: boolean;
  onUpdate?: (slide: Slide) => void;
  scale?: number;
  className?: string;
  isGeneratingImage?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
}

const SLIDE_W = 1920;
const SLIDE_H = 1080;

const getWordArtStyle = (wordArt?: string, color?: string): React.CSSProperties => {
  const c = color || "#ffffff";
  switch (wordArt) {
    case "shadow": return { textShadow: `4px 4px 8px ${c}40, 2px 2px 4px rgba(0,0,0,0.5)` };
    case "outline": return { WebkitTextStroke: `2px ${c}`, color: "transparent" };
    case "glow": return { textShadow: `0 0 10px ${c}, 0 0 20px ${c}, 0 0 40px ${c}60` };
    case "gradient": return { background: `linear-gradient(135deg, ${c}, #ff6b6b, #ffd93d)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as any;
    case "retro": return { textShadow: `3px 3px 0px ${c}40, 6px 6px 0px ${c}20` };
    case "neon": return { textShadow: `0 0 7px ${c}, 0 0 10px ${c}, 0 0 21px ${c}, 0 0 42px #0fa, 0 0 82px #0fa` };
    default: return {};
  }
};

const getImageFrameStyle = (frame?: string, accent?: string): React.CSSProperties => {
  switch (frame) {
    case "shadow": return { boxShadow: "0 10px 40px rgba(0,0,0,0.4)" };
    case "border": return { border: `4px solid ${accent || "#fff"}`, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" };
    case "polaroid": return { padding: "8px 8px 32px 8px", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", borderRadius: "2px" };
    case "double-border": return { border: `3px solid ${accent || "#fff"}`, outline: `3px solid ${accent || "#fff"}40`, outlineOffset: "4px" };
    default: return {};
  }
};

const SlideCanvas = ({ slide, theme, editable = false, onUpdate, scale: forcedScale, className = "", isGeneratingImage = false, selectedElementId, onSelectElement }: SlideCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [computedScale, setComputedScale] = useState(0.5);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; elW: number; elH: number } | null>(null);
  const s = forcedScale ?? computedScale;

  useEffect(() => {
    if (forcedScale !== undefined) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setComputedScale(Math.min(width / SLIDE_W, height / SLIDE_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [forcedScale]);

  // ===== DRAG HANDLERS =====
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string, mode: "drag" | "resize") => {
    if (!editable || !slide.freeformMode) return;
    e.stopPropagation();
    e.preventDefault();
    const el = slide.elements?.find(el => el.id === elementId);
    if (!el) return;
    onSelectElement?.(elementId);

    if (mode === "drag") {
      setDragging({ id: elementId, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
    } else {
      setResizing({ id: elementId, startX: e.clientX, startY: e.clientY, elW: el.width, elH: el.height });
    }
  }, [editable, slide, onSelectElement]);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && onUpdate && slide.elements) {
        const dx = (e.clientX - dragging.startX) / (SLIDE_W * s) * 100;
        const dy = (e.clientY - dragging.startY) / (SLIDE_H * s) * 100;
        const elements = slide.elements.map(el =>
          el.id === dragging.id
            ? { ...el, x: Math.max(0, Math.min(100 - el.width, dragging.elX + dx)), y: Math.max(0, Math.min(100 - el.height, dragging.elY + dy)) }
            : el
        );
        onUpdate({ ...slide, elements });
      }
      if (resizing && onUpdate && slide.elements) {
        const dx = (e.clientX - resizing.startX) / (SLIDE_W * s) * 100;
        const dy = (e.clientY - resizing.startY) / (SLIDE_H * s) * 100;
        const elements = slide.elements.map(el =>
          el.id === resizing.id
            ? { ...el, width: Math.max(5, resizing.elW + dx), height: Math.max(5, resizing.elH + dy) }
            : el
        );
        onUpdate({ ...slide, elements });
      }
    };
    const handleMouseUp = () => { setDragging(null); setResizing(null); };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [dragging, resizing, s, slide, onUpdate]);

  const handleTitleChange = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (onUpdate) onUpdate({ ...slide, title: e.currentTarget.textContent || "" });
  }, [slide, onUpdate]);

  const handleBulletChange = useCallback((idx: number, text: string) => {
    if (!onUpdate) return;
    const bullets = [...slide.bullets]; bullets[idx] = text;
    onUpdate({ ...slide, bullets });
  }, [slide, onUpdate]);

  const addBullet = useCallback(() => {
    if (!onUpdate) return;
    onUpdate({ ...slide, bullets: [...slide.bullets, "New point"] });
  }, [slide, onUpdate]);

  const removeBullet = useCallback((idx: number) => {
    if (!onUpdate || slide.bullets.length <= 1) return;
    onUpdate({ ...slide, bullets: slide.bullets.filter((_, i) => i !== idx) });
  }, [slide, onUpdate]);

  const handleElementTextChange = useCallback((elementId: string, newContent: string) => {
    if (!onUpdate || !slide.elements) return;
    const elements = slide.elements.map(el => el.id === elementId ? { ...el, content: newContent } : el);
    onUpdate({ ...slide, elements });
  }, [slide, onUpdate]);

  const t = theme.slide;
  const editClass = (light = false) =>
    editable ? `cursor-text hover:ring-2 hover:ring-${light ? "white" : "black"}/15 rounded-lg px-3 py-1 transition-all outline-none` : "outline-none";

  const titleFontSize = slide.titleSize || 44;
  const bodyFontSize = slide.bodySize || 26;
  const titleAlign = slide.titleAlign || "left";
  const contentAlign = slide.contentAlign || "left";
  const imgPos = slide.imagePosition || "right";
  const hasImage = !!slide.imageUrl;

  const layoutType = slide.layout === "title" || slide.slideNumber === 1 ? "title" : slide.layout || "content";

  // ===== FREEFORM ELEMENTS OVERLAY =====
  const FreeformElements = () => {
    if (!slide.freeformMode || !slide.elements?.length) return null;
    return (
      <div className="absolute inset-0 z-20">
        {slide.elements.map((el) => {
          const isSelected = selectedElementId === el.id;
          const shapeClass = el.type === "image"
            ? el.imageShape === "circle" ? "rounded-full" : el.imageShape === "rounded" ? "rounded-2xl" : el.imageShape === "blob" ? "rounded-[30%_70%_70%_30%/30%_30%_70%_70%]" : "rounded-lg"
            : "";

          return (
            <div key={el.id} className={`absolute group ${editable ? "cursor-move" : ""}`}
              style={{
                left: `${el.x}%`, top: `${el.y}%`,
                width: `${el.width}%`, height: `${el.height}%`,
                opacity: el.opacity ?? 1,
                outline: isSelected && editable ? `3px solid ${t.accent}` : "none",
                outlineOffset: 2,
              }}
              onMouseDown={(e) => handleMouseDown(e, el.id, "drag")}
              onClick={(e) => { e.stopPropagation(); onSelectElement?.(el.id); }}
            >
              {el.type === "text" && (
                <div
                  contentEditable={editable} suppressContentEditableWarning
                  onBlur={(e) => handleElementTextChange(el.id, e.currentTarget.textContent || "")}
                  className="w-full h-full outline-none overflow-hidden"
                  style={{
                    fontSize: el.fontSize || 24,
                    fontWeight: el.fontWeight || "normal",
                    fontStyle: el.fontStyle || "normal",
                    fontFamily: el.fontFamily || t.fontBody,
                    color: el.color || t.bodyText,
                    textAlign: el.align || "left",
                    textDecoration: el.textDecoration || "none",
                    cursor: editable ? "text" : "default",
                    ...getWordArtStyle(el.wordArt, el.color || t.bodyText),
                  }}
                >
                  {el.content}
                </div>
              )}
              {el.type === "image" && el.imageUrl && (
                <div className={`w-full h-full`} style={{
                  overflow: "hidden",
                  borderRadius: el.borderRadius !== undefined ? `${el.borderRadius}px` : undefined,
                  boxShadow: el.shadowIntensity ? `0 ${el.shadowIntensity / 5}px ${el.shadowIntensity / 2}px rgba(0,0,0,${el.shadowIntensity / 100})` : undefined,
                  ...getImageFrameStyle(el.imageFrame, t.accent),
                }}>
                  <img src={el.imageUrl} alt="" className={`w-full h-full ${shapeClass}`} style={{ objectFit: el.imageFit || "cover" }} />
                </div>
              )}
              {el.type === "image" && !el.imageUrl && (
                <div className={`w-full h-full flex items-center justify-center ${shapeClass}`} style={{ border: `2px dashed ${t.accent}30`, background: `${t.accent}05` }}>
                  <Image size={32} style={{ color: t.accent }} />
                </div>
              )}
              {editable && isSelected && (
                <>
                  <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-primary border-2 border-white shadow-md cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, el.id, "resize")} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold flex items-center gap-1 shadow-lg">
                    <Move size={10} /> Move
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ===== IMAGE ELEMENT =====
  const ImageBlock = ({ size = "normal" }: { size?: "normal" | "large" }) => {
    if (isGeneratingImage) {
      return (
        <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-5" style={{ background: `${t.accent}08`, border: `2px dashed ${t.accent}25` }}>
          <Loader2 size={48} className="animate-spin" style={{ color: t.accent }} />
          <p style={{ color: t.subtitleText, fontSize: 18 }}>Generating image...</p>
        </div>
      );
    }
    if (hasImage) {
      return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative group">
          <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
          {editable && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white text-lg font-bold bg-black/50 px-4 py-2 rounded-xl">Click AI Image to replace</span>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-5" style={{ border: `2px dashed ${t.accent}30`, background: `${t.accent}05` }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `${t.accent}15` }}>
          <Image size={40} style={{ color: t.accent }} />
        </div>
        {slide.visualSuggestion && (
          <p className="text-center px-6 leading-relaxed" style={{ color: t.subtitleText, fontSize: 17 }}>{slide.visualSuggestion}</p>
        )}
      </div>
    );
  };

  // ===== BULLETS BLOCK =====
  const BulletsBlock = ({ light = false }: { light?: boolean }) => (
    <div className="flex flex-col gap-5">
      {slide.bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-5 group">
          <div className="flex-shrink-0 mt-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.bulletColor}18` }}>
              <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.bulletColor }} />
            </div>
          </div>
          <div contentEditable={editable} suppressContentEditableWarning
            onBlur={(e) => handleBulletChange(i, e.currentTarget.textContent || "")}
            className={`flex-1 ${editClass(light)}`}
            style={{ color: t.bodyText, fontSize: bodyFontSize, lineHeight: 1.7, textAlign: contentAlign }}>
            {b}
          </div>
          {editable && slide.bullets.length > 1 && (
            <button onClick={() => removeBullet(i)} className="opacity-0 group-hover:opacity-100 mt-2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity" style={{ background: "#ef444420", color: "#ef4444" }}>×</button>
          )}
        </div>
      ))}
      {editable && (
        <button onClick={addBullet} className="self-start px-5 py-2 text-lg rounded-xl transition-all mt-2" style={{ color: t.accent, background: `${t.accent}10` }}>+ Add point</button>
      )}
    </div>
  );

  // ============ TITLE SLIDE ============
  const TitleLayout = () => (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: hasImage && imgPos === "background" ? "transparent" : t.titleBg }}>
      {hasImage && imgPos === "background" && (<><img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.55)" }} /></>)}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 50%, ${t.accent}18 0%, transparent 70%)` }} />
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accent}60, transparent)` }} />
      <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
        className={`text-center max-w-[75%] relative z-10 ${editClass(true)}`}
        style={{ color: t.titleText, fontSize: slide.titleSize || 76, fontWeight: 800, lineHeight: 1.15, fontFamily: t.fontHeading, letterSpacing: "-0.02em" }}>
        {slide.title}
      </div>
      <div className="w-24 h-1.5 rounded-full mt-8 relative z-10" style={{ background: t.accent }} />
      {slide.bullets?.[0] && (
        <div contentEditable={editable} suppressContentEditableWarning
          onBlur={(e) => handleBulletChange(0, e.currentTarget.textContent || "")}
          className={`mt-8 text-center max-w-[60%] relative z-10 ${editClass(true)}`}
          style={{ color: t.subtitleText, fontSize: 30, fontWeight: 400, lineHeight: 1.5 }}>
          {slide.bullets[0]}
        </div>
      )}
      <div className="absolute bottom-8 right-12 z-10" style={{ color: `${t.subtitleText}80`, fontSize: 16 }}>{slide.slideNumber}</div>
    </div>
  );

  // ============ SECTION BREAK ============
  const SectionLayout = () => (
    <div className="w-full h-full flex items-center relative overflow-hidden" style={{ background: t.titleBg }}>
      {hasImage && imgPos === "background" && (<><img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} /></>)}
      <div className="absolute -right-10 -bottom-20 select-none" style={{ color: `${t.accent}12`, fontSize: 500, fontWeight: 900, lineHeight: 1 }}>{slide.slideNumber}</div>
      <div className="relative z-10 px-24 max-w-[70%]">
        <div className="w-16 h-1.5 rounded-full mb-10" style={{ background: t.accent }} />
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`${editClass(true)}`}
          style={{ color: t.titleText, fontSize: slide.titleSize || 64, fontWeight: 800, lineHeight: 1.15, fontFamily: t.fontHeading, textAlign: titleAlign }}>
          {slide.title}
        </div>
        {slide.bullets?.[0] && (
          <div contentEditable={editable} suppressContentEditableWarning
            onBlur={(e) => handleBulletChange(0, e.currentTarget.textContent || "")}
            className={`mt-6 ${editClass(true)}`}
            style={{ color: t.subtitleText, fontSize: 26, lineHeight: 1.6 }}>
            {slide.bullets[0]}
          </div>
        )}
      </div>
    </div>
  );

  // ============ CONTENT SLIDE ============
  const ContentLayout = () => {
    const showImgRight = (hasImage || slide.visualSuggestion) && (imgPos === "right" || imgPos === "left");
    const imgOnLeft = imgPos === "left";
    const isBgImage = hasImage && imgPos === "background";
    return (
      <div className="w-full h-full flex flex-col relative" style={{ background: isBgImage ? "transparent" : t.bg }}>
        {isBgImage && (<><img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} /></>)}
        <div className="flex items-center px-16 relative z-10" style={{ background: isBgImage ? "transparent" : `linear-gradient(135deg, ${t.titleBg}, ${t.titleBg}ee)`, minHeight: 130, overflow: "hidden" }}>
          <div className="w-1.5 h-14 rounded-full mr-7 flex-shrink-0" style={{ background: t.accent }} />
          <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
            className={`flex-1 ${editClass(true)}`}
            style={{ color: isBgImage ? "#fff" : t.titleText, fontSize: titleFontSize, fontWeight: 700, fontFamily: t.fontHeading, textAlign: titleAlign }}>
            {slide.title}
          </div>
        </div>
        <div className={`flex-1 flex px-16 py-12 gap-14 relative z-10 ${imgOnLeft ? "flex-row-reverse" : ""}`}>
          <div className={`${showImgRight ? "flex-1" : "w-full"} flex flex-col gap-5`}><BulletsBlock light={isBgImage} /></div>
          {showImgRight && (<div className="w-[480px] flex-shrink-0"><ImageBlock /></div>)}
        </div>
        {hasImage && imgPos === "top" && (
          <div className="absolute top-[130px] left-16 right-16 h-[300px] z-10 rounded-2xl overflow-hidden"><img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /></div>
        )}
        {hasImage && imgPos === "bottom" && (
          <div className="absolute bottom-12 left-16 right-16 h-[300px] z-10 rounded-2xl overflow-hidden"><img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /></div>
        )}
        <div className="flex items-center justify-between px-16 py-5 relative z-10">
          <div style={{ color: isBgImage ? "#fff8" : `${t.subtitleText}80`, fontSize: 14, letterSpacing: "0.05em" }}>BoiKhata MM</div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: `${t.accent}15` }}>
              <div className="h-full rounded-full" style={{ background: t.accent, width: `${(slide.slideNumber / 10) * 100}%` }} />
            </div>
            <div style={{ color: isBgImage ? "#fff8" : `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
          </div>
        </div>
      </div>
    );
  };

  // ============ TWO-COLUMN ============
  const TwoColumnLayout = () => {
    const half = Math.ceil(slide.bullets.length / 2);
    const leftBullets = slide.bullets.slice(0, half);
    const rightBullets = slide.bullets.slice(half);
    return (
      <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
        <div className="flex items-center px-16 py-8" style={{ background: t.titleBg, minHeight: 120 }}>
          <div className="w-1.5 h-14 rounded-full mr-7" style={{ background: t.accent }} />
          <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange} className={`flex-1 ${editClass(true)}`}
            style={{ color: t.titleText, fontSize: titleFontSize, fontWeight: 700, fontFamily: t.fontHeading, textAlign: titleAlign }}>
            {slide.title}
          </div>
        </div>
        <div className="flex-1 flex gap-0">
          {[leftBullets, rightBullets].map((bullets, col) => (
            <div key={col} className="flex-1 px-14 py-10 flex flex-col gap-5" style={{ borderRight: col === 0 ? `1px solid ${t.accent}15` : "none" }}>
              {bullets.map((b, i) => {
                const realIdx = col === 0 ? i : half + i;
                return (
                  <div key={realIdx} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: `${t.bulletColor}18` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: t.bulletColor }} />
                    </div>
                    <div contentEditable={editable} suppressContentEditableWarning
                      onBlur={(e) => handleBulletChange(realIdx, e.currentTarget.textContent || "")}
                      className={`flex-1 ${editClass()}`}
                      style={{ color: t.bodyText, fontSize: bodyFontSize - 2, lineHeight: 1.6, textAlign: contentAlign }}>
                      {b}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-16 py-4">
          <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
          <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
        </div>
      </div>
    );
  };

  // ============ QUOTE ============
  const QuoteLayout = () => (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden" style={{ background: t.bg }}>
      {hasImage && imgPos === "background" && (<><img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} /></>)}
      <div className="absolute top-16 left-20 select-none" style={{ color: `${t.accent}20`, fontSize: 300, fontFamily: "Georgia, serif", lineHeight: 1 }}>"</div>
      <div className="relative z-10 max-w-[70%] text-center">
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange} className={`${editClass()}`}
          style={{ color: hasImage && imgPos === "background" ? "#fff" : t.bodyText, fontSize: titleFontSize - 4, fontWeight: 500, lineHeight: 1.6, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
          {slide.title}
        </div>
        {slide.bullets?.[0] && (
          <>
            <div className="w-16 h-1 rounded-full mx-auto mt-8 mb-6" style={{ background: t.accent }} />
            <div contentEditable={editable} suppressContentEditableWarning
              onBlur={(e) => handleBulletChange(0, e.currentTarget.textContent || "")} className={`${editClass()}`}
              style={{ color: t.accent, fontSize: 24, fontWeight: 600, letterSpacing: "0.05em" }}>— {slide.bullets[0]}</div>
          </>
        )}
      </div>
      <div className="absolute bottom-8 right-12 z-10" style={{ color: `${t.subtitleText}60`, fontSize: 14 }}>{slide.slideNumber}</div>
    </div>
  );

  // ============ BIG NUMBER ============
  const BigNumberLayout = () => (
    <div className="w-full h-full flex items-center relative overflow-hidden" style={{ background: t.titleBg }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${t.accent}10 0%, transparent 50%)` }} />
      <div className="flex items-center gap-20 px-24 relative z-10 w-full">
        <div className="flex-shrink-0">
          <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange} className={`${editClass(true)}`}
            style={{ color: t.accent, fontSize: slide.titleSize || 140, fontWeight: 900, lineHeight: 1, fontFamily: t.fontHeading }}>
            {slide.title}
          </div>
        </div>
        <div className="flex-1">
          {slide.bullets.map((b, i) => (
            <div key={i} className={i === 0 ? "mb-4" : ""}>
              <div contentEditable={editable} suppressContentEditableWarning
                onBlur={(e) => handleBulletChange(i, e.currentTarget.textContent || "")} className={`${editClass(true)}`}
                style={{ color: i === 0 ? t.titleText : t.subtitleText, fontSize: i === 0 ? 36 : 22, fontWeight: i === 0 ? 700 : 400, lineHeight: 1.5 }}>
                {b}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 right-12 z-10" style={{ color: `${t.subtitleText}60`, fontSize: 14 }}>{slide.slideNumber}</div>
    </div>
  );

  // ============ IMAGE FOCUS ============
  const ImageFocusLayout = () => (
    <div className="w-full h-full flex" style={{ background: t.bg }}>
      <div className={`w-[55%] flex flex-col justify-center px-16 py-12 ${imgPos === "left" ? "order-2" : ""}`}>
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`mb-8 ${editClass()}`}
          style={{ color: t.bodyText, fontSize: titleFontSize, fontWeight: 700, lineHeight: 1.2, fontFamily: t.fontHeading, textAlign: titleAlign }}>
          {slide.title}
        </div>
        <BulletsBlock />
      </div>
      <div className={`w-[45%] flex items-center justify-center p-10 ${imgPos === "left" ? "order-1" : ""}`}
        style={{ background: `linear-gradient(135deg, ${t.accent}08, ${t.accent}18)` }}>
        <ImageBlock size="large" />
      </div>
    </div>
  );

  // ============ IMAGE HEADER ============
  const ImageHeaderLayout = () => (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="h-[45%] w-full relative overflow-hidden">
        {hasImage ? <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.accent}15, ${t.accent}30)` }}>
            <Image size={64} style={{ color: t.accent }} />
          </div>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(transparent 60%, ${t.bg})` }} />
      </div>
      <div className="flex-1 px-16 py-8 relative z-10">
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`mb-6 ${editClass()}`}
          style={{ color: t.bodyText, fontSize: titleFontSize, fontWeight: 700, fontFamily: t.fontHeading, textAlign: titleAlign }}>
          {slide.title}
        </div>
        <BulletsBlock />
      </div>
      <div className="flex items-center justify-between px-16 py-4">
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
      </div>
    </div>
  );

  // ============ IMAGE CENTER ============
  const ImageCenterLayout = () => (
    <div className="w-full h-full flex flex-col items-center" style={{ background: t.bg }}>
      <div className="flex items-center px-16 w-full" style={{ background: t.titleBg, minHeight: 110 }}>
        <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: t.accent }} />
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`flex-1 ${editClass(true)}`}
          style={{ color: t.titleText, fontSize: titleFontSize - 4, fontWeight: 700, fontFamily: t.fontHeading, textAlign: titleAlign }}>
          {slide.title}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-16 py-8 w-full">
        <div className="w-[60%] aspect-video rounded-2xl overflow-hidden">
          {hasImage ? <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `${t.accent}08`, border: `2px dashed ${t.accent}30` }}>
              <Image size={48} style={{ color: t.accent }} />
            </div>
          )}
        </div>
      </div>
      <div className="w-full px-16 pb-6">
        {slide.bullets?.[0] && (
          <div contentEditable={editable} suppressContentEditableWarning
            onBlur={(e) => handleBulletChange(0, e.currentTarget.textContent || "")}
            className={`text-center ${editClass()}`}
            style={{ color: t.bodyText, fontSize: bodyFontSize, lineHeight: 1.6 }}>
            {slide.bullets[0]}
          </div>
        )}
      </div>
      <div className="w-full flex items-center justify-between px-16 py-4">
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
      </div>
    </div>
  );

  // ============ TWO IMAGE ============
  const TwoImageLayout = () => (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="flex items-center px-16 py-6" style={{ background: t.titleBg, minHeight: 100 }}>
        <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: t.accent }} />
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`flex-1 ${editClass(true)}`}
          style={{ color: t.titleText, fontSize: titleFontSize - 4, fontWeight: 700, fontFamily: t.fontHeading }}>
          {slide.title}
        </div>
      </div>
      <div className="flex-1 flex gap-10 px-16 py-10">
        {[0, 1].map((idx) => (
          <div key={idx} className="flex-1 flex flex-col gap-4">
            <div className="h-[60%] rounded-2xl overflow-hidden" style={{ background: `${t.accent}08`, border: `1.5px solid ${t.accent}20` }}>
              {hasImage ? <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center"><Image size={40} style={{ color: t.accent }} /></div>
              )}
            </div>
            {slide.bullets[idx] && (
              <div contentEditable={editable} suppressContentEditableWarning
                onBlur={(e) => handleBulletChange(idx, e.currentTarget.textContent || "")}
                className={`${editClass()}`}
                style={{ color: t.bodyText, fontSize: bodyFontSize - 4, lineHeight: 1.5, textAlign: "center" }}>
                {slide.bullets[idx]}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-16 py-4">
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
      </div>
    </div>
  );

  // ============ THREE IMAGE ============
  const ThreeImageLayout = () => (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="flex items-center px-16 py-6" style={{ background: t.titleBg, minHeight: 100 }}>
        <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: t.accent }} />
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`flex-1 ${editClass(true)}`}
          style={{ color: t.titleText, fontSize: titleFontSize - 4, fontWeight: 700, fontFamily: t.fontHeading }}>
          {slide.title}
        </div>
      </div>
      <div className="flex-1 flex gap-8 px-16 py-8">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="flex-1 flex flex-col gap-3">
            <div className="h-[55%] rounded-2xl overflow-hidden" style={{ background: `${t.accent}08`, border: `1.5px solid ${t.accent}20` }}>
              {hasImage ? <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" /> : (
                <div className="w-full h-full flex items-center justify-center"><Image size={32} style={{ color: t.accent }} /></div>
              )}
            </div>
            {slide.bullets[idx] && (
              <div contentEditable={editable} suppressContentEditableWarning
                onBlur={(e) => handleBulletChange(idx, e.currentTarget.textContent || "")}
                className={`${editClass()}`}
                style={{ color: t.bodyText, fontSize: bodyFontSize - 6, lineHeight: 1.4, textAlign: "center" }}>
                {slide.bullets[idx]}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-16 py-4">
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
      </div>
    </div>
  );

  // ============ CHART ============
  const ChartLayout = () => (
    <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
      <div className="flex items-center px-16 py-8" style={{ background: t.titleBg, minHeight: 110 }}>
        <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: t.accent }} />
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`flex-1 ${editClass(true)}`}
          style={{ color: t.titleText, fontSize: titleFontSize - 4, fontWeight: 700, fontFamily: t.fontHeading, textAlign: titleAlign }}>
          {slide.title}
        </div>
      </div>
      <div className="flex-1 flex px-16 py-8 gap-12">
        <div className="w-[35%] flex flex-col gap-4"><BulletsBlock /></div>
        <div className="flex-1 rounded-2xl flex flex-col items-center justify-center" style={{ background: `${t.accent}05` }}>
          {slide.chartData ? (
            <SlideChartRender chart={slide.chartData} width={700} height={450} />
          ) : hasImage ? (
            <img src={slide.imageUrl} alt="" className="w-full h-full object-contain rounded-2xl" />
          ) : (
            <div className="flex flex-col items-center gap-5" style={{ border: `1.5px dashed ${t.accent}30` }}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `${t.accent}15` }}>
                <BarChart3 size={40} style={{ color: t.accent }} />
              </div>
              {slide.visualSuggestion && <p className="text-center px-6" style={{ color: t.subtitleText, fontSize: 17 }}>{slide.visualSuggestion}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-16 py-4">
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
        <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
      </div>
    </div>
  );

  // ============ COMPARISON ============
  const ComparisonLayout = () => {
    const half = Math.ceil(slide.bullets.length / 2);
    const leftBullets = slide.bullets.slice(0, half);
    const rightBullets = slide.bullets.slice(half);
    const titleParts = slide.title.split(" vs ");
    return (
      <div className="w-full h-full flex flex-col" style={{ background: t.bg }}>
        <div className="flex items-center px-16 py-6" style={{ background: t.titleBg, minHeight: 100 }}>
          <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: t.accent }} />
          <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
            className={`flex-1 ${editClass(true)}`}
            style={{ color: t.titleText, fontSize: titleFontSize - 4, fontWeight: 700, fontFamily: t.fontHeading }}>
            {slide.title}
          </div>
        </div>
        <div className="flex-1 flex">
          {[leftBullets, rightBullets].map((bullets, col) => (
            <div key={col} className="flex-1 px-12 py-8 flex flex-col"
              style={{ background: col === 0 ? `${t.accent}08` : "transparent", borderRight: col === 0 ? `3px solid ${t.accent}25` : "none" }}>
              <div className="text-center mb-6 pb-4" style={{ borderBottom: `2px solid ${t.accent}20` }}>
                <span style={{ color: t.accent, fontSize: 28, fontWeight: 700, fontFamily: t.fontHeading }}>
                  {titleParts[col] || (col === 0 ? "Option A" : "Option B")}
                </span>
              </div>
              {bullets.map((b, i) => {
                const realIdx = col === 0 ? i : half + i;
                return (
                  <div key={realIdx} className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: `${t.bulletColor}18` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: col === 0 ? t.accent : t.bulletColor }} />
                    </div>
                    <div contentEditable={editable} suppressContentEditableWarning
                      onBlur={(e) => handleBulletChange(realIdx, e.currentTarget.textContent || "")}
                      className={`flex-1 ${editClass()}`}
                      style={{ color: t.bodyText, fontSize: bodyFontSize - 2, lineHeight: 1.6 }}>
                      {b}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-16 py-4">
          <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>BoiKhata MM</div>
          <div style={{ color: `${t.subtitleText}80`, fontSize: 14 }}>{slide.slideNumber}</div>
        </div>
      </div>
    );
  };

  // ============ FULL IMAGE BG ============
  const FullImageBgLayout = () => (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {hasImage ? (
        <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${t.titleBg}, ${t.accent}40)` }} />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.8) 100%)" }} />
      <div className="relative z-10 text-center max-w-[80%] px-16">
        <div contentEditable={editable} suppressContentEditableWarning onBlur={handleTitleChange}
          className={`mb-8 ${editClass(true)}`}
          style={{ color: "#ffffff", fontSize: slide.titleSize || 72, fontWeight: 800, lineHeight: 1.15, fontFamily: t.fontHeading, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          {slide.title}
        </div>
        {slide.bullets?.[0] && (
          <div contentEditable={editable} suppressContentEditableWarning
            onBlur={(e) => handleBulletChange(0, e.currentTarget.textContent || "")}
            className={`${editClass(true)}`}
            style={{ color: "#ffffffcc", fontSize: 28, lineHeight: 1.6, textShadow: "0 2px 10px rgba(0,0,0,0.4)" }}>
            {slide.bullets[0]}
          </div>
        )}
      </div>
      <div className="absolute bottom-8 right-12 z-10" style={{ color: "#ffffff60", fontSize: 14 }}>{slide.slideNumber}</div>
    </div>
  );

  const renderLayout = () => {
    switch (layoutType) {
      case "title": return <TitleLayout />;
      case "section": return <SectionLayout />;
      case "two-column": return <TwoColumnLayout />;
      case "comparison": return <ComparisonLayout />;
      case "full-image-bg": return <FullImageBgLayout />;
      case "quote": return <QuoteLayout />;
      case "big-number": return <BigNumberLayout />;
      case "image-focus": return <ImageFocusLayout />;
      case "image-header": return <ImageHeaderLayout />;
      case "image-center": return <ImageCenterLayout />;
      case "two-image": return <TwoImageLayout />;
      case "three-image": return <ThreeImageLayout />;
      case "chart": return <ChartLayout />;
      default: return <ContentLayout />;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`} style={{ aspectRatio: "16/9" }}
      onClick={() => onSelectElement?.(null)}>
      <div ref={slideRef} className="absolute origin-top-left"
        style={{
          width: SLIDE_W, height: SLIDE_H,
          transform: `scale(${s})`,
          left: `calc(50% - ${(SLIDE_W * s) / 2}px)`,
          top: `calc(50% - ${(SLIDE_H * s) / 2}px)`,
          fontFamily: t.fontBody,
        }}>
        {renderLayout()}
        <FreeformElements />
      </div>
    </div>
  );
};

export default SlideCanvas;
