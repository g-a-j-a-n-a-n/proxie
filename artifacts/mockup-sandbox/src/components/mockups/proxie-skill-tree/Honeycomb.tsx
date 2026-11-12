import "./_group.css";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, BookOpen, Check, ChevronRight, CircleHelp, LockKeyhole, Play, Sparkles, X } from "lucide-react";

type Level = "Locked" | "Unlocked" | "Practicing" | "Mastered";
type Topic = {
  id: string;
  name: string;
  tier: number;
  level: Level;
  correctSessions: number;
  lastReviewed: string;
  prerequisites: string[];
  quote: string;
  source: string;
  sourceDetail: string;
  focus: string;
  quizQuestion: string;
  quizChoices: string[];
};

const initialTopics: Topic[] = [
  { id: "lab", name: "Lab safety basics", tier: 0, level: "Mastered", correctSessions: 4, lastReviewed: "Yesterday", prerequisites: [], quote: "Always wear eye protection when handling cultures.", source: "Lecture 01 · slide 2", sourceDetail: "Foundations of cell biology · uploaded Sep 8", focus: "Recognize essential precautions before working with specimens.", quizQuestion: "Before handling a culture, what should you do first?", quizChoices: ["Put on eye protection.", "Remove gloves to improve dexterity.", "Open the culture near other samples."] },
  { id: "cells", name: "Cell structure", tier: 1, level: "Practicing", correctSessions: 2, lastReviewed: "2 days ago", prerequisites: ["lab"], quote: "The cell membrane controls what enters and leaves the cell.", source: "Lecture 02 · slide 8", sourceDetail: "Cells, tissues & microscopy · uploaded Sep 12", focus: "Identify the jobs of the major cell structures.", quizQuestion: "Which statement best describes the cell membrane?", quizChoices: ["It controls what enters and leaves the cell.", "It makes energy directly from sunlight.", "It stores all genetic instructions for the organism."] },
  { id: "energy", name: "Energy transfer", tier: 1, level: "Unlocked", correctSessions: 0, lastReviewed: "Not yet reviewed", prerequisites: ["lab"], quote: "Cells transfer energy through a series of reactions.", source: "Lecture 03 · slide 12", sourceDetail: "Energy in living systems · uploaded Sep 18", focus: "Follow how cells capture and use energy.", quizQuestion: "How is energy transferred through cellular processes?", quizChoices: ["Through a series of chemical reactions.", "By creating energy from nothing in one step.", "Only by moving water across the membrane."] },
  { id: "membrane", name: "Membrane transport", tier: 2, level: "Locked", correctSessions: 0, lastReviewed: "Not yet reviewed", prerequisites: ["cells"], quote: "Active transport requires energy to move molecules.", source: "Lecture 04 · slide 14", sourceDetail: "The cell membrane · uploaded Sep 21", focus: "Compare passive and active transport.", quizQuestion: "What distinguishes active transport from passive transport?", quizChoices: ["It uses energy to move molecules.", "It always moves water down its concentration gradient.", "It happens only outside the cell."] },
  { id: "respiration", name: "Cellular respiration", tier: 2, level: "Locked", correctSessions: 0, lastReviewed: "Not yet reviewed", prerequisites: ["energy"], quote: "Glucose is broken down to release usable energy.", source: "Lecture 05 · slide 19", sourceDetail: "Cellular respiration · uploaded Sep 26", focus: "Trace how glucose becomes usable cellular energy.", quizQuestion: "What is a key purpose of cellular respiration?", quizChoices: ["Releasing usable energy from glucose.", "Storing light in chlorophyll.", "Building the cell wall from proteins."] },
  { id: "photosynthesis", name: "Photosynthesis", tier: 2, level: "Locked", correctSessions: 0, lastReviewed: "Not yet reviewed", prerequisites: ["energy"], quote: "Light energy is stored in chemical bonds.", source: "Lecture 06 · slide 22", sourceDetail: "Photosynthesis · uploaded Oct 1", focus: "Connect light capture with stored chemical energy.", quizQuestion: "What happens to light energy during photosynthesis?", quizChoices: ["It is stored in chemical bonds.", "It is released by breaking down glucose.", "It passes unchanged through the cell."] },
  { id: "synthesis", name: "Putting it together", tier: 3, level: "Locked", correctSessions: 0, lastReviewed: "Not yet reviewed", prerequisites: ["respiration", "photosynthesis"], quote: "Cell processes work together to keep an organism alive.", source: "Lecture 07 · slide 28", sourceDetail: "A whole-cell view · uploaded Oct 6", focus: "Explain how cell processes work together.", quizQuestion: "How do photosynthesis and respiration relate in a cell system?", quizChoices: ["Their linked processes move and transform energy.", "They are the same reaction running in reverse at all times.", "Neither process depends on molecules from the other."] },
];

const levelTone: Record<Level, { color: string; soft: string; label: string; detail: string }> = {
  Mastered: { color: "#4e795c", soft: "#e1eddf", label: "Mastered", detail: "Strong across spaced quiz sessions" },
  Practicing: { color: "#bf842f", soft: "#f7edcf", label: "Practicing", detail: "Building recall through review" },
  Unlocked: { color: "#557d9a", soft: "#e3edf2", label: "Ready to explore", detail: "Prerequisites are in place" },
  Locked: { color: "#848474", soft: "#eeece3", label: "Not unlocked yet", detail: "Master the earlier topics first" },
};

function topicById(topics: Topic[], id: string) {
  return topics.find((topic) => topic.id === id);
}

export function Honeycomb() {
  const [topics, setTopics] = useState(initialTopics);
  const [selectedId, setSelectedId] = useState("cells");
  const [quizOpen, setQuizOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [earnedXP, setEarnedXP] = useState(420);
  const selected = topicById(topics, selectedId) ?? topics[0];
  const mastered = topics.filter((topic) => topic.level === "Mastered").length;
  const progress = Math.round((mastered / topics.length) * 100);
  const tiers = useMemo(() => [0, 1, 2, 3].map((tier) => topics.filter((topic) => topic.tier === tier)), [topics]);
  const prerequisites = selected.prerequisites.map((id) => topicById(topics, id)).filter((topic): topic is Topic => Boolean(topic));
  const nextSteps = topics.filter((topic) => topic.prerequisites.includes(selected.id));

  function startQuiz() {
    if (selected.level === "Locked") {
      setNotice("This topic opens when its prerequisites are mastered.");
      return;
    }
    setAnswer(null);
    setNotice("");
    setQuizOpen(true);
  }

  function submitAnswer(index: number) {
    if (answer !== null) return;
    setAnswer(index);
    const correct = index === 0;
    if (!correct) {
      setNotice("No XP this time. Revisit the cited lecture note, then try again.");
      return;
    }
    setEarnedXP((xp) => xp + 20);
    setTopics((current) => {
      const revised = current.map((topic) => {
        if (topic.id !== selected.id) return topic;
        const sessions = topic.correctSessions + 1;
        return { ...topic, correctSessions: sessions, level: sessions >= 4 ? "Mastered" as const : "Practicing" as const, lastReviewed: "Just now" };
      });
      const masteredNow = revised.find((topic) => topic.id === selected.id)?.level === "Mastered";
      if (masteredNow) {
        return revised.map((topic) => topic.level === "Locked" && topic.prerequisites.every((id) => revised.find((item) => item.id === id)?.level === "Mastered")
          ? { ...topic, level: "Unlocked" as const }
          : topic);
      }
      return revised;
    });
    setNotice("Correct. +20 XP earned from this quiz answer.");
  }

  return (
    <main className="hc-page">
      <style>{`
        .hc-page{--hc-ink:#28343a;--hc-muted:#738078;--hc-paper:#f7f5ec;--hc-card:#fffdf5;--hc-line:#dedbcc;--hc-green:#4e795c;--hc-gold:#c38b37;min-height:100vh;background:radial-gradient(ellipse at 17% 0%,#eef0df 0%,transparent 38%),var(--hc-paper);color:var(--hc-ink);padding:26px clamp(16px,4vw,54px) 48px;font-family:var(--app-font-sans,system-ui,sans-serif)}
        .hc-wrap{max-width:1320px;margin:0 auto}.hc-back{border:0;background:none;color:var(--hc-muted);font:700 13px inherit;display:flex;align-items:center;gap:7px;padding:4px 0;cursor:pointer}.hc-heading{display:flex;align-items:flex-end;gap:18px;margin-top:22px}.hc-mark{width:12px;height:38px;border-radius:10px;background:#648669;box-shadow:5px 5px 0 #dce5d1;flex:none}.hc-title{font:700 clamp(32px,5vw,54px)/.98 "Caveat",cursive;letter-spacing:.01em;margin:0;color:#29363a}.hc-sub{font-size:13px;color:var(--hc-muted);margin:11px 0 0}.hc-xp{margin-left:auto;background:#f0e4bd;border:1px solid #ddc98d;border-radius:18px;padding:12px 16px;min-width:145px}.hc-xp strong{font:700 22px "JetBrains Mono",monospace;color:#624b22}.hc-xp span{display:block;color:#776648;font-size:11px;margin-top:3px}.hc-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:22px;margin-top:26px;align-items:start}.hc-map{background-color:#fbfaf3;background-image:radial-gradient(#cfd4c3 0.8px,transparent .8px);background-size:19px 19px;border:1px solid var(--hc-line);border-radius:24px;padding:22px clamp(12px,2.5vw,32px) 20px;box-shadow:0 8px 25px #45492d0c;overflow:hidden}.hc-map-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:1px 4px 16px;border-bottom:1px solid #e5e2d6}.hc-map-head strong{font-size:14px}.hc-map-head span{font:11px "JetBrains Mono",monospace;color:var(--hc-muted)}.hc-tier{padding:16px 0 0;text-align:center}.hc-tier-label{font:10px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.13em;color:#8a8b7b;margin:0 0 9px}.hc-nodes{display:flex;justify-content:center;align-items:center;gap:clamp(4px,2.2vw,26px)}.hc-node{position:relative;width:clamp(132px,17vw,192px);height:clamp(128px,16vw,177px);border:0;background:transparent;clip-path:polygon(25% 3%,75% 3%,99% 50%,75% 97%,25% 97%,1% 50%);padding:2px;cursor:pointer;transition:transform .18s;filter:drop-shadow(0 3px 3px #3332)}.hc-node:hover{transform:translateY(-3px)}.hc-node:focus-visible{outline:3px solid #354e4b;outline-offset:3px}.hc-node-inner{height:100%;width:100%;clip-path:polygon(25% 3%,75% 3%,99% 50%,75% 97%,25% 97%,1% 50%);background:var(--node-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:19px 24px;text-align:center;border:0}.hc-node.selected .hc-node-inner{background:#edf0df}.hc-node.locked{opacity:.79}.hc-node-title{font-weight:700;font-size:clamp(11px,1.1vw,14px);line-height:1.17;max-width:135px}.hc-node-status{font:9px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.08em;margin-top:7px;color:var(--node-color)}.hc-node-count{font-size:10px;color:#787c70;margin-top:5px}.hc-node-icon{height:25px;width:25px;border-radius:50%;display:grid;place-items:center;background:var(--node-color);color:#fff;margin-bottom:7px}.hc-connector{display:flex;justify-content:center;color:#a8ab96;height:19px;align-items:center}.hc-legend{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;border-top:1px dashed #d7d5ca;padding-top:14px;margin-top:17px;color:#6d786f;font-size:11px}.hc-legend span{display:flex;align-items:center;gap:6px}.hc-dot{width:9px;height:9px;border-radius:50%;display:inline-block}.hc-side{display:flex;flex-direction:column;gap:13px}.hc-detail,.hc-progress{border:1px solid var(--hc-line);background:var(--hc-card);border-radius:19px;padding:18px;box-shadow:0 6px 18px #4d4b3408}.hc-detail-kicker{font:10px "JetBrains Mono",monospace;text-transform:uppercase;letter-spacing:.12em;color:#828779}.hc-detail h2{font:700 29px/1.02 "Caveat",cursive;margin:8px 0}.hc-badge{display:inline-flex;border-radius:99px;padding:5px 10px;font-size:11px;font-weight:700}.hc-detail-copy{font-size:12px;line-height:1.5;color:#626f67;margin:13px 0}.hc-source{border-left:3px solid #d5bf79;background:#f7f3e4;padding:10px 11px;margin:12px 0;border-radius:0 9px 9px 0}.hc-source-label{font:10px "JetBrains Mono",monospace;color:#7b704f}.hc-quote{font-size:12px;line-height:1.5;font-style:italic;margin:6px 0 0;color:#4f5b55}.hc-prereq{font-size:11px;color:#6f786e;margin:13px 0 0}.hc-prereq strong{color:#404d46}.hc-next{font-size:11px;color:#6f786e;margin-top:7px}.hc-buttons{display:flex;gap:8px;margin-top:14px}.hc-button{border:0;border-radius:99px;padding:10px 14px;font:700 12px inherit;display:inline-flex;align-items:center;gap:7px;cursor:pointer}.hc-button.primary{background:#354f56;color:#fff}.hc-button.primary:disabled{opacity:.45;cursor:not-allowed}.hc-button.subtle{background:#eeeadd;color:#59665c}.hc-progress-title{display:flex;gap:8px;align-items:center;font-weight:700;font-size:13px}.hc-progress-numbers{display:flex;justify-content:space-between;align-items:baseline;margin-top:13px}.hc-progress-numbers strong{font:700 20px "JetBrains Mono",monospace}.hc-progress-numbers span{font-size:11px;color:#798176}.hc-bar{height:9px;background:#e9e7db;border-radius:20px;overflow:hidden;margin-top:9px}.hc-bar span{height:100%;display:block;background:linear-gradient(90deg,#738f67,#a7b782);border-radius:inherit;transition:width .3s}.hc-progress-note{font-size:11px;color:#7a8176;margin:10px 0 0;line-height:1.4}.hc-modal-backdrop{position:fixed;inset:0;background:#222d2d88;display:grid;place-items:center;padding:18px;z-index:20}.hc-modal{width:min(480px,100%);background:#fbfaf2;border:1px solid #ded9c7;border-radius:22px;padding:22px;box-shadow:0 24px 70px #17242344}.hc-modal-top{display:flex;justify-content:space-between;align-items:start}.hc-modal-top h3{font:700 30px "Caveat",cursive;margin:0}.hc-close{border:0;background:#eeece1;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;cursor:pointer}.hc-question{font-size:15px;line-height:1.45;margin:18px 0 12px}.hc-choice{width:100%;text-align:left;border:1px solid #dcd9cd;background:#fffdf6;border-radius:12px;padding:12px;margin-top:8px;color:#35423d;cursor:pointer;font:13px inherit}.hc-choice:hover{border-color:#819579}.hc-choice.correct{border-color:#5f8968;background:#e7f0e4}.hc-choice.wrong{border-color:#bd7866;background:#f8e8df}.hc-feedback{margin:14px 0 0;font-size:12px;line-height:1.5;color:#59695f}.hc-notice{background:#f3f0e4;padding:9px 11px;border-radius:10px;color:#637064;font-size:11px;line-height:1.4;margin:12px 0 0}.hc-disclaimer{font:10px "JetBrains Mono",monospace;letter-spacing:.025em;color:#8a897b;margin:14px 0 0}.hc-footer{display:flex;justify-content:space-between;gap:12px;margin-top:14px;font-size:11px;color:#7a8176}.hc-footer strong{color:#58665a}
        @media(max-width:920px){.hc-layout{grid-template-columns:minmax(0,1fr) 280px;gap:14px}.hc-map{padding:18px 10px}.hc-side .hc-detail,.hc-progress{padding:15px}}
        @media(max-width:700px){.hc-page{padding:18px 14px 32px}.hc-heading{align-items:center;gap:12px;margin-top:18px}.hc-mark{height:32px}.hc-title{font-size:39px}.hc-sub{font-size:11px;line-height:1.4;max-width:265px}.hc-xp{min-width:auto;padding:9px 11px}.hc-xp strong{font-size:16px}.hc-xp span{font-size:9px}.hc-layout{grid-template-columns:1fr;margin-top:18px}.hc-map{padding:14px 7px;border-radius:18px}.hc-tier{padding-top:12px}.hc-nodes{gap:0}.hc-node{width:min(42vw,168px);height:min(41vw,159px)}.hc-node-inner{padding:15px 20px}.hc-node-title{font-size:11px}.hc-node-status{font-size:8px}.hc-node-count{font-size:9px}.hc-legend{gap:9px;font-size:10px}.hc-footer{flex-direction:column}.hc-detail h2{font-size:32px}}
        @media(prefers-reduced-motion:reduce){.hc-node,.hc-bar span{transition:none}}
      `}</style>
      <div className="hc-wrap">
        <button className="hc-back" type="button" onClick={() => setNotice("You’re viewing BIO 142 · Cell Biology.")}><ArrowLeft size={15} /> Courses</button>
        <header className="hc-heading">
          <span className="hc-mark" />
          <div>
            <h1 className="hc-title">BIO 142: Cell Biology</h1>
            <p className="hc-sub">A map of what you know, and what’s ready to click into next.</p>
          </div>
          <div className="hc-xp" aria-label={`${earnedXP} quiz XP earned`}>
            <strong>{earnedXP} XP</strong><span>earned from quizzes</span>
          </div>
        </header>

        <div className="hc-layout">
          <section className="hc-map" aria-label="Course skill tree">
            <div className="hc-map-head"><strong>Cell biology skill path</strong><span>{mastered} / {topics.length} mastered</span></div>
            {tiers.map((group, tier) => group.length > 0 && (
              <div className="hc-tier" key={tier}>
                {tier > 0 && <div className="hc-connector" aria-hidden="true"><ArrowDown size={17} /></div>}
                <p className="hc-tier-label">{["Starting point", "Build the foundations", "Go deeper", "Bring it together"][tier]}</p>
                <div className="hc-nodes">
                  {group.map((topic) => {
                    const tone = levelTone[topic.level];
                    const isSelected = selected.id === topic.id;
                    return (
                      <button key={topic.id} type="button" onClick={() => { setSelectedId(topic.id); setNotice(""); }} aria-pressed={isSelected} aria-label={`${topic.name}, ${tone.label}`} className={`hc-node ${isSelected ? "selected" : ""} ${topic.level === "Locked" ? "locked" : ""}`} style={{ "--node-bg": isSelected ? "#edf0df" : "#fffdf5", "--node-color": tone.color } as React.CSSProperties}>
                        <span className="hc-node-inner">
                          <span className="hc-node-icon">{topic.level === "Mastered" ? <Check size={15} /> : topic.level === "Locked" ? <LockKeyhole size={13} /> : <span style={{ font: "700 11px 'JetBrains Mono',monospace" }}>{topic.correctSessions || "·"}</span>}</span>
                          <span className="hc-node-title">{topic.name}</span>
                          <span className="hc-node-status">{tone.label}</span>
                          {topic.level === "Practicing" && <span className="hc-node-count">{topic.correctSessions} / 4 correct sessions</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="hc-legend">
              {(["Mastered", "Practicing", "Unlocked", "Locked"] as Level[]).map((level) => <span key={level}><i className="hc-dot" style={{ background: levelTone[level].color }} />{levelTone[level].label}</span>)}
            </div>
            <div className="hc-footer"><span><strong>Progress is for learning, not grading.</strong> XP comes from quiz answers only.</span><span>Each hex is linked to lecture notes.</span></div>
          </section>

          <aside className="hc-side">
            <section className="hc-detail">
              <div className="hc-detail-kicker">Topic details</div>
              <h2>{selected.name}</h2>
              <span className="hc-badge" style={{ background: levelTone[selected.level].soft, color: levelTone[selected.level].color }}>{levelTone[selected.level].label}</span>
              <p className="hc-detail-copy">{selected.focus}</p>
              <div className="hc-source">
                <div className="hc-source-label"><BookOpen size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />SOURCE · {selected.source}</div>
                <p className="hc-quote">“{selected.quote}”</p>
                <div className="hc-source-label" style={{ marginTop: 7 }}>{selected.sourceDetail}</div>
              </div>
              {prerequisites.length > 0 && <p className="hc-prereq">Builds on: <strong>{prerequisites.map((topic) => topic.name).join(" + ")}</strong> · {prerequisites.every((topic) => topic.level === "Mastered") ? "complete" : "master these to unlock"}</p>}
              {nextSteps.length > 0 && <p className="hc-next" style={{ display: "flex", alignItems: "flex-start", gap: 4 }}><ChevronRight size={13} style={{ flex: "none", marginTop: 1 }} /><span>Opens the path to {nextSteps.map((topic) => topic.name).join(" and ")}</span></p>}
              <div className="hc-footer" style={{ marginTop: 12 }}><span>{selected.correctSessions} correct quiz sessions</span><span>Last reviewed: {selected.lastReviewed}</span></div>
              <div className="hc-buttons">
                <button className="hc-button primary" type="button" onClick={startQuiz} disabled={selected.level === "Locked"}><Play size={14} /> Review quiz</button>
                {selected.level === "Locked" && <button className="hc-button subtle" type="button" onClick={() => setNotice(`First master ${prerequisites.map((topic) => topic.name).join(" and ")} to open this topic.`)}><CircleHelp size={14} /> Why locked?</button>}
              </div>
              {notice && !quizOpen && <p className="hc-notice" role="status">{notice}</p>}
            </section>

            <section className="hc-progress">
              <div className="hc-progress-title"><Sparkles size={15} color="#9a7838" /> Course progress</div>
              <div className="hc-progress-numbers"><strong>{mastered} <span style={{ font: "inherit", color: "#8b8d7e" }}>/ {topics.length}</span></strong><span>{progress}% mastered</span></div>
              <div className="hc-bar" role="progressbar" aria-label="Topics mastered" aria-valuenow={mastered} aria-valuemin={0} aria-valuemax={topics.length}><span style={{ width: `${progress}%` }} /></div>
              <p className="hc-progress-note">Mastery follows repeated correct answers across sessions. This is a study signal, not a course grade.</p>
            </section>
          </aside>
        </div>
      </div>

      {quizOpen && <div className="hc-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setQuizOpen(false); }}>
        <section className="hc-modal" role="dialog" aria-modal="true" aria-labelledby="hc-quiz-title">
          <div className="hc-modal-top"><div><div className="hc-detail-kicker">Quick recall · {selected.source}</div><h3 id="hc-quiz-title">{selected.name}</h3></div><button type="button" className="hc-close" aria-label="Close quiz" onClick={() => setQuizOpen(false)}><X size={16} /></button></div>
          <p className="hc-question">{selected.quizQuestion}</p>
          {selected.quizChoices.map((choice, index) => <button key={choice} type="button" onClick={() => submitAnswer(index)} disabled={answer !== null} className={`hc-choice ${answer !== null && index === 0 ? "correct" : answer === index ? "wrong" : ""}`}>{choice}</button>)}
          {answer !== null && <p className="hc-feedback" role="status">{answer === 0 ? "Right. This answer adds 20 XP and counts toward spaced mastery." : "Not quite. Take another look at the source note. No XP was added."}</p>}
          <p className="hc-disclaimer">XP reflects quiz practice, not a grade or mastery score.</p>
          <div className="hc-buttons" style={{ justifyContent: "flex-end" }}>
            {answer !== null && <button type="button" className="hc-button primary" onClick={() => { setQuizOpen(false); setAnswer(null); }}>Back to the map</button>}
          </div>
        </section>
      </div>}
    </main>
  );
}
