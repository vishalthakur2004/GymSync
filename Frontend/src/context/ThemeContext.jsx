import { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get saved theme from localStorage or use system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setIsLoaded(true);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const setLightTheme = () => {
    setTheme("light");
    applyTheme("light");
  };

  const setDarkTheme = () => {
    setTheme("dark");
    applyTheme("dark");
  };

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export { useThemeContext };
