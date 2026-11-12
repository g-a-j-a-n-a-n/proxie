import { BookOpen, Check, Flag, Hexagon, LockKeyhole, Pencil, RefreshCw } from "lucide-react";
import "./landing-feature-showcase.css";

const skills = [
  { name: "Yeast & fermentation", state: "Mastered", tone: "mastered", icon: "check" },
  { name: "Gluten structure", state: "Practicing", tone: "practicing", icon: "2" },
  { name: "Proofing conditions", state: "Unlocked · ready", tone: "unlocked", icon: "1" },
  { name: "Oven spring", state: "Locked", tone: "locked", icon: "lock" },
];

export function LandingFeatureShowcase() {
  return (
    <section className="landing-proof" aria-labelledby="proof-heading">
      <div className="landing-proof-head">
        <p className="mono text-xs uppercase tracking-[0.19em] text-[hsl(var(--pen-red))]">A notebook with a point of view</p>
        <h2 id="proof-heading" className="hand mt-3 max-w-3xl text-[48px] font-bold leading-[.96] md:text-[64px]">
          Not just notes. <span className="marker-underline pink">A way to question them.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[hsl(var(--ink)/.8)]">
          Proxie keeps the source beside the sentence—and turns a course into a learning path that changes as you practice.
        </p>
      </div>

      <div className="landing-proof-grid">
        <article className="proof-paper proof-flag">
          <div className="proof-card-top">
            <h3 className="proof-kicker"><Flag size={14} aria-hidden="true" /> Flag errors, keep context</h3>
            <span className="proof-example">FICTIONAL SAMPLE</span>
          </div>
          <p className="proof-context">Intro to food science · Section: Fermentation</p>

          <div className="proof-quote">
            <p>“Warm water at <span className="proof-questioned">48°C</span> gives yeast its fastest rise.”</p>
            <span className="cite-chip">slide 12</span>
          </div>
          <div className="proof-flag-note">
            <span className="proof-flag-mark"><Flag size={14} /></span>
            <div>
              <p className="proof-note-label">Flagged by student</p>
              <p className="proof-note-copy">The slide says 38°C, not 48°C.</p>
            </div>
          </div>

          <div className="proof-path" aria-label="Available next steps, shown as an illustration">
            <div className="proof-path-step">
              <span className="proof-path-icon"><Pencil size={15} /></span>
              <span><strong>Edit the section</strong><small>Your edit is labeled student-edited, not AI-verified.</small></span>
            </div>
            <div className="proof-path-or">or</div>
            <div className="proof-path-step">
              <span className="proof-path-icon regen"><RefreshCw size={15} /></span>
              <span><strong>Regenerate from sources</strong><small>Ask Proxie to try this section again using its citations.</small></span>
            </div>
          </div>
          <p className="proof-footnote"><BookOpen size={13} /> The flag keeps the sentence and its citation together. It does not automatically detect or fix mistakes.</p>
        </article>

        <article className="proof-paper proof-map">
          <div className="proof-card-top">
            <h3 className="proof-kicker"><Hexagon className="proof-honey-mark" size={16} aria-hidden="true" /> Honeycomb skill tree</h3>
            <span className="proof-example">FICTIONAL SAMPLE</span>
          </div>
          <p className="proof-context">Bread science · sample skill path</p>

          <div className="proof-honeycomb" role="img" aria-label="Illustrative honeycomb map with Yeast and fermentation mastered, Gluten structure practicing, Proofing conditions unlocked and ready, and Oven spring locked.">
            {skills.map((skill) => (
              <div key={skill.name} className={`proof-hex ${skill.tone}`}>
                <span className="proof-hex-icon" aria-hidden="true">
                  {skill.icon === "check" ? <Check size={15} /> : skill.icon === "lock" ? <LockKeyhole size={13} /> : skill.icon}
                </span>
                <strong>{skill.name}</strong>
                <small>{skill.state}</small>
              </div>
            ))}
          </div>

          <div className="proof-map-caption">
            <span className="proof-map-line" aria-hidden="true" />
            <p>Quiz answers and spaced review move topics along—not tapping a hex.</p>
          </div>
          <div className="proof-map-bottom">
            <span><i className="proof-dot dot-ready" /> Ready to explore</span>
            <span><i className="proof-dot dot-practice" /> Practicing</span>
            <span><i className="proof-dot dot-mastered" /> Mastered</span>
            <span><i className="proof-dot dot-locked" /> Locked</span>
          </div>
          <p className="proof-footnote">XP comes from quiz answers. It is a learning signal, never a grade.</p>
        </article>
      </div>
    </section>
  );
}
