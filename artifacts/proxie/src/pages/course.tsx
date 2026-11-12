import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetQuizQueryKey, getGetRunQueryKey, getGetWorkspaceQueryKey, useDeleteCourse, useGetRun, useGetWorkspace, useUpdateCourse } from "@workspace/api-client-react";
import type { Citation, Course, Topic } from "@workspace/api-client-react";
import { Check, Compass, GitMerge, Lock, Pencil, Play, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackLink } from "@/components/app-shell";
import { Cite, SourceDialog } from "@/components/notebook-parts";
import { QuizDialog, type QuizMode } from "@/components/quiz-runner";
import { RunDiagram } from "@/components/run-diagram";
import { EmptyNote, ErrorState, HonestLabel, PageSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { LEVELS, errMsg, relTime, topicDepths } from "@/lib/proxie";
import { cn } from "@/lib/utils";

export default function CoursePage() {
  const { id = "" } = useParams<{ id: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const ws = useGetWorkspace();
  const update = useUpdateCourse();
  const del = useDeleteCourse();
  const course = ws.data?.courses.find((c) => c.id === id);
  const runId = course?.runId ?? "";
  const run = useGetRun(runId, { query: { queryKey: getGetRunQueryKey(runId), enabled: !!runId, refetchInterval: (q) => (q.state.data?.status === "running" && q.state.dataUpdateCount < 300 ? 1000 : false) } });

  const [selected, setSelected] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizMode | null>(null);
  const [cite, setCite] = useState<Citation | null>(null);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [rename, setRename] = useState("");
  const [prereqs, setPrereqs] = useState<string[]>([]);
  const [mergeInto, setMergeInto] = useState("");
  const [courseName, setCourseName] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [removeTopic, setRemoveTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(search).get("topic");
    if (t) setSelected(t);
  }, [search]);

  const tiers = useMemo(() => {
    if (!course) return [];
    const depth = topicDepths(course.topics);
    const out: Topic[][] = [];
    [...course.topics].sort((a, b) => a.position - b.position).forEach((t) => {
      const d = depth.get(t.id) ?? 0;
      (out[d] ??= []).push(t);
    });
    return out.filter(Boolean);
  }, [course]);

  if (ws.isLoading) return <PageSkeleton />;
  if (ws.isError) return <ErrorState message={errMsg(ws.error)} onRetry={() => ws.refetch()} />;
  if (!course) return <EmptyNote tone="pink" title="Course not found" body="It may have been deleted." action={<Link href="/courses" className="ink-btn" data-testid="link-courses">All courses</Link>} />;

  const done = (c: Course, msg: string) => {
    qc.setQueryData(getGetWorkspaceQueryKey(), (old: unknown) => {
      const w = old as { courses?: Course[] } | undefined;
      return w?.courses ? { ...w, courses: w.courses.map((x) => (x.id === c.id ? c : x)) } : old;
    });
    qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
    qc.invalidateQueries({ queryKey: getGetQuizQueryKey(c.id) });
    qc.invalidateQueries({ queryKey: getGetRunQueryKey(c.runId) });
    toast({ title: msg });
  };
  const onErr = (e: unknown) => toast({ title: "Didn't save", description: errMsg(e), variant: "destructive" });

  const openEdit = (t: Topic) => { setEditing(t); setRename(t.name); setPrereqs(t.prerequisites); setMergeInto(""); };
  const saveTopic = () => {
    if (!editing) return;
    const topics = course.topics.map((t) => (t.id === editing.id ? { ...t, name: rename.trim() || t.name, prerequisites: prereqs } : t));
    update.mutate({ id, data: { topics } }, { onSuccess: (c) => { done(c, "Topic saved"); setEditing(null); }, onError: onErr });
  };
  const merge = () => {
    if (!editing || !mergeInto) return;
    update.mutate({ id, data: { mergeFromId: editing.id, mergeIntoId: mergeInto } }, { onSuccess: (c) => { done(c, "Topics merged"); setEditing(null); }, onError: onErr });
  };
  const remove = (t: Topic) => {
    const topics = course.topics.filter((x) => x.id !== t.id).map((x) => ({ ...x, prerequisites: x.prerequisites.filter((p) => p !== t.id) }));
    update.mutate({ id, data: { topics } }, { onSuccess: (c) => { done(c, "Topic removed"); setRemoveTopic(null); setEditing(null); setSelected(null); }, onError: onErr });
  };
  const saveName = () => {
    if (!courseName?.trim() || courseName === course.name) return setCourseName(null);
    update.mutate({ id, data: { name: courseName.trim() } }, { onSuccess: (c) => { done(c, "Renamed"); setCourseName(null); }, onError: onErr });
  };
  const deleteCourse = () => del.mutate({ id }, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() }); qc.removeQueries({ queryKey: getGetQuizQueryKey(id) }); setLocation("/courses"); },
    onError: onErr,
  });

  const sel = course.topics.find((t) => t.id === selected);
  const nameOf = (tid: string) => course.topics.find((t) => t.id === tid)?.name ?? "removed topic";

  return (
    <div>
      <BackLink href="/courses">All courses</BackLink>
      <div className="flex flex-wrap items-start gap-4 rise">
        <span className="mt-4 h-5 w-5 shrink-0 rounded-full" style={{ background: course.color }} />
        <div className="flex-1">
          {courseName !== null ? (
            <div className="flex flex-wrap gap-2">
              <input autoFocus className="field hand max-w-md !text-3xl font-bold" maxLength={120} value={courseName} onChange={(e) => setCourseName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()} data-testid="input-course-rename" />
              <button className="ink-btn" onClick={saveName} disabled={update.isPending} data-testid="button-save-course-name">Save</button>
              <button className="ghost-btn" onClick={() => setCourseName(null)} data-testid="button-cancel-course-name">Cancel</button>
            </div>
          ) : (
            <h1 className="hand text-[52px] font-bold leading-[0.95] md:text-[64px]" data-testid="text-course-name">
              <span className="marker-underline green">{course.name}</span>
              <button onClick={() => setCourseName(course.name)} className="ml-3 align-middle text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--ink))]" aria-label="Rename course" data-testid="button-rename-course"><Pencil className="h-5 w-5" /></button>
            </h1>
          )}
          <div className="mt-3"><HonestLabel>Based on {course.answerCount} quiz answer{course.answerCount === 1 ? "" : "s"} in this course · {course.xp} XP · not an official grade</HonestLabel></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!course.placementDone && course.topics.length > 0 && <button className="ink-btn" onClick={() => setQuiz({ kind: "placement" })} data-testid="button-placement"><Compass className="h-4 w-4" /> Take placement check</button>}
          {course.placementDone && <button className="ink-btn" onClick={() => setQuiz({ kind: "review" })} data-testid="button-review-all"><Play className="h-4 w-4" /> Review quiz</button>}
          <button className="ghost-btn" onClick={() => setConfirmDel(true)} data-testid="button-delete-course"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {!course.placementDone && course.topics.length > 0 && (
        <div className="sticky-note mt-6 rounded-sm p-4 text-[15px] md:max-w-2xl">
          <b>Start where you actually are.</b> A short placement check sets each topic's starting level, so you don't begin from zero on things you already know.
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="paper-grid rounded-2xl border border-[hsl(var(--border))] p-4 md:p-6" data-testid="panel-skill-tree">
          {course.topics.length === 0 ? (
            <EmptyNote title="No topics found" body="Proxie couldn't find topic lines in this syllabus. Delete this course and paste a schedule with one topic per line." />
          ) : (
            <div className="space-y-2">
              {tiers.map((tier, ti) => (
                <div key={ti}>
                  {ti > 0 && (
                    <svg className="mx-auto block h-8 w-16 text-[hsl(var(--ink)/0.45)]" viewBox="0 0 64 32" aria-hidden>
                      <path d="M32 2c-2 9 2 16 0 26M24 20l8 9 8-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                  <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">{ti === 0 ? "Foundations" : `Builds on tier ${ti}`}</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {tier.map((t) => {
                      const L = LEVELS[t.level];
                      return (
                        <button key={t.id} onClick={() => setSelected(t.id)} data-testid={`node-topic-${t.id}`}
                          className={cn("pop relative rounded-2xl border-2 bg-[hsl(var(--card))] p-3.5 text-left transition-transform hover:-translate-y-0.5",
                            selected === t.id ? "border-[hsl(var(--ink))] shadow-[4px_4px_0_hsl(var(--hl-yellow))]" : "border-[hsl(var(--border))]", t.level === "Locked" && "opacity-75")}>
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ background: L.dot }}>
                              {t.level === "Locked" ? <Lock className="h-3.5 w-3.5 text-white" /> : t.level === "Mastered" ? <Check className="h-4 w-4 text-white" /> : <span className="hand text-lg font-bold text-white">{t.position + 1}</span>}
                            </span>
                            <span className="font-bold leading-tight">{t.name}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", L.tone)}>{L.label}</span>
                            {t.prerequisites.length > 0 && <span className="text-[11px] text-[hsl(var(--muted-foreground))]">after {t.prerequisites.map(nameOf).join(", ")}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-dashed border-[hsl(var(--ink)/0.15)] pt-4">
            {Object.values(LEVELS).map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: l.dot }} />{l.label}: {l.blurb}</span>
            ))}
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {sel ? (
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 pop" data-testid="panel-topic">
              <p className="hand text-[32px] font-bold leading-none">{sel.name}</p>
              <span className={cn("mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold", LEVELS[sel.level].tone)}>{sel.level}</span>
              <p className="mt-3 text-sm">From {sel.citation.locator}<Cite c={sel.citation} onOpen={setCite} /></p>
              {sel.citation.quote && <p className="mt-1 text-sm italic text-[hsl(var(--muted-foreground))]">"{sel.citation.quote}"</p>}
              <HonestLabel>{sel.correctSessions} correct session{sel.correctSessions === 1 ? "" : "s"} · last review {relTime(sel.lastReviewedAt)}</HonestLabel>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="ink-btn !py-2 text-sm" onClick={() => setQuiz({ kind: "review", topicId: sel.id })} disabled={sel.level === "Locked"} data-testid="button-review-topic"><Play className="h-3.5 w-3.5" /> Review</button>
                <button className="ghost-btn !py-2 text-sm" onClick={() => openEdit(sel)} data-testid="button-edit-topic"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                <button className="ghost-btn !py-2 text-sm" onClick={() => setRemoveTopic(sel)} data-testid="button-remove-topic"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              </div>
              {sel.level === "Locked" && <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Unlocks when its prerequisites are practiced.</p>}
            </div>
          ) : (
            <p className="rounded-2xl bg-[hsl(var(--card))] p-4 text-sm text-[hsl(var(--muted-foreground))]">Tap a node to see where it came from, review it, or edit it.</p>
          )}
          {run.data && <RunDiagram events={run.data.events} running={run.data.status === "running"} compact />}
        </aside>
      </div>

      <QuizDialog course={course} mode={quiz} onClose={() => setQuiz(null)} />
      <SourceDialog open={!!cite} onOpenChange={(o) => !o && setCite(null)} citation={cite} sources={course.sources} />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-[hsl(var(--card))]">
          <DialogHeader>
            <DialogTitle className="hand text-3xl font-bold">Edit topic</DialogTitle>
            <DialogDescription>Rename it, change what comes before it, or fold it into another topic.</DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-bold">Name
            <input className="field mt-1 font-normal" maxLength={120} value={rename} onChange={(e) => setRename(e.target.value)} data-testid="input-topic-name" />
          </label>
          <div>
            <p className="text-sm font-bold">Comes after</p>
            <div className="mt-1 max-h-44 space-y-1 overflow-y-auto">
              {course.topics.filter((t) => t.id !== editing?.id).map((t) => (
                <label key={t.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[hsl(var(--muted))]">
                  <input type="checkbox" className="h-4 w-4 accent-[hsl(226_60%_36%)]" checked={prereqs.includes(t.id)} onChange={(e) => setPrereqs((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))} data-testid={`checkbox-prereq-${t.id}`} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="ghost-btn" onClick={() => setEditing(null)} data-testid="button-cancel-topic">Cancel</button>
            <button className="ink-btn" disabled={update.isPending} onClick={saveTopic} data-testid="button-save-topic">{update.isPending ? "Saving..." : "Save"}</button>
          </div>
          <div className="mt-2 border-t border-dashed border-[hsl(var(--ink)/0.2)] pt-4">
            <p className="flex items-center gap-2 text-sm font-bold"><GitMerge className="h-4 w-4" /> Merge into another topic</p>
            <div className="mt-2 flex gap-2">
              <select className="field" value={mergeInto} onChange={(e) => setMergeInto(e.target.value)} data-testid="select-merge-into">
                <option value="">Choose a topic</option>
                {course.topics.filter((t) => t.id !== editing?.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button className="ghost-btn shrink-0" disabled={!mergeInto || update.isPending} onClick={merge} data-testid="button-merge">Merge</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTopic} onOpenChange={(o) => !o && setRemoveTopic(null)}>
        <AlertDialogContent className="bg-[hsl(var(--card))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="hand text-3xl">Remove "{removeTopic?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>Topics that depended on it will lose that link.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove">Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeTopic && remove(removeTopic)} data-testid="button-confirm-remove">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-[hsl(var(--card))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="hand text-3xl">Delete {course.name}?</AlertDialogTitle>
            <AlertDialogDescription>The skill tree, levels and quiz history for this course go away.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-course">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCourse} className="bg-[hsl(var(--pen-red))]" data-testid="button-confirm-delete-course">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
