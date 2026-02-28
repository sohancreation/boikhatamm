export interface SlideTheme {
  id: string;
  name: string;
  namebn: string;
  preview: string;
  slide: {
    bg: string;
    titleBg: string;
    titleText: string;
    bodyText: string;
    accent: string;
    bulletColor: string;
    subtitleText: string;
    noteBg: string;
    noteText: string;
    fontHeading: string;
    fontBody: string;
  };
  pptx: {
    bg: string;
    titleBg: string;
    titleText: string;
    bodyText: string;
    accent: string;
  };
}

export const FONT_OPTIONS = [
  { label: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Playfair Display", value: "'Playfair Display', serif" },
  { label: "Roboto Slab", value: "'Roboto Slab', serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
  { label: "Lora", value: "'Lora', serif" },
  { label: "Oswald", value: "'Oswald', sans-serif" },
  { label: "Noto Sans Bengali", value: "'Noto Sans Bengali', sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
];

export const slideThemes: SlideTheme[] = [
  {
    id: "midnight",
    name: "Midnight",
    namebn: "মিডনাইট",
    preview: "linear-gradient(135deg, #0f172a, #1e293b)",
    slide: { bg: "#0f172a", titleBg: "#1e293b", titleText: "#f1f5f9", bodyText: "#cbd5e1", accent: "#38bdf8", bulletColor: "#38bdf8", subtitleText: "#94a3b8", noteBg: "#1e293b", noteText: "#94a3b8", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "0F172A", titleBg: "1E293B", titleText: "F1F5F9", bodyText: "CBD5E1", accent: "38BDF8" },
  },
  {
    id: "clean-white",
    name: "Clean White",
    namebn: "ক্লিন হোয়াইট",
    preview: "linear-gradient(135deg, #ffffff, #f8fafc)",
    slide: { bg: "#ffffff", titleBg: "#f8fafc", titleText: "#0f172a", bodyText: "#334155", accent: "#6366f1", bulletColor: "#6366f1", subtitleText: "#64748b", noteBg: "#f1f5f9", noteText: "#64748b", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "FFFFFF", titleBg: "F8FAFC", titleText: "0F172A", bodyText: "334155", accent: "6366F1" },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    namebn: "ওশান ব্লু",
    preview: "linear-gradient(135deg, #0c4a6e, #0284c7)",
    slide: { bg: "#0c4a6e", titleBg: "#075985", titleText: "#e0f2fe", bodyText: "#bae6fd", accent: "#38bdf8", bulletColor: "#7dd3fc", subtitleText: "#7dd3fc", noteBg: "#075985", noteText: "#bae6fd", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "0C4A6E", titleBg: "075985", titleText: "E0F2FE", bodyText: "BAE6FD", accent: "38BDF8" },
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    namebn: "সানসেট ওয়ার্ম",
    preview: "linear-gradient(135deg, #7c2d12, #ea580c)",
    slide: { bg: "#fef3c7", titleBg: "#92400e", titleText: "#fffbeb", bodyText: "#78350f", accent: "#ea580c", bulletColor: "#ea580c", subtitleText: "#a16207", noteBg: "#fef9c3", noteText: "#92400e", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "FEF3C7", titleBg: "92400E", titleText: "FFFBEB", bodyText: "78350F", accent: "EA580C" },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    namebn: "ফরেস্ট গ্রিন",
    preview: "linear-gradient(135deg, #14532d, #16a34a)",
    slide: { bg: "#f0fdf4", titleBg: "#14532d", titleText: "#dcfce7", bodyText: "#166534", accent: "#16a34a", bulletColor: "#22c55e", subtitleText: "#15803d", noteBg: "#dcfce7", noteText: "#166534", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "F0FDF4", titleBg: "14532D", titleText: "DCFCE7", bodyText: "166534", accent: "16A34A" },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    namebn: "রয়েল পার্পল",
    preview: "linear-gradient(135deg, #581c87, #a855f7)",
    slide: { bg: "#1e1b4b", titleBg: "#312e81", titleText: "#e9d5ff", bodyText: "#c4b5fd", accent: "#a855f7", bulletColor: "#a855f7", subtitleText: "#a78bfa", noteBg: "#312e81", noteText: "#a78bfa", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "1E1B4B", titleBg: "312E81", titleText: "E9D5FF", bodyText: "C4B5FD", accent: "A855F7" },
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    namebn: "রোজ গোল্ড",
    preview: "linear-gradient(135deg, #831843, #f43f5e)",
    slide: { bg: "#fff1f2", titleBg: "#881337", titleText: "#fecdd3", bodyText: "#9f1239", accent: "#f43f5e", bulletColor: "#fb7185", subtitleText: "#be123c", noteBg: "#ffe4e6", noteText: "#9f1239", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "FFF1F2", titleBg: "881337", titleText: "FECDD3", bodyText: "9F1239", accent: "F43F5E" },
  },
  {
    id: "carbon",
    name: "Carbon",
    namebn: "কার্বন",
    preview: "linear-gradient(135deg, #171717, #404040)",
    slide: { bg: "#171717", titleBg: "#262626", titleText: "#fafafa", bodyText: "#d4d4d4", accent: "#f59e0b", bulletColor: "#f59e0b", subtitleText: "#a3a3a3", noteBg: "#262626", noteText: "#a3a3a3", fontHeading: "'Space Grotesk', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "171717", titleBg: "262626", titleText: "FAFAFA", bodyText: "D4D4D4", accent: "F59E0B" },
  },
  // ===== NEW THEMES =====
  {
    id: "neon-cyber",
    name: "Neon Cyber",
    namebn: "নিয়ন সাইবার",
    preview: "linear-gradient(135deg, #0a0a1a, #1a0a2e)",
    slide: { bg: "#0a0a1a", titleBg: "#12122a", titleText: "#00ff88", bodyText: "#a0e8d0", accent: "#00ff88", bulletColor: "#00ff88", subtitleText: "#4ade80", noteBg: "#12122a", noteText: "#4ade80", fontHeading: "'Oswald', sans-serif", fontBody: "'Space Grotesk', sans-serif" },
    pptx: { bg: "0A0A1A", titleBg: "12122A", titleText: "00FF88", bodyText: "A0E8D0", accent: "00FF88" },
  },
  {
    id: "pastel-dream",
    name: "Pastel Dream",
    namebn: "প্যাস্টেল ড্রিম",
    preview: "linear-gradient(135deg, #fdf2f8, #ede9fe)",
    slide: { bg: "#fdf2f8", titleBg: "#fce7f3", titleText: "#701a75", bodyText: "#86198f", accent: "#d946ef", bulletColor: "#d946ef", subtitleText: "#a21caf", noteBg: "#fae8ff", noteText: "#a21caf", fontHeading: "'Playfair Display', serif", fontBody: "'Lora', serif" },
    pptx: { bg: "FDF2F8", titleBg: "FCE7F3", titleText: "701A75", bodyText: "86198F", accent: "D946EF" },
  },
  {
    id: "earth-tone",
    name: "Earth Tone",
    namebn: "আর্থ টোন",
    preview: "linear-gradient(135deg, #292524, #57534e)",
    slide: { bg: "#fafaf9", titleBg: "#292524", titleText: "#fafaf9", bodyText: "#44403c", accent: "#c2410c", bulletColor: "#c2410c", subtitleText: "#78716c", noteBg: "#f5f5f4", noteText: "#78716c", fontHeading: "'Roboto Slab', serif", fontBody: "'Inter', sans-serif" },
    pptx: { bg: "FAFAF9", titleBg: "292524", titleText: "FAFAF9", bodyText: "44403C", accent: "C2410C" },
  },
  {
    id: "arctic-ice",
    name: "Arctic Ice",
    namebn: "আর্কটিক আইস",
    preview: "linear-gradient(135deg, #e0f2fe, #f0f9ff)",
    slide: { bg: "#f0f9ff", titleBg: "#0c4a6e", titleText: "#f0f9ff", bodyText: "#0369a1", accent: "#0ea5e9", bulletColor: "#0ea5e9", subtitleText: "#0284c7", noteBg: "#e0f2fe", noteText: "#0284c7", fontHeading: "'Montserrat', sans-serif", fontBody: "'Inter', sans-serif" },
    pptx: { bg: "F0F9FF", titleBg: "0C4A6E", titleText: "F0F9FF", bodyText: "0369A1", accent: "0EA5E9" },
  },
  {
    id: "luxury-gold",
    name: "Luxury Gold",
    namebn: "লাক্সারি গোল্ড",
    preview: "linear-gradient(135deg, #1c1917, #422006)",
    slide: { bg: "#1c1917", titleBg: "#292524", titleText: "#fbbf24", bodyText: "#e7e5e4", accent: "#f59e0b", bulletColor: "#fbbf24", subtitleText: "#d6d3d1", noteBg: "#292524", noteText: "#a8a29e", fontHeading: "'Playfair Display', serif", fontBody: "'Inter', sans-serif" },
    pptx: { bg: "1C1917", titleBg: "292524", titleText: "FBBF24", bodyText: "E7E5E4", accent: "F59E0B" },
  },
  {
    id: "tropical",
    name: "Tropical",
    namebn: "ট্রপিক্যাল",
    preview: "linear-gradient(135deg, #065f46, #059669)",
    slide: { bg: "#ecfdf5", titleBg: "#065f46", titleText: "#d1fae5", bodyText: "#064e3b", accent: "#10b981", bulletColor: "#34d399", subtitleText: "#047857", noteBg: "#d1fae5", noteText: "#047857", fontHeading: "'Poppins', sans-serif", fontBody: "'Poppins', sans-serif" },
    pptx: { bg: "ECFDF5", titleBg: "065F46", titleText: "D1FAE5", bodyText: "064E3B", accent: "10B981" },
  },
  {
    id: "slate-pro",
    name: "Slate Pro",
    namebn: "স্লেট প্রো",
    preview: "linear-gradient(135deg, #334155, #475569)",
    slide: { bg: "#f8fafc", titleBg: "#334155", titleText: "#f8fafc", bodyText: "#475569", accent: "#3b82f6", bulletColor: "#3b82f6", subtitleText: "#64748b", noteBg: "#e2e8f0", noteText: "#64748b", fontHeading: "'Montserrat', sans-serif", fontBody: "'Inter', sans-serif" },
    pptx: { bg: "F8FAFC", titleBg: "334155", titleText: "F8FAFC", bodyText: "475569", accent: "3B82F6" },
  },
];

export const getTheme = (id: string): SlideTheme =>
  slideThemes.find((t) => t.id === id) || slideThemes[0];

// Create a custom theme override
export const applyThemeOverrides = (
  theme: SlideTheme,
  overrides: {
    accent?: string;
    bg?: string;
    titleBg?: string;
    titleText?: string;
    bodyText?: string;
    fontHeading?: string;
    fontBody?: string;
  }
): SlideTheme => {
  const s = { ...theme.slide };
  if (overrides.accent) { s.accent = overrides.accent; s.bulletColor = overrides.accent; }
  if (overrides.bg) s.bg = overrides.bg;
  if (overrides.titleBg) s.titleBg = overrides.titleBg;
  if (overrides.titleText) s.titleText = overrides.titleText;
  if (overrides.bodyText) s.bodyText = overrides.bodyText;
  if (overrides.fontHeading) s.fontHeading = overrides.fontHeading;
  if (overrides.fontBody) s.fontBody = overrides.fontBody;
  return { ...theme, slide: s };
};
