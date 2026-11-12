import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { useGetWorkspace } from "@workspace/api-client-react";
import { ArrowRight, BookOpen, Flame, Network, PenLine, Target } from "lucide-react";
import { EmptyNote, ErrorState, HandTitle, HonestLabel, PageSkeleton } from "@/components/states";
import { errMsg, relTime, stepLabel } from "@/lib/proxie";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useUser();
  const ws = useGetWorkspace();
  if (ws.isLoading) return <PageSkeleton />;
  if (ws.isError || !ws.data) return <ErrorState message={errMsg(ws.error, "Your desk couldn't load.")} onRetry={() => ws.refetch()} />;
  const { notebooks, courses, runs, quests, xp, streak, preferences } = ws.data;
  const sorted = [...notebooks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const fresh = notebooks.length === 0 && courses.length === 0;
  const hour = new Date().getHours();
  const hi = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <p className="mono text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <HandTitle className="mt-1 text-[52px] md:text-[64px]">{hi}, {user?.firstName ?? "friend"}.</HandTitle>
        </div>
        <div className="flex gap-3">
          <Link href="/progress" className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--card))] px-4 py-2.5 shadow-sm" data-testid="link-xp">
            <Target className="h-4 w-4 text-[hsl(var(--pen-blue))]" /><span className="font-bold" data-testid="text-xp">{xp} XP</span>
          </Link>
          <Link href="/progress" className="flex items-center gap-2 rounded-2xl bg-[hsl(var(--card))] px-4 py-2.5 shadow-sm" data-testid="link-streak">
            <Flame className="h-4 w-4 text-[hsl(var(--pen-red))]" /><span className="font-bold" data-testid="text-streak">{streak} day{streak === 1 ? "" : "s"}{preferences.streakPaused ? " · paused" : ""}</span>
          </Link>
        </div>
      </div>

      {fresh ? (
        <div className="grid gap-8 md:grid-cols-2">
          <EmptyNote title="A blank notebook" body="Upload the slides from a lecture you missed, or paste its transcript. Proxie writes the notes and cites every line." action={<Link href="/notebooks/new" className="ink-btn" data-testid="button-empty-new-notebook"><PenLine className="h-4 w-4" /> Build my first notebook</Link>} />
          <EmptyNote tone="green" title="No courses yet" body="Paste a syllabus and it becomes a skill tree. A short placement check sets where you start." action={<Link href="/courses" className="ghost-btn" data-testid="button-empty-new-course"><Network className="h-4 w-4" /> Set up a course</Link>} />
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="hand text-[36px] font-bold">Notebooks</h2>
              <Link href="/notebooks/new" className="ink-btn !py-2 text-sm" data-testid="button-new-notebook"><PenLine className="h-4 w-4" /> New</Link>
            </div>
            {sorted.length === 0 ? (
              <EmptyNote title="Nothing written yet" body="Your courses are ready. Add lecture slides or a transcript to get notes." action={<Link href="/notebooks/new" className="ink-btn" data-testid="button-first-notebook">Build a notebook</Link>} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {sorted.map((n, i) => {
                  const course = courses.find((c) => c.id === n.courseId);
                  const open = n.flags.filter((f) => !f.after).length;
                  return (
                    <Link key={n.id} href={`/notebooks/${n.id}`} data-testid={`card-notebook-${n.id}`}
                      className={cn("paper-lined group relative block rounded-xl border border-[hsl(var(--border))] py-5 pl-[62px] pr-4 transition-transform hover:-translate-y-1 rise", i % 2 ? "hover:rotate-[0.5deg]" : "hover:rotate-[-0.5deg]")} style={{ animationDelay: `${i * 50}ms` }}>
                      {course && <span className="absolute left-0 top-0 h-full w-2 rounded-l-xl" style={{ background: course.color }} />}
                      <p className="hand line-clamp-2 text-[28px] font-bold leading-[1]">{n.title}</p>
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{n.sections.length} section{n.sections.length === 1 ? "" : "s"} · {n.sources.length} source{n.sources.length === 1 ? "" : "s"}</p>
                      <p className="mono mt-3 text-[11px] text-[hsl(var(--muted-foreground))]">{course ? `${course.name} · ` : ""}{relTime(n.createdAt)}</p>
                      {open > 0 && <span className="absolute right-3 top-3 rounded-full bg-[hsl(4_80%_92%)] px-2 py-0.5 text-[11px] font-bold text-[hsl(var(--pen-red))]">{open} flag{open === 1 ? "" : "s"}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-10">
            <section>
              <h2 className="hand mb-3 text-[36px] font-bold"><span className="marker-underline green">This week</span></h2>
              {quests.length === 0 ? (
                <p className="rounded-xl bg-[hsl(var(--card))] p-4 text-[15px] text-[hsl(var(--muted-foreground))]">
                  {courses.length === 0 ? "Quests come from your courses. Set one up to get a weekly list." : "No weak or upcoming topics right now. Nice. Review keeps it that way."}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {quests.map((q, i) => {
                    const c = courses.find((x) => x.id === q.courseId);
                    return (
                      <li key={`${q.topicId}-${i}`}>
                        <Link href={`/courses/${q.courseId}?topic=${q.topicId}`} className="group flex items-start gap-3 rounded-xl bg-[hsl(var(--card))] p-3.5 transition-colors hover:bg-[hsl(var(--hl-yellow)/0.35)]" data-testid={`link-quest-${i}`}>
                          <span className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-[hsl(var(--ink))]" />
                          <span className="flex-1">
                            <span className="block font-bold leading-snug">{q.title}</span>
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">{q.reason}{c ? ` · ${c.name}` : ""}</span>
                          </span>
                          <ArrowRight className="mt-1 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h2 className="hand mb-3 text-[32px] font-bold">Courses</h2>
              {courses.length === 0 ? (
                <Link href="/courses" className="ghost-btn" data-testid="link-add-course"><Network className="h-4 w-4" /> Add a course from a syllabus</Link>
              ) : (
                <ul className="space-y-2">
                  {courses.map((c) => {
                    const m = c.topics.filter((t) => t.level === "Mastered").length;
                    return (
                      <li key={c.id}>
                        <Link href={`/courses/${c.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[hsl(var(--card))]" data-testid={`link-course-${c.id}`}>
                          <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                          <span className="flex-1 font-bold">{c.name}</span>
                          <span className="mono text-xs text-[hsl(var(--muted-foreground))]">{m}/{c.topics.length} mastered</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section>
              <h2 className="hand mb-3 text-[32px] font-bold">Recent activity</h2>
              {runs.length === 0 ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Builds, quizzes and fixes will show up here.</p>
              ) : (
                <ul className="space-y-2">
                  {runs.slice(0, 6).map((r) => {
                    const last = r.events[r.events.length - 1];
                    const nb = notebooks.find((n) => n.id === r.notebookId);
                    const body = (
                      <>
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", r.status === "complete" ? "bg-[hsl(110_50%_40%)]" : r.status === "failed" ? "bg-[hsl(var(--pen-red))]" : "pulse-dot bg-[hsl(var(--pen-blue))]")} />
                        <span className="flex-1">
                          <span className="block font-bold">{nb?.title ?? (r.status === "failed" ? "Build failed" : "Run")}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">{r.error ?? (last ? `${stepLabel(last.step)}: ${last.result}` : r.status)}</span>
                        </span>
                        {last && <span className="mono text-[10px] text-[hsl(var(--muted-foreground))]">{relTime(last.startedAt)}</span>}
                      </>
                    );
                    return (
                      <li key={r.id} className="text-sm" data-testid={`row-run-${r.id}`}>
                        {nb ? <Link href={`/notebooks/${nb.id}`} className="flex gap-3 rounded-lg p-2 hover:bg-[hsl(var(--card))]">{body}</Link> : <div className="flex gap-3 p-2">{body}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <HonestLabel><BookOpen className="mr-1 inline h-3 w-3" /> Everything here comes from your own account data.</HonestLabel>
          </aside>
        </div>
      )}
    </div>
  );
}
