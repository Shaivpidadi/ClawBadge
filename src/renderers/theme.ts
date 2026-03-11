import type { ThemeName } from "../types.js";

type ThemePalette = {
  badge: {
    left: string;
    right: string;
    text: string;
  };
  card: {
    background: string;
    panel: string;
    accent: string;
    accentMuted: string;
    title: string;
    text: string;
    muted: string;
    pillBackground: string;
    pillText: string;
    metricBackground: string;
    metricBorder: string;
    shadow: string;
  };
};

const themePalettes: Record<ThemeName, ThemePalette> = {
  default: {
    badge: {
      left: "#374151",
      right: "#0d9488",
      text: "#ffffff"
    },
    card: {
      background: "url(#bg-default)",
      panel: "#fcfdff",
      accent: "#0f766e",
      accentMuted: "#ccfbf1",
      title: "#0f172a",
      text: "#334155",
      muted: "#64748b",
      pillBackground: "#0f172a",
      pillText: "#f8fafc",
      metricBackground: "#ffffff",
      metricBorder: "#d7e3f2",
      shadow: "rgba(15, 23, 42, 0.16)"
    }
  },
  dark: {
    badge: {
      left: "#1e293b",
      right: "#2563eb",
      text: "#f1f5f9"
    },
    card: {
      background: "url(#bg-dark)",
      panel: "#0b1220",
      accent: "#60a5fa",
      accentMuted: "#1e3a8a",
      title: "#f8fafc",
      text: "#cbd5e1",
      muted: "#94a3b8",
      pillBackground: "#111827",
      pillText: "#dbeafe",
      metricBackground: "#111827",
      metricBorder: "#1e293b",
      shadow: "rgba(2, 6, 23, 0.55)"
    }
  },
  flat: {
    badge: {
      left: "#374151",
      right: "#d97706",
      text: "#ffffff"
    },
    card: {
      background: "#f7f3e8",
      panel: "#fffaf0",
      accent: "#b45309",
      accentMuted: "#fed7aa",
      title: "#1f2937",
      text: "#374151",
      muted: "#6b7280",
      pillBackground: "#1f2937",
      pillText: "#fffaf0",
      metricBackground: "#fffdf7",
      metricBorder: "#e5d4b2",
      shadow: "rgba(120, 53, 15, 0.12)"
    }
  }
};

export function resolveTheme(theme: string | undefined): ThemeName {
  if (theme === "dark" || theme === "flat") {
    return theme;
  }

  return "default";
}

export function getThemePalette(theme: ThemeName): ThemePalette {
  return themePalettes[theme];
}
