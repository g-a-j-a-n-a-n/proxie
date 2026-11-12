import "./_group.css";
import { useState } from "react";
import { Check, ChevronLeft, Lock, Play, Sparkles } from "lucide-react";

type Level = "Locked" | "Unlocked" | "Practicing" | "Mastered";
type Topic = { id: string; name: string; level: Level; position: number; tier: number; correctSessions: number; lastReviewed: string; prerequisites: string[]; quote: string; source: string };

const levels: Record<Level, { label: string; tone: string; dot: string; blurb: string }> = {
  Locked: { label: "Locked", tone: "bg-[hsl(42_30%_88%)] text-[hsl(228_15%_42%)]", dot: "hsl(228 12% 62%)", blurb: "Prerequisites still ahead" },
  Unlocked: { label: "Unlocked", tone: "bg-[hsl(208_70%_90%)] text-[hsl(226_60%_30%)]", dot: "hsl(226 60% 46%)", blurb: "Ready to start" },
  Practicing: { label: "Practicing", tone: "bg-[hsl(52_96%_80%)] text-[hsl(35_70%_25%)]", dot: "hsl(42 92% 48%)", blurb: "Getting there with review" },
  Mastered: { label: "Mastered", tone: "bg-[hsl(92_62%_80%)] text-[hsl(140_45%_20%)]", dot: "hsl(110 50% 38%)", blurb: "Correct across spaced sessions" },
};

const topics: Topic[] = [
  { id: "lab", name: "Lab safety basics", level: "Mastered", position: 0, tier: 0, correctSessions: 4, lastReviewed: "yesterday", prerequisites: [], quote: "Always wear eye protection when handling cultures.", source: "Slide 2" },
  { id: "cells", name: "Cell structure", level: "Practicing", position: 1, tier: 1, correctSessions: 2, lastReviewed: "2 days ago", prerequisites: ["lab"], quote: "The cell membrane controls what enters and leaves the cell.", source: "Slide 8" },
  { id: "energy", name: "Energy transfer", level: "Unlocked", position: 2, tier: 1, correctSessions: 0, lastReviewed: "never", prerequisites: ["lab"], quote: "Cells transfer energy through a series of reactions.", source: "Slide 12" },
  { id: "membrane", name: "Membrane transport", level: "Locked", position: 3, tier: 1, correctSessions: 0, lastReviewed: "never", prerequisites: ["cells"], quote: "Active transport requires energy to move molecules.", source: "Slide 14" },
  { id: "respiration", name: "Cellular respiration", level: "Locked", position: 4, tier: 2, correctSessions: 0, lastReviewed: "never", prerequisites: ["energy"], quote: "Glucose is broken down to release usable energy.", source: "Slide 19" },
  { id: "photosynthesis", name: "Photosynthesis", level: "Locked", position: 5, tier: 2, correctSessions: 0, lastReviewed: "never", prerequisites: ["energy"], quote: "Light energy is stored in chemical bonds.", source: "Slide 22" },
  { id: "synthesis", name: "Putting it together", level: "Locked", position: 6, tier: 3, correctSessions: 0, lastReviewed: "never", prerequisites: ["respiration", "photosynthesis"], quote: "Cell processes work together to keep an organism alive.", source: "Slide 28" },
];

export function Current() {
  const [selectedId, setSelectedId] = useState("cells");
  const [notice, setNotice] = useState("");
  const selected = topics.find((topic) => topic.id === selectedId) ?? topics[0]!;
  const mastered = topics.filter((topic) => topic.level === "Mastered").length;
  const tiers = [0, 1, 2, 3];

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-8 py-6">
      <button className="mb-4 flex items-center gap-1 text-sm font-bold text-[hsl(var(--muted-foreground))]"><ChevronLeft size={16} /> All courses</button>
      <header className="flex flex-wrap items-start gap-5">
        <span className="mt-4 h-5 w-5 rounded-full bg-[#4f8a63]" />
        <div className="min-w-64 flex-1">
          <h1 className="hand text-6xl font-bold leading-none text-[hsl(var(--ink))]">BIO 142: Cell Biology</h1>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
            Based on 18 quiz answers · 420 XP · not an official grade
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-[hsl(var(--pen-blue))] px-5 py-3 font-bold text-white">
          <Play size={16} /> Review quiz
        </button>
      </header>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="paper-grid rounded-2xl border border-[hsl(var(--border))] p-5 md:p-7">
          {tiers.map((tier) => {
            const tierTopics = topics.filter((topic) => topic.tier === tier);
            if (!tierTopics.length) return null;
            return (
              <div key={tier} className="mb-3">
                {tier > 0 && (
                  <svg className="mx-auto block h-7 w-16 text-[hsl(var(--ink)/0.45)]" viewBox="0 0 64 32" aria-hidden>
                    <path d="M32 2c-2 9 2 16 0 26M24 20l8 9 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">
                  {tier === 0 ? "Foundations" : `Builds on tier ${tier}`}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tierTopics.map((topic) => {
                    const color = levels[topic.level];
                    return (
                      <button key={topic.id} onClick={() => setSelectedId(topic.id)} data-testid={`node-topic-${topic.id}`}
                        className={`pop relative rounded-2xl border-2 bg-[hsl(var(--card))] p-3.5 text-left transition-transform hover:-translate-y-0.5 ${selected.id === topic.id ? "border-[hsl(var(--ink))] shadow-[4px_4px_0_hsl(var(--hl-yellow))]" : "border-[hsl(var(--border))]"} ${topic.level === "Locked" ? "opacity-75" : ""}`}>
                        <span className="flex items-center gap-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white" style={{ background: color.dot }}>
                            {topic.level === "Locked" ? <Lock size={13} /> : topic.level === "Mastered" ? <Check size={16} /> : <span className="hand text-lg font-bold">{topic.position + 1}</span>}
                          </span>
                          <span className="font-bold leading-tight">{topic.name}</span>
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color.tone}`}>{color.label}</span>
                          {topic.prerequisites.length > 0 && <span className="text-[11px] text-[hsl(var(--muted-foreground))]">after {topic.prerequisites.map((id) => topics.find((item) => item.id === id)?.name ?? "removed topic").join(", ")}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-dashed border-[hsl(var(--ink)/0.15)] pt-4 text-xs text-[hsl(var(--muted-foreground))]">
            {Object.values(levels).map((level) => <span key={level.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: level.dot }} />{level.label}: {level.blurb}</span>)}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <p className="hand text-3xl font-bold">{selected.name}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${levels[selected.level].tone}`}>{levels[selected.level].label}</span>
            <p className="mt-4 text-sm">From {selected.source}</p>
            <p className="mt-1 text-sm italic text-[hsl(var(--muted-foreground))]">“{selected.quote}”</p>
            <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">{selected.correctSessions} correct session{selected.correctSessions === 1 ? "" : "s"} · last review {selected.lastReviewed}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => setNotice(selected.level === "Locked" ? "Practice the earlier topics to unlock this one." : `Review started: ${selected.name}`)}
                disabled={selected.level === "Locked"}
                className="flex items-center gap-2 rounded-full bg-[hsl(var(--pen-blue))] px-4 py-2 text-sm font-bold text-white disabled:opacity-40">
                <Play size={14} /> Review
              </button>
              <button className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-bold" onClick={() => setNotice(`Edit ${selected.name}`)}>Edit</button>
              <button className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm font-bold" onClick={() => setNotice(`Remove ${selected.name}`)}>Remove</button>
            </div>
            {notice && <p className="mt-2 text-xs font-semibold text-[hsl(var(--pen-blue))]" role="status">{notice}</p>}
          </div>
          <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <p className="flex items-center gap-2 font-bold"><Sparkles size={16} /> Course progress</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{mastered} of {topics.length} topics mastered</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full w-[14%] rounded-full bg-[hsl(var(--hl-green))]" /></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
