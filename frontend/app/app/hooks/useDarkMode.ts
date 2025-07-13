import { useEffect } from "react";
import { useTheme } from "ahooks";
import { useCurrentSession } from "./useCurrentSession";

export function useDarkMode() {
  const { session } = useCurrentSession();
  const key = "darkMode";

  // Use user-specific storage key instead of company-specific
  const storageKey = `${session?.id || "guest"}-${key}`;

  // Use useTheme for theme management with persistence
  const { theme, themeMode, setThemeMode } = useTheme({
    localStorageKey: storageKey,
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Toggle function
  const toggleDarkMode = () => {
    setThemeMode(theme === "dark" ? "light" : "dark");
  };

  // Set specific theme
  const setTheme = (newTheme: "light" | "dark" | "system") => {
    setThemeMode(newTheme);
  };

  return {
    isDark: theme === "dark",
    theme,
    themeMode,
    toggleDarkMode,
    setTheme,
    setThemeMode,
  };
}
