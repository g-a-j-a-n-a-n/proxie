import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWorkspaceQueryKey, useCreateCourse, useGetWorkspace } from "@workspace/api-client-react";
import { AlertTriangle, Lock, Network, Plus } from "lucide-react";
import { EmptyNote, ErrorState, HandTitle, PageSkeleton } from "@/components/states";
import { COURSE_COLORS, errMsg, basePath } from "@/lib/proxie";
import { useExampleWorkspace } from "@/lib/example-mode";
import { cn } from "@/lib/utils";

export default function Courses() {
  const isExample = useExampleWorkspace();
  const ws = useGetWorkspace();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const create = useCreateCourse();
  const [name, setName] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [showForm, setShowForm] = useState(false);

  if (ws.isLoading) return <PageSkeleton />;
  if (ws.isError || !ws.data) return <ErrorState message={errMsg(ws.error)} onRetry={() => ws.refetch()} />;
  const courses = ws.data.courses;
  const formOpen = showForm || courses.length === 0;

  const submit = () => {
    create.mutate({ data: { name: name.trim(), syllabus, color } }, {
      onSuccess: (c) => {
        qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
        setLocation(`/courses/${c.id}`);
      },
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 rise">
        <div>
          <HandTitle className="text-[52px] md:text-[64px]" tone="green">Courses</HandTitle>
          <p className="mt-3 max-w-lg text-[hsl(var(--ink)/0.75)]">Each course is a skill tree built from its syllabus. You can rename, merge and rewire any of it.</p>
        </div>
        {isExample ? <a className="ink-btn" href={`${basePath}/sign-up`}><Lock className="h-4 w-4" /> New course · sign up</a> :
          courses.length > 0 && !showForm && <button className="ink-btn" onClick={() => setShowForm(true)} data-testid="button-show-course-form"><Plus className="h-4 w-4" /> New course</button>}
      </div>

      {isExample && courses.length === 0 && <p className="rounded-xl border p-5">You removed the sample course. Use “Reset example” above to restore your practice materials.</p>}
      {formOpen && !isExample && (
        <section className="paper-grid grid gap-6 rounded-2xl border border-[hsl(var(--border))] p-5 md:grid-cols-[1fr_1.4fr] md:p-7 rise">
          <div className="space-y-4">
            <p className="hand text-3xl font-bold">From your syllabus</p>
            <label className="block"><span className="text-sm font-bold">Course name</span>
              <input className="field mt-1" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="BIO 142: Cell Biology" data-testid="input-course-name" />
            </label>
            <div><span className="text-sm font-bold">Color</span>
              <div className="mt-2 flex gap-2">
                {COURSE_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`} aria-pressed={color === c} data-testid={`button-color-${c.slice(1)}`}
                    className={cn("h-8 w-8 rounded-full border-2 transition-transform", color === c ? "scale-110 border-[hsl(var(--ink))]" : "border-transparent")} style={{ background: c }} />
                ))}
              </div>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Topics become nodes in syllabus order, each citing its line. Proxie then writes placement questions from it, which can take a minute or two.</p>
          </div>
          <div>
            <label className="block"><span className="text-sm font-bold">Paste the syllabus or schedule</span>
              <textarea className="field mt-1 min-h-[240px] leading-relaxed" maxLength={120000} value={syllabus} onChange={(e) => setSyllabus(e.target.value)} placeholder={"Week 1  Membranes and transport\nWeek 2  Enzymes and energy\nWeek 3  Cellular respiration..."} data-testid="input-syllabus" />
            </label>
            {create.isError && <p className="mt-2 flex gap-2 text-sm text-[hsl(var(--pen-red))]" role="alert"><AlertTriangle className="h-4 w-4 shrink-0" />{errMsg(create.error, "Couldn't create the course.")} Your syllabus is still here.</p>}
            {create.isPending && <p className="mt-2 flex items-center gap-2 text-sm text-[hsl(var(--pen-blue))]" data-testid="status-creating"><span className="pulse-dot h-2 w-2 rounded-full bg-current" /> Reading topics and writing cited questions. This can take up to 90 seconds, keep this tab open.</p>}
            <div className="mt-3 flex justify-end gap-2">
              {courses.length > 0 && <button className="ghost-btn" onClick={() => setShowForm(false)} disabled={create.isPending} data-testid="button-cancel-course">Cancel</button>}
              <button className="ink-btn" disabled={create.isPending || !name.trim() || syllabus.trim().length < 10} onClick={submit} data-testid="button-create-course">
                <Network className="h-4 w-4" /> {create.isPending ? "Building tree..." : "Build skill tree"}
              </button>
            </div>
          </div>
        </section>
      )}

      {courses.length === 0 ? (
        <EmptyNote tone="green" title="Your first tree" body="Paste the schedule from your course page above. You can also build a notebook first; Proxie starts a course from its slide titles." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => {
            const counts = { Mastered: 0, Practicing: 0, Unlocked: 0, Locked: 0 };
            c.topics.forEach((t) => counts[t.level]++);
            const total = c.topics.length || 1;
            return (
              <Link key={c.id} href={`/courses/${c.id}`} className="group relative block overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-transform hover:-translate-y-1 rise" style={{ animationDelay: `${i * 60}ms` }} data-testid={`card-course-${c.id}`}>
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.color }} />
                <p className="hand text-[32px] font-bold leading-none">{c.name}</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{c.topics.length} topics · {c.xp} XP</p>
                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                  <span style={{ width: `${(counts.Mastered / total) * 100}%`, background: "hsl(110 50% 42%)" }} />
                  <span style={{ width: `${(counts.Practicing / total) * 100}%`, background: "hsl(46 92% 55%)" }} />
                  <span style={{ width: `${(counts.Unlocked / total) * 100}%`, background: "hsl(226 60% 60%)" }} />
                </div>
                <p className="mono mt-2 text-[11px] text-[hsl(var(--muted-foreground))]">{counts.Mastered} mastered · {counts.Practicing} practicing · {c.placementDone ? `${c.answerCount} answers` : "placement not taken"}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
