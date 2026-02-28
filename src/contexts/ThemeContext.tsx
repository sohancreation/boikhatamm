import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { safeStorage } from "@/lib/safeStorage";

type ThemeMode = "light" | "dark" | "dark_pro";

interface ThemeContextType {
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = safeStorage.getItem("boikhata-theme") as ThemeMode;
    return saved === "dark" || saved === "dark_pro" ? saved : "light";
  });

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("dark", "dark-pro");
    if (themeMode === "dark") el.classList.add("dark");
    if (themeMode === "dark_pro") { el.classList.add("dark"); el.classList.add("dark-pro"); }
    safeStorage.setItem("boikhata-theme", themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeModeState(prev => prev === "light" ? "dark" : "light");
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ isDark: themeMode !== "light", themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
