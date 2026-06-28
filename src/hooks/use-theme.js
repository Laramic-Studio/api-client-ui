import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next) => {
    const value = next === "light" ? "light" : "dark";
    setThemeState(value);
    applyTheme(value);
  };

  return {
    theme,
    isDark: theme === "dark",
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
