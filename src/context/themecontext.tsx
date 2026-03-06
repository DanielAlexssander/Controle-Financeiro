import { createContext, useContext, useEffect, useState } from "react";
import { useColorMode } from "@chakra-ui/react";
import { lightColors, darkColors } from "../theme/colors";

type ThemeContextType = {
  currentColors: typeof lightColors;
  toggleColorMode: () => void;
  colorMode: "light" | "dark";
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  const [currentColors, setCurrentColors] = useState(lightColors);
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    const saved = localStorage.getItem("themeMode");
    return (saved as "light" | "dark" | "system") || "system";
  });

  useEffect(() => {
    setCurrentColors(colorMode === "dark" ? darkColors : lightColors);
  }, [colorMode]);

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        setColorMode(mediaQuery.matches ? "dark" : "light");
      };
      handleChange();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      setColorMode(themeMode);
    }
  }, [themeMode, setColorMode]);

  return (
    <ThemeContext.Provider value={{ currentColors, toggleColorMode, colorMode, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
