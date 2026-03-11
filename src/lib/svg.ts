const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "\"": "&quot;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;"
};

export function escapeXml(value: string): string {
  return value.replace(/[&"'<>]/g, (character) => XML_ESCAPES[character] ?? character);
}

export function estimateTextWidth(text: string, fontSize = 11): number {
  const averageCharWidth = fontSize * 0.58;
  return Math.max(24, Math.ceil(text.length * averageCharWidth));
}
