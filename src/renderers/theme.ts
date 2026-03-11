import type { ThemeName } from "../types.js";

type ThemePalette = {
  badge: {
    left: string;
    right: string;
    text: string;
    border: string;
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
      left: "#1f2937",
      right: "#0f766e",
      text: "#f8fafc",
      border: "#0f172a"
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
      left: "#0f172a",
      right: "#1d4ed8",
      text: "#e2e8f0",
      border: "#020617"
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
      left: "#111827",
      right: "#f59e0b",
      text: "#fffdf6",
      border: "#111827"
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
