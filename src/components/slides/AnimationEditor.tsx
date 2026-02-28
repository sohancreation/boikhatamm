import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, Timer, Zap } from "lucide-react";

export interface SlideAnimation {
  textEntrance: "none" | "fade-in" | "slide-up" | "slide-left" | "zoom-in" | "typewriter";
  transition: "none" | "fade" | "slide-left" | "slide-up" | "zoom" | "flip";
  speed: "slow" | "normal" | "fast";
  delay: number; // ms
}

export const DEFAULT_ANIMATION: SlideAnimation = {
  textEntrance: "none",
  transition: "none",
  speed: "normal",
  delay: 0,
};

interface AnimationEditorProps {
  animation?: SlideAnimation;
  onChange: (animation: SlideAnimation) => void;
}

const AnimationEditor = ({ animation, onChange }: AnimationEditorProps) => {
  const { t } = useLanguage();
  const anim = animation || DEFAULT_ANIMATION;

  const update = (partial: Partial<SlideAnimation>) => {
    onChange({ ...anim, ...partial });
  };

  return (
    <div className="space-y-3">
      {/* Text Entrance */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {t("Text Entrance", "টেক্সট এন্ট্রান্স")}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { id: "none", label: "None" },
            { id: "fade-in", label: "Fade In" },
            { id: "slide-up", label: "Slide Up" },
            { id: "slide-left", label: "Slide Left" },
            { id: "zoom-in", label: "Zoom In" },
            { id: "typewriter", label: "Typewriter" },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => update({ textEntrance: opt.id })}
              className={`px-1.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                anim.textEntrance === opt.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Transition */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Zap className="w-3 h-3" /> {t("Slide Transition", "স্লাইড ট্রানজিশন")}
        </p>
        <div className="grid grid-cols-3 gap-1">
          {([
            { id: "none", label: "None" },
            { id: "fade", label: "Fade" },
            { id: "slide-left", label: "Slide" },
            { id: "slide-up", label: "Slide Up" },
            { id: "zoom", label: "Zoom" },
            { id: "flip", label: "Flip" },
          ] as const).map(opt => (
            <button key={opt.id} onClick={() => update({ transition: opt.id })}
              className={`px-1.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all ${
                anim.transition === opt.id ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Timer className="w-3 h-3" /> {t("Speed", "গতি")}
        </p>
        <div className="flex gap-1">
          {(["slow", "normal", "fast"] as const).map(s => (
            <button key={s} onClick={() => update({ speed: s })}
              className={`flex-1 px-1.5 py-1.5 rounded-lg border text-[9px] font-medium transition-all capitalize ${
                anim.speed === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Delay */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">
          {t("Delay", "বিলম্ব")}: {anim.delay}ms
        </p>
        <input type="range" min={0} max={2000} step={100} value={anim.delay}
          onChange={e => update({ delay: Number(e.target.value) })} className="w-full accent-primary" />
      </div>
    </div>
  );
};

export default AnimationEditor;

// Helper: get framer-motion variants from animation settings
export const getTransitionVariants = (anim?: SlideAnimation) => {
  const a = anim || DEFAULT_ANIMATION;
  const duration = a.speed === "slow" ? 0.8 : a.speed === "fast" ? 0.2 : 0.4;

  const transitionMap: Record<string, { initial: any; animate: any }> = {
    none: { initial: {}, animate: {} },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    "slide-left": { initial: { x: "100%", opacity: 0 }, animate: { x: 0, opacity: 1 } },
    "slide-up": { initial: { y: "100%", opacity: 0 }, animate: { y: 0, opacity: 1 } },
    zoom: { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
    flip: { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 } },
  };

  const textMap: Record<string, { initial: any; animate: any }> = {
    none: { initial: {}, animate: {} },
    "fade-in": { initial: { opacity: 0 }, animate: { opacity: 1 } },
    "slide-up": { initial: { y: 30, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    "slide-left": { initial: { x: -30, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    "zoom-in": { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
    typewriter: { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: "auto" } },
  };

  return {
    slide: { ...(transitionMap[a.transition] || transitionMap.none), transition: { duration, delay: a.delay / 1000 } },
    text: { ...(textMap[a.textEntrance] || textMap.none), transition: { duration: duration * 0.8, delay: a.delay / 1000 + 0.1 } },
  };
};
