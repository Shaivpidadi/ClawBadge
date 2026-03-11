export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (Math.abs(value) < 1000) {
    return String(Math.trunc(value));
  }

  const formatted = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value < 100_000 ? 1 : 0
  }).format(value);

  return formatted.toLowerCase().replace(".0", "");
}

export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(Math.trunc(value));
}

export function formatVersion(version: string): string {
  return version === "unknown" ? version : `v${version}`;
}

export function formatUpdatedDate(timestamp: number | null): string | null {
  if (!timestamp) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric"
  }).format(new Date(timestamp));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
