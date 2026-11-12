import type { Citation, Source, SourcePage, TopicLevel, Topic } from "@workspace/api-client-react";

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function errMsg(e: unknown, fallback = "Something went wrong."): string {
  if (!e) return fallback;
  const data = (e as { data?: unknown }).data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.error === "string") return d.error;
    if (typeof d.message === "string") return d.message;
  }
  if (typeof data === "string" && data.length < 300) return data;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number } | null)?.status;
}

export const LEVELS: Record<TopicLevel, { label: string; tone: string; dot: string; blurb: string }> = {
  Locked: { label: "Locked", tone: "bg-[hsl(42_30%_88%)] text-[hsl(228_15%_42%)]", dot: "hsl(228 12% 62%)", blurb: "Prerequisites still ahead" },
  Unlocked: { label: "Unlocked", tone: "bg-[hsl(208_70%_90%)] text-[hsl(226_60%_30%)]", dot: "hsl(226 60% 46%)", blurb: "Ready to start" },
  Practicing: { label: "Practicing", tone: "bg-[hsl(52_96%_80%)] text-[hsl(35_70%_25%)]", dot: "hsl(42 92% 48%)", blurb: "Getting there with review" },
  Mastered: { label: "Mastered", tone: "bg-[hsl(92_62%_80%)] text-[hsl(140_45%_20%)]", dot: "hsl(110 50% 38%)", blurb: "Correct across spaced sessions" },
};

export function findSourcePage(sources: Source[], c: Citation): { source?: Source; page?: SourcePage } {
  const source = sources.find((s) => s.id === c.sourceId);
  if (!source) return {};
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9:]/g, "");
  let page = source.pages.find((p) => p.locator === c.locator) ?? source.pages.find((p) => norm(p.locator) === norm(c.locator));
  if (!page && c.quote) {
    const q = c.quote.slice(0, 40).toLowerCase();
    page = source.pages.find((p) => p.text.toLowerCase().includes(q));
  }
  return { source, page };
}

export function pdfPageNumber(locator: string): number | undefined {
  const m = locator.match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}

export function sourceUrl(source: Source, locator?: string): string | undefined {
  if (!source.objectPath) return undefined;
  const n = locator ? pdfPageNumber(locator) : undefined;
  return `${basePath}/api/storage${source.objectPath}${n ? `#page=${n}` : ""}`;
}

export function topicDepths(topics: Topic[]): Map<string, number> {
  const byId = new Map(topics.map((t) => [t.id, t]));
  const memo = new Map<string, number>();
  const visit = (id: string, seen: Set<string>): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const t = byId.get(id);
    const pre = (t?.prerequisites ?? []).filter((p) => byId.has(p));
    const d = pre.length ? Math.max(...pre.map((p) => visit(p, seen))) + 1 : 0;
    memo.set(id, d);
    return d;
  };
  topics.forEach((t) => visit(t.id, new Set()));
  return memo;
}

export function relTime(iso?: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const days = Math.round(s / 86400);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
}

export const STEP_LABELS: Record<string, string> = {
  page: "Page",
  input: "Page",
  validate: "Server check",
  server: "Server check",
  extract: "Text extraction",
  extraction: "Text extraction",
  ai: "AI model",
  summarize: "AI model",
  fallback: "Fallback",
  citations: "Citation check",
  citation: "Citation check",
  database: "Database",
  save: "Save",
  render: "Render",
  flag: "Flag",
  edit: "Student edit",
  regenerate: "Regenerate",
  topics: "Topic extraction",
  quiz: "Quiz result",
  level: "Level change",
};

export function stepLabel(step: string): string {
  const key = step.toLowerCase();
  if (STEP_LABELS[key]) return STEP_LABELS[key];
  return step.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export const COURSE_COLORS = ["#2A44A0", "#5E9C2E", "#D9A21B", "#D2544A", "#7A4FA0", "#1F8A8A"];
