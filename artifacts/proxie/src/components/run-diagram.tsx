import { useEffect, useRef, useState } from "react";
import type { RunEvent } from "@workspace/api-client-react";
import { AlertTriangle, ArrowDown, Check, Pause, Play, RotateCcw, Undo2 } from "lucide-react";
import { fmtMs, stepLabel } from "@/lib/proxie";
import { cn } from "@/lib/utils";

const STATUS = {
  ok: { icon: Check, label: "ok", ring: "border-[hsl(var(--ink)/0.8)]", chip: "bg-[hsl(var(--hl-green))] text-[hsl(140_45%_18%)]" },
  failed: { icon: AlertTriangle, label: "failed", ring: "border-[hsl(var(--pen-red))]", chip: "bg-[hsl(4_80%_90%)] text-[hsl(var(--pen-red))]" },
  recovered: { icon: Undo2, label: "recovered", ring: "border-[hsl(42_92%_45%)]", chip: "bg-[hsl(var(--hl-yellow))] text-[hsl(35_70%_22%)]" },
} as const;

type Mode = "live" | "replay";

/** Shows run events as hand-drawn boxes. Live mode reflects real progress; replay slows stored events down for reading. */
export function RunDiagram({ events, running = false, title = "How it works", compact = false }: { events: RunEvent[]; running?: boolean; title?: string; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("live");
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const [shown, setShown] = useState(events.length);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (mode === "live") setShown(events.length);
  }, [events.length, mode]);

  useEffect(() => {
    if (!playing) return;
    if (shown >= events.length) {
      setPlaying(false);
      return;
    }
    const ev = events[shown];
    // Readable pacing based on the real duration, clamped. Replay only — never delays the real run.
    const base = Math.min(Math.max(ev?.durationMs ?? 800, 700), 2600);
    timer.current = window.setTimeout(() => setShown((s) => s + 1), base / speed);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, shown, speed, events]);

  const startReplay = () => {
    setMode("replay");
    setShown(0);
    setPlaying(true);
  };
  const visible = events.slice(0, shown);
  const total = events.reduce((a, e) => a + (e.durationMs || 0), 0);

  return (
    <section className="paper-grid rounded-2xl border border-[hsl(var(--border))] p-4 md:p-5" data-testid="panel-run-diagram">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="hand text-[28px] font-bold leading-none text-[hsl(var(--ink))]">{title}</h3>
        <span className="mono text-[11px] text-[hsl(var(--muted-foreground))]">
          {events.length} step{events.length === 1 ? "" : "s"} · {fmtMs(total)} real time
        </span>
      </div>

      {!running && events.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {mode === "replay" && playing ? (
            <button className="ghost-btn !py-1.5 text-sm" onClick={() => setPlaying(false)} data-testid="button-replay-pause"><Pause className="h-3.5 w-3.5" /> Pause</button>
          ) : mode === "replay" && shown < events.length ? (
            <button className="ghost-btn !py-1.5 text-sm" onClick={() => setPlaying(true)} data-testid="button-replay-resume"><Play className="h-3.5 w-3.5" /> Resume</button>
          ) : (
            <button className="ghost-btn !py-1.5 text-sm" onClick={startReplay} data-testid="button-replay"><Play className="h-3.5 w-3.5" /> Replay</button>
          )}
          {mode === "replay" && (
            <button className="ghost-btn !py-1.5 text-sm" onClick={() => { setPlaying(false); setMode("live"); }} data-testid="button-replay-reset"><RotateCcw className="h-3.5 w-3.5" /> Show all</button>
          )}
          <div className="ml-auto flex rounded-full border border-[hsl(var(--ink)/0.2)] bg-[hsl(var(--card))] p-0.5" role="group" aria-label="Replay speed">
            {([0.5, 1, 2] as const).map((s) => (
              <button key={s} onClick={() => setSpeed(s)} data-testid={`button-speed-${s}`} aria-pressed={speed === s}
                className={cn("mono rounded-full px-2.5 py-1 text-xs transition-colors", speed === s ? "bg-[hsl(var(--pen-blue))] text-[hsl(44_60%_97%)]" : "text-[hsl(var(--muted-foreground))]")}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      )}
      {mode === "replay" && <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Replay is slowed down for reading. Durations shown are the real ones.</p>}

      <ol className={cn("mt-4 space-y-0", compact && "text-sm")} aria-live="polite">
        {events.length === 0 && !running && <li className="text-sm text-[hsl(var(--muted-foreground))]">No steps were recorded for this run.</li>}
        {visible.map((e, i) => {
          const st = STATUS[e.status] ?? STATUS.ok;
          return (
            <li key={`${e.step}-${i}`} className="pop" data-testid={`event-${i}`}>
              {i > 0 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-[hsl(var(--ink)/0.45)]" aria-hidden />}
              <div className={cn("sketch-box relative bg-[hsl(var(--card))] px-3.5 py-2.5", st.ring)}>
                <div className="flex items-center gap-2">
                  <span className="mono grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--ink))] text-[10px] text-[hsl(44_60%_97%)]">{i + 1}</span>
                  <span className="font-bold text-[hsl(var(--ink))]">{stepLabel(e.step)}</span>
                  <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", st.chip)}>
                    <st.icon className="h-3 w-3" /> {st.label}
                  </span>
                </div>
                <p className="mt-1 text-[13.5px] leading-snug text-[hsl(var(--ink)/0.8)]">{e.result}</p>
                <p className="mono mt-0.5 text-[10.5px] text-[hsl(var(--muted-foreground))]">{fmtMs(e.durationMs)}</p>
              </div>
            </li>
          );
        })}
        {running && (
          <li>
            {visible.length > 0 && <ArrowDown className="mx-auto my-0.5 h-4 w-4 text-[hsl(var(--ink)/0.45)]" />}
            <div className="sketch-box flex items-center gap-2 border-dashed bg-[hsl(var(--card)/0.6)] px-3.5 py-3 text-sm text-[hsl(var(--muted-foreground))]" data-testid="status-running">
              <span className="pulse-dot h-2 w-2 rounded-full bg-[hsl(var(--pen-blue))]" /> Working on the next step...
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
