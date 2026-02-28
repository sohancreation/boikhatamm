import { createContext, useContext, useState, ReactNode } from "react";
import { safeStorage } from "@/lib/safeStorage";

type Language = "en" | "bn";

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (en: string, bn: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = safeStorage.getItem("boikhata-lang");
    return (saved === "en" || saved === "bn") ? saved : "bn";
  });

  const toggleLang = () => {
    setLang((l) => {
      const next = l === "en" ? "bn" : "en";
      safeStorage.setItem("boikhata-lang", next);
      return next;
    });
  };

  const t = (en: string, bn: string) => (lang === "en" ? en : bn);

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
