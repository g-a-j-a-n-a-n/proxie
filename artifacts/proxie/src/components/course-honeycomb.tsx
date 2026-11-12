import { useMemo, type CSSProperties, type ReactNode } from "react";
import type { Citation, Course, Topic, TopicLevel } from "@workspace/api-client-react";
import { ArrowDown, BookOpen, Check, ChevronRight, LockKeyhole, Pencil, Play, Sparkles, Trash2 } from "lucide-react";
import { Cite } from "@/components/notebook-parts";
import { EmptyNote } from "@/components/states";
import { LEVELS, relTime, topicDepths } from "@/lib/proxie";
import "./course-honeycomb.css";

const tones: Record<TopicLevel, { color: string; soft: string; label: string }> = {
  Mastered: { color: "#4e795c", soft: "#e1eddf", label: "Mastered" },
  Practicing: { color: "#a66d1f", soft: "#f7edcf", label: "Practicing" },
  Unlocked: { color: "#557d9a", soft: "#e3edf2", label: "Ready to explore" },
  Locked: { color: "#717166", soft: "#eeece3", label: "Not unlocked yet" },
};

type Props = {
  course: Course;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReview: (topic: Topic) => void;
  onEdit: (topic: Topic) => void;
  onRemove: (topic: Topic) => void;
  onCitation: (citation: Citation) => void;
  children?: ReactNode;
};

/** A presentation of server-owned topic levels; it never calculates or awards mastery or XP. */
export function CourseHoneycomb({ course, selectedId, onSelect, onReview, onEdit, onRemove, onCitation, children }: Props) {
  const tiers = useMemo(() => {
    const depths = topicDepths(course.topics);
    const grouped = new Map<number, Topic[]>();
    [...course.topics].sort((a, b) => a.position - b.position).forEach(topic => {
      const depth = depths.get(topic.id) ?? 0;
      grouped.set(depth, [...(grouped.get(depth) ?? []), topic]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a - b);
  }, [course.topics]);
  const selected = course.topics.find(topic => topic.id === selectedId)
    ?? course.topics.find(topic => topic.level === "Practicing" || topic.level === "Unlocked")
    ?? course.topics[0];
  const mastered = course.topics.filter(topic => topic.level === "Mastered").length;
  const progress = course.topics.length ? Math.round(mastered / course.topics.length * 100) : 0;
  const prerequisites = selected ? course.topics.filter(topic => selected.prerequisites.includes(topic.id)) : [];
  const nextSteps = selected ? course.topics.filter(topic => topic.prerequisites.includes(selected.id)) : [];
  const source = selected && course.sources.find(item => item.id === selected.citation.sourceId);

  return (
    <div className="hc-layout">
      <section className="hc-map" aria-label="Course skill tree" data-testid="panel-skill-tree">
        <div className="hc-map-head"><strong>Course skill path</strong><span>{mastered} / {course.topics.length} mastered</span></div>
        {!course.topics.length ? (
          <EmptyNote title="No topics found" body="Proxie couldn't find topic lines in this syllabus. Delete this course and paste a schedule with one topic per line." />
        ) : tiers.map(([depth, group], index) => (
          <div className="hc-tier" key={depth}>
            {index > 0 && <div className="hc-connector" aria-hidden="true"><ArrowDown size={17} /></div>}
            <p className="hc-tier-label">{index === 0 ? "Starting point" : index === 1 ? "Build the foundations" : `Go deeper · tier ${depth + 1}`}</p>
            <div className="hc-nodes">
              {group.map(topic => {
                const tone = tones[topic.level];
                const isSelected = selected?.id === topic.id;
                return (
                  <button key={topic.id} type="button" onClick={() => onSelect(topic.id)}
                    data-testid={`node-topic-${topic.id}`} aria-pressed={isSelected} aria-controls="course-topic-details"
                    aria-label={`${topic.name}, ${topic.level}`} title={`${topic.name} — ${tone.label}`}
                    className={`hc-node${isSelected ? " selected" : ""}${topic.level === "Locked" ? " locked" : ""}`}
                    style={{ "--node-bg": isSelected ? "#edf0df" : "#fffdf5", "--node-color": tone.color } as CSSProperties}>
                    <span className="hc-node-inner">
                      <span className="hc-node-icon">{topic.level === "Mastered" ? <Check size={15} /> : topic.level === "Locked" ? <LockKeyhole size={13} /> : <span>{topic.correctSessions || "·"}</span>}</span>
                      <span className="hc-node-title">{topic.name}</span>
                      <span className="hc-node-status">{tone.label}</span>
                      {topic.level === "Practicing" && <span className="hc-node-count">{topic.correctSessions} correct session{topic.correctSessions === 1 ? "" : "s"}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="hc-legend">
          {(["Mastered", "Practicing", "Unlocked", "Locked"] as TopicLevel[]).map(level => <span key={level} title={LEVELS[level].blurb}><i className="hc-dot" style={{ background: tones[level].color }} />{tones[level].label}</span>)}
        </div>
        <div className="hc-footer"><span><strong>Progress is for learning, not grading.</strong> XP comes from quiz answers only.</span><span>Each hex is linked to your source material.</span></div>
      </section>
      <aside className="hc-side">
        {selected && (
          <section className="hc-detail" id="course-topic-details" data-testid="panel-topic">
            <div className="hc-detail-kicker">Topic details</div>
            <h2>{selected.name}</h2>
            <span className="hc-badge" style={{ background: tones[selected.level].soft, color: tones[selected.level].color }}>{tones[selected.level].label}</span>
            <p className="hc-detail-copy">{LEVELS[selected.level].blurb}.</p>
            <div className="hc-source">
              <div className="hc-source-label"><BookOpen size={12} aria-hidden /> Source <Cite c={selected.citation} onOpen={onCitation} /></div>
              {selected.citation.quote && <p className="hc-quote">“{selected.citation.quote}”</p>}
              {source && <p className="hc-source-name">{source.name}</p>}
            </div>
            {prerequisites.length > 0 && <p className="hc-prereq">Builds on: {prerequisites.map((topic, index) => <span key={topic.id}>{index > 0 && " + "}<button type="button" onClick={() => onSelect(topic.id)}>{topic.name}</button></span>)}</p>}
            {nextSteps.length > 0 && <p className="hc-next"><ChevronRight size={13} aria-hidden /><span>Opens the path to {nextSteps.map(topic => topic.name).join(" and ")}</span></p>}
            <div className="hc-footer"><span>{selected.correctSessions} correct session{selected.correctSessions === 1 ? "" : "s"}</span><span>Last reviewed: {relTime(selected.lastReviewedAt)}</span></div>
            <div className="hc-buttons">
              <button className="hc-button primary" type="button" onClick={() => onReview(selected)} disabled={selected.level === "Locked"} data-testid="button-review-topic"><Play size={14} /> Review quiz</button>
              <button className="hc-button subtle" type="button" onClick={() => onEdit(selected)} data-testid="button-edit-topic"><Pencil size={14} /> Edit</button>
              <button className="hc-button subtle" type="button" onClick={() => onRemove(selected)} data-testid="button-remove-topic"><Trash2 size={14} /> Remove</button>
            </div>
            {selected.level === "Locked" && <p className="hc-progress-note">Unlocks when its prerequisites are practiced. Select an earlier topic to see where to start.</p>}
          </section>
        )}
        <section className="hc-progress" aria-label="Course progress">
          <div className="hc-progress-title"><Sparkles size={15} aria-hidden /> Course progress</div>
          <div className="hc-progress-numbers"><strong>{mastered} <span>/ {course.topics.length}</span></strong><span>{progress}% mastered</span></div>
          <div className="hc-bar" role="progressbar" aria-label="Topics mastered" aria-valuenow={mastered} aria-valuemin={0} aria-valuemax={course.topics.length || 1} aria-valuetext={`${mastered} of ${course.topics.length} topics mastered`}><span style={{ width: `${progress}%` }} /></div>
          <p className="hc-progress-note">Based on {course.answerCount} quiz answer{course.answerCount === 1 ? "" : "s"}. Mastery follows correct answers across spaced sessions, not a course grade.</p>
        </section>
        {children}
      </aside>
    </div>
  );
}
