type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
};

/** Keep PDF.js reading order, baselines and relative indentation instead of flattening a slide. */
export function pdfTextWithLayout(items: readonly unknown[]): string {
  const textItems = items.filter((item): item is PdfTextItem => {
    const value = item as Partial<PdfTextItem> | null;
    return !!value && typeof value.str === "string" && Array.isArray(value.transform);
  });
  const visible = textItems.filter(item => item.str.trim());
  if (!visible.length) return "";
  const left = Math.min(...visible.map(item => item.transform[4] ?? 0));
  const widths = visible.map(item => item.width / Math.max(1, item.str.length)).filter(width => width > 0).sort((a, b) => a - b);
  const column = widths[Math.floor(widths.length / 2)] || 5;
  const lines: string[] = [];
  let line = "", baseline = 0, right = 0, height = 10, newLine = true;
  const flush = () => { if (line.trim()) lines.push(line.trimEnd()); line = ""; };
  for (const item of textItems) {
    const x = item.transform[4] ?? 0, y = item.transform[5] ?? 0;
    const nextHeight = Math.abs(item.height) || Math.abs(item.transform[3] ?? 10) || 10;
    const baselineChanged = Math.abs(y - baseline) > Math.max(3, Math.max(height, nextHeight) * .65);
    if (item.str.trim() && (newLine || baselineChanged)) {
      flush();
      line = " ".repeat(Math.min(40, Math.max(0, Math.round((x - left) / column))));
      baseline = y;
      height = nextHeight;
      newLine = false;
    } else if (line && item.str && !/\s$/.test(line) && !/^\s/.test(item.str)) {
      const gap = Math.max(0, x - right);
      if (gap > column * .3) line += " ".repeat(Math.min(12, Math.max(1, Math.round(gap / column))));
    }
    line += item.str;
    right = x + (item.width || 0);
    height = Math.max(height, nextHeight);
    if (item.hasEOL) { flush(); newLine = true; }
  }
  flush();
  return lines.join("\n").trimEnd();
}
