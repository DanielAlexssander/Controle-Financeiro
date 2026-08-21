// Modern color palette with gradients and glassmorphism support
export const lightColors = {
  // Backgrounds
  bg: "#f8fafc",
  bgCard: "#ffffff",
  bgCardHover: "#f1f5f9",
  bgGlass: "rgba(255, 255, 255, 0.8)",
  bgInput: "#f1f5f9",
  
  // Text
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  
  // Brand colors
  primary: "#6366f1",
  primaryDark: "#4f46e5",
  primaryLight: "#818cf8",
  
  // Accent colors
  accent: "#06b6d4",
  accentLight: "#22d3ee",
  
  // Status colors
  success: "#10b981",
  successLight: "#34d399",
  warning: "#f59e0b",
  warningLight: "#fbbf24",
  danger: "#ef4444",
  dangerLight: "#f87171",
  
  // Chart colors
  chart1: "#6366f1",
  chart2: "#06b6d4",
  chart3: "#10b981",
  chart4: "#f59e0b",
  chart5: "#ef4444",
  chart6: "#8b5cf6",
  chart7: "#ec4899",
  chart8: "#14b8a6",
  
  // Borders
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  
  // Shadows
  shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  
  // Gradients
  gradientPrimary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  gradientSuccess: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
  gradientWarning: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  gradientAccent: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
};

export const darkColors = {
  // Backgrounds
  bg: "#0f172a",
  bgCard: "#1e293b",
  bgCardHover: "#334155",
  bgGlass: "rgba(30, 41, 59, 0.8)",
  bgInput: "#334155",
  
  // Text
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  
  // Brand colors
  primary: "#818cf8",
  primaryDark: "#6366f1",
  primaryLight: "#a5b4fc",
  
  // Accent colors
  accent: "#22d3ee",
  accentLight: "#67e8f9",
  
  // Status colors
  success: "#34d399",
  successLight: "#6ee7b7",
  warning: "#fbbf24",
  warningLight: "#fcd34d",
  danger: "#f87171",
  dangerLight: "#fca5a5",
  
  // Chart colors
  chart1: "#818cf8",
  chart2: "#22d3ee",
  chart3: "#34d399",
  chart4: "#fbbf24",
  chart5: "#f87171",
  chart6: "#a78bfa",
  chart7: "#f472b6",
  chart8: "#2dd4bf",
  
  // Borders
  border: "#334155",
  borderLight: "#475569",
  
  // Shadows
  shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
  
  // Gradients
  gradientPrimary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  gradientSuccess: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
  gradientWarning: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  gradientAccent: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
};

// Chart.js color arrays
export const getChartColors = (isDark: boolean) => {
  const colors = isDark ? darkColors : lightColors;
  return [
    colors.chart1,
    colors.chart2,
    colors.chart3,
    colors.chart4,
    colors.chart5,
    colors.chart6,
    colors.chart7,
    colors.chart8,
  ];
};
