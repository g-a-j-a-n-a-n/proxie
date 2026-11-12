import { useState, type ReactNode } from "react";
import type { Citation, Flag, Section, Source, Statement, Term } from "@workspace/api-client-react";
import { ExternalLink, FileText, Flag as FlagIcon, Hash, PencilLine, RefreshCw, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findSourcePage, sourceUrl } from "@/lib/proxie";
import { cn } from "@/lib/utils";
import { formatNoteText } from "@/lib/pseudocode";
import { PseudocodeBlock } from "@/components/pseudocode-block";

/* ---------- Source viewer ---------- */

export function SourceDialog({ open, onOpenChange, citation, sources }: { open: boolean; onOpenChange: (o: boolean) => void; citation: Citation | null; sources: Source[] }) {
  const { source, page } = citation ? findSourcePage(sources, citation) : {};
  const url = source ? sourceUrl(source, citation?.locator) : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88dvh] max-w-2xl overflow-hidden bg-[hsl(var(--card))] p-0">
        <div className="paper-lined max-h-[88dvh] overflow-y-auto p-6 pl-16">
          <DialogHeader>
            <DialogTitle className="hand text-3xl font-bold"><span className="marker-underline">{source?.name ?? "Source"}</span></DialogTitle>
            <DialogDescription className="mono text-xs">
              {source?.type === "transcript" ? "Transcript" : "Slides"} · {citation?.locator}
            </DialogDescription>
          </DialogHeader>
          {!source && <p className="mt-4 text-sm text-[hsl(var(--pen-red))]">This citation points to a source that is no longer in this notebook.</p>}
          {citation?.quote && (
            <blockquote className="mt-4 border-l-4 border-[hsl(var(--hl-green))] pl-3 text-[15px] italic text-[hsl(var(--ink))]">"{citation.quote}"</blockquote>
          )}
          {page ? (
            <div className="mt-5">
              <p className="mono mb-2 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Extracted text · {page.locator}</p>
              <div className="whitespace-pre-wrap rounded-lg bg-[hsl(var(--card)/0.85)] p-4 text-[15px] leading-[1.75]" data-testid="text-source-page">
                <MarkQuote text={page.text} quote={citation?.quote ?? ""} />
              </div>
            </div>
          ) : source ? (
            <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">No extracted text matched "{citation?.locator}".</p>
          ) : null}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="ink-btn mt-5" data-testid="link-open-pdf">
              <ExternalLink className="h-4 w-4" /> Open original PDF at {citation?.locator}
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MarkQuote({ text, quote }: { text: string; quote: string }) {
  const q = quote.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="hl-y text-inherit">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function Cite({ c, onOpen }: { c: Citation; onOpen: (c: Citation) => void }) {
  return (
    <button type="button" className="cite-chip" onClick={() => onOpen(c)} title={`Open source: ${c.locator}`} data-testid={`button-cite-${c.locator}`}>
      {c.locator}
    </button>
  );
}

/* ---------- Highlight helpers ---------- */

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Phrase-level highlights only: "Lead-in:" phrases go yellow, known key terms go green. */
export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  let lead: string | null = null;
  let rest = text;
  const colon = text.indexOf(":");
  if (colon > 2 && colon < 48) {
    lead = text.slice(0, colon);
    rest = text.slice(colon);
  }
  const usable = terms.filter((t) => t.length > 2).sort((a, b) => b.length - a.length);
  let parts: ReactNode[] = [rest];
  if (usable.length) {
    const re = new RegExp(`\\b(${usable.map(escapeRe).join("|")})\\b`, "i");
    const out: ReactNode[] = [];
    let remaining = rest;
    let used = 0;
    while (remaining && used < 2) {
      const m = remaining.match(re);
      if (!m || m.index === undefined) break;
      out.push(remaining.slice(0, m.index));
      out.push(<mark key={used} className="hl-g text-inherit">{m[0]}</mark>);
      remaining = remaining.slice(m.index + m[0].length);
      used++;
    }
    out.push(remaining);
    parts = out;
  }
  return (
    <>
      {lead && <mark className="hl-y font-bold text-inherit">{lead}</mark>}
      {parts}
    </>
  );
}

/* ---------- Flip card ---------- */

const NOTE_TONES = ["", "green", "pink"] as const;

export function TermCard({ term, i, onCite }: { term: Term; i: number; onCite: (c: Citation) => void }) {
  const [flipped, setFlipped] = useState(false);
  const tone = NOTE_TONES[i % 3];
  const tilt = ["rotate-[-1.2deg]", "rotate-[1deg]", "rotate-[-0.4deg]"][i % 3];
  return (
    <div className={cn("flip h-56", tilt)} data-flipped={flipped} data-testid={`card-term-${i}`}>
      <div className="flip-inner">
        <button type="button" onClick={() => setFlipped(true)} className={cn("flip-face sticky-note tape flex flex-col rounded-sm p-5 text-left", tone)} aria-label={`${term.term}: show example`}>
          <span className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink)/0.55)]">Key term</span>
          <span className="hand mt-1 text-[30px] font-bold leading-none text-[hsl(var(--ink))]">{term.term}</span>
          <span className="mt-2 line-clamp-4 text-[14px] leading-snug text-[hsl(var(--ink)/0.85)]">{term.definition}</span>
          <span className="mt-auto flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--ink)/0.6)]"><RotateCw className="h-3 w-3" /> flip for an example</span>
        </button>
        <div className={cn("flip-face flip-back sticky-note flex flex-col rounded-sm p-5", tone)}>
          <span className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--ink)/0.55)]">Example</span>
          <p className="mt-2 line-clamp-5 text-[14px] leading-snug text-[hsl(var(--ink))]">{term.example}</p>
          <div className="mt-auto flex items-center justify-between">
            <Cite c={term.citation} onOpen={onCite} />
            <button type="button" onClick={() => setFlipped(false)} className="flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--ink)/0.6)]" data-testid={`button-flip-back-${i}`}>
              <RotateCw className="h-3 w-3" /> flip back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section ---------- */

export function sectionStatusLabel(status: string): { label: string; cls: string } | null {
  const s = status.toLowerCase();
  if (s.includes("edit")) return { label: "Student edited · not AI-verified", cls: "bg-[hsl(var(--hl-pink))] text-[hsl(340_50%_28%)]" };
  if (s.includes("regen")) return { label: "Regenerated from sources", cls: "bg-[hsl(208_70%_90%)] text-[hsl(226_60%_30%)]" };
  if (s.includes("fallback") || s.includes("extract")) return { label: "Extractive summary (AI step fell back)", cls: "bg-[hsl(var(--hl-yellow))] text-[hsl(35_70%_22%)]" };
  if (s.includes("outside") || s.includes("unmatched")) return { label: "Some claims outside your materials", cls: "bg-[hsl(4_80%_90%)] text-[hsl(var(--pen-red))]" };
  return null;
}

function StatementLine({ st, terms, onCite, onFlag, children }: { st: Statement; terms: string[]; onCite: (c: Citation) => void; onFlag: (st: Statement) => void; children?: ReactNode }) {
  return (
    <div className="group/st min-w-0">
      {children}
      {formatNoteText(st.text).map((block, i) => block.kind === "code"
        ? <PseudocodeBlock key={i} block={block} />
        : <span className="whitespace-pre-wrap" key={i}><Highlighted text={block.text} terms={terms} /></span>)}
      <Cite c={st.citation} onOpen={onCite} />
      <button type="button" onClick={() => onFlag(st)} className="ml-1 inline-flex translate-y-[2px] items-center rounded p-0.5 text-[hsl(var(--muted-foreground))] opacity-60 transition-opacity hover:text-[hsl(var(--pen-red))] focus:opacity-100 md:opacity-0 md:group-hover/st:opacity-100" aria-label="Flag this sentence" data-testid="button-flag-statement">
        <FlagIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function SectionBlock({ section, index, flags, onCite, onFlag, onEdit, onRegenerate, regenerating }: {
  section: Section; index: number; flags: Flag[];
  onCite: (c: Citation) => void; onFlag: (st: Statement, section: Section) => void;
  onEdit: (section: Section, flag?: Flag) => void; onRegenerate: (section: Section, flag?: Flag) => void; regenerating: boolean;
}) {
  const termNames = section.terms.map((t) => t.term);
  const status = sectionStatusLabel(section.status);
  const tone = (["yellow", "green", "pink"] as const)[index % 3];
  const flag = (st: Statement) => onFlag(st, section);
  const lead = section.terms[0];

  return (
    <article id={`section-${section.id}`} className="paper-lined relative rounded-2xl border border-[hsl(var(--border))] py-7 pl-[64px] pr-5 shadow-[0_18px_30px_-26px_hsl(228_40%_20%/0.5)] md:pr-8 rise" data-testid={`section-${section.id}`}>
      <span className="hand absolute left-3 top-6 grid h-9 w-9 place-items-center rounded-full border-2 border-[hsl(var(--ink))] bg-[hsl(var(--card))] text-xl font-bold">{index + 1}</span>
      <div className="flex flex-wrap items-start gap-3">
        <h2 className="hand text-[38px] font-bold leading-[0.95] text-[hsl(var(--ink))] md:text-[44px]">
          <span className={cn("marker-underline", tone !== "yellow" && tone)}>{section.title}</span>
        </h2>
        {status && <span className={cn("mt-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold", status.cls)} data-testid={`status-section-${section.id}`}>{status.label}</span>}
      </div>
      <div className="mt-3 text-[16.5px] italic leading-8 text-[hsl(var(--ink)/0.85)]">
        <StatementLine st={section.summary} terms={[]} onCite={onCite} onFlag={flag} />
      </div>

      <div className={cn("mt-4 grid min-w-0 gap-6", section.diagram.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]")}>
        <ol className="min-w-0 space-y-1">
          {section.points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[16px] leading-8">
              <span className="hand mt-[1px] w-5 shrink-0 text-2xl font-bold text-[hsl(var(--pen-blue))]">{i + 1}.</span>
              <div className="min-w-0 flex-1"><StatementLine st={p} terms={termNames} onCite={onCite} onFlag={flag} /></div>
            </li>
          ))}
          {section.points.length === 0 && <li className="text-sm text-[hsl(var(--muted-foreground))]">No main points could be tied to your sources for this section.</li>}
        </ol>

        {section.diagram.length > 0 && (
          <figure className="self-start" data-testid={`diagram-${section.id}`}>
            <figcaption className="hand mb-1 text-xl font-bold text-[hsl(var(--pen-blue))]">sketch</figcaption>
            <div className="flex flex-col items-stretch">
              {section.diagram.map((d, i) => (
                <div key={i} className="flex flex-col items-center">
                  {i > 0 && (
                    <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden className="text-[hsl(var(--ink)/0.7)]">
                      <path d="M12 2c-1 7 1 13 0 20M6 16l6 7 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  <div className={cn("sketch-box w-full bg-[hsl(var(--card))] px-3 py-2 text-center text-[14px] leading-snug", i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]")}>
                    {d.text}
                    <Cite c={d.citation} onOpen={onCite} />
                  </div>
                </div>
              ))}
            </div>
          </figure>
        )}
      </div>

      {lead && (
        <aside className="callout mt-6 bg-[hsl(var(--card))] p-4 md:max-w-[85%]">
          <p className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Definition</p>
          <p className="mt-1 text-[16px]"><mark className="hl-g font-bold text-inherit">{lead.term}</mark> {lead.definition}<Cite c={lead.citation} onOpen={onCite} /></p>
          {section.terms.length > 1 && (
            <ul className="mt-2 space-y-1 text-[14.5px]">
              {section.terms.slice(1).map((t, i) => (
                <li key={i} className="flex gap-2">
                  <Hash className="mt-1 h-3.5 w-3.5 shrink-0 text-[hsl(var(--pen-blue))]" />
                  <span><b>{t.term}</b>: {t.definition}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {section.terms.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {section.terms.map((t, i) => <TermCard key={i} term={t} i={i + index} onCite={onCite} />)}
        </div>
      )}

      {flags.length > 0 && (
        <div className="mt-7 space-y-2">
          {flags.map((f) => (
            <div key={f.id} className="rounded-xl border-l-4 border-[hsl(var(--pen-red))] bg-[hsl(4_80%_97%)] p-3 text-sm" data-testid={`flag-${f.id}`}>
              <div className="flex flex-wrap items-center gap-2">
                <FlagIcon className="h-3.5 w-3.5 text-[hsl(var(--pen-red))]" />
                <span className="font-bold">Flag · {f.status}</span>
                <span className="mono text-[11px] text-[hsl(var(--muted-foreground))]">{f.citation.locator}</span>
              </div>
              <p className="mt-1 italic">"{f.highlightedText}"</p>
              {f.note && <p className="mt-1 text-[hsl(var(--muted-foreground))]">Note: {f.note}</p>}
              {f.after && <p className="mt-1 text-[hsl(var(--muted-foreground))]">Fixed. Before: <s>{f.before}</s></p>}
              {!f.after && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="ghost-btn !py-1 text-xs" onClick={() => onEdit(section, f)} data-testid={`button-fix-edit-${f.id}`}><PencilLine className="h-3 w-3" /> Edit it myself</button>
                  <button className="ghost-btn !py-1 text-xs" disabled={regenerating} onClick={() => onRegenerate(section, f)} data-testid={`button-fix-regen-${f.id}`}><RefreshCw className="h-3 w-3" /> Regenerate section</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-[hsl(var(--ink)/0.15)] pt-4">
        <button className="ghost-btn !py-1.5 text-sm" onClick={() => onEdit(section)} data-testid={`button-edit-section-${section.id}`}><PencilLine className="h-3.5 w-3.5" /> Edit section</button>
        <button className="ghost-btn !py-1.5 text-sm" disabled={regenerating} onClick={() => onRegenerate(section)} data-testid={`button-regen-section-${section.id}`}>
          <RefreshCw className={cn("h-3.5 w-3.5", regenerating && "animate-spin")} /> {regenerating ? "Regenerating..." : "Regenerate"}
        </button>
        <span className="ml-auto hidden items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] sm:flex"><FileText className="h-3 w-3" /> hover any sentence to flag it</span>
      </div>
    </article>
  );
}

export function sectionAsText(s: Section): string {
  return [s.summary.text, "", ...s.points.map((p) => `- ${p.text}`)].join("\n");
}
