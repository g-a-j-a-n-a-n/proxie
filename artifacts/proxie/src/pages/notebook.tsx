import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetNotebookQueryKey, getGetRunQueryKey, getGetWorkspaceQueryKey, useDeleteNotebook, useFixSection, useFlagContent, useGetNotebook, useGetRun, useGetWorkspace } from "@workspace/api-client-react";
import type { Citation, Flag, Notebook, Section, Statement } from "@workspace/api-client-react";
import { Info, Network, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BackLink } from "@/components/app-shell";
import { SectionBlock, SourceDialog, sectionAsText } from "@/components/notebook-parts";
import { RunDiagram } from "@/components/run-diagram";
import { EmptyNote, ErrorState, PageSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { errMsg, errStatus, relTime } from "@/lib/proxie";

export default function NotebookPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const nb = useGetNotebook(id, { query: { queryKey: getGetNotebookQueryKey(id), enabled: !!id } });
  const ws = useGetWorkspace();
  const runId = nb.data?.runId ?? "";
  const run = useGetRun(runId, {
    query: { queryKey: getGetRunQueryKey(runId), enabled: !!runId, refetchInterval: (q) => (q.state.data?.status === "running" && q.state.dataUpdateCount < 300 ? 1000 : false) },
  });
  const flagM = useFlagContent();
  const fixM = useFixSection();
  const delM = useDeleteNotebook();

  const [cite, setCite] = useState<Citation | null>(null);
  const [flagging, setFlagging] = useState<{ st: Statement; section: Section } | null>(null);
  const [flagText, setFlagText] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const [editing, setEditing] = useState<{ section: Section; flag?: Flag } | null>(null);
  const [editText, setEditText] = useState("");
  const [regenId, setRegenId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);

  if (nb.isLoading) return <PageSkeleton rows={2} />;
  if (nb.isError || !nb.data) {
    if (errStatus(nb.error) === 404) return <EmptyNote tone="pink" title="This notebook isn't here" body="It may have been deleted, or it belongs to another account." action={<Link href="/dashboard" className="ink-btn" data-testid="link-back-dashboard">Back to my desk</Link>} />;
    return <ErrorState message={errMsg(nb.error, "The notebook couldn't load.")} onRetry={() => nb.refetch()} />;
  }
  const n = nb.data;
  const course = ws.data?.courses.find((c) => c.id === n.courseId);
  const allSources = [...n.sources, ...(course?.sources ?? [])];

  const applyNotebook = (updated: Notebook) => {
    qc.setQueryData(getGetNotebookQueryKey(id), updated);
    qc.invalidateQueries({ queryKey: getGetRunQueryKey(updated.runId) });
    qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
  };

  const openFlag = (st: Statement, section: Section) => {
    setFlagging({ st, section });
    setFlagText(window.getSelection()?.toString().trim() || st.text);
    setFlagNote("");
  };
  const submitFlag = () => {
    if (!flagging) return;
    flagM.mutate({ id, data: { sectionId: flagging.section.id, highlightedText: flagText.trim() || flagging.st.text, citation: flagging.st.citation, note: flagNote.trim() } }, {
      onSuccess: (u) => { applyNotebook(u); setFlagging(null); toast({ title: "Flag saved", description: "It's on the section and in the run diagram." }); },
    });
  };
  const openEdit = (section: Section, flag?: Flag) => { setEditing({ section, flag }); setEditText(sectionAsText(section)); fixM.reset(); };
  const submitEdit = () => {
    if (!editing) return;
    fixM.mutate({ id, sectionId: editing.section.id, data: { action: "edit", text: editText, ...(editing.flag ? { flagId: editing.flag.id } : {}) } }, {
      onSuccess: (u) => { applyNotebook(u); setEditing(null); toast({ title: "Edit saved", description: "Marked as student edited." }); },
    });
  };
  const regenerate = (section: Section, flag?: Flag) => {
    setRegenId(section.id);
    fixM.mutate({ id, sectionId: section.id, data: { action: "regenerate", ...(flag ? { flagId: flag.id } : {}) } }, {
      onSuccess: (u) => { applyNotebook(u); toast({ title: "Section regenerated", description: "Check the new citations." }); },
      onError: (e) => toast({ title: "Couldn't regenerate", description: errMsg(e), variant: "destructive" }),
      onSettled: () => setRegenId(null),
    });
  };
  const doDelete = () => {
    delM.mutate({ id }, {
      onSuccess: () => {
        qc.removeQueries({ queryKey: getGetNotebookQueryKey(id) });
        qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
        setLocation("/dashboard");
      },
      onError: (e) => toast({ title: "Couldn't delete", description: errMsg(e), variant: "destructive" }),
    });
  };

  return (
    <div>
      <BackLink href="/dashboard">My desk</BackLink>
      <div className="flex flex-wrap items-start gap-4 rise">
        <div className="flex-1">
          <h1 className="hand text-[54px] font-bold leading-[0.92] md:text-[72px]" data-testid="text-notebook-title"><span className="marker-underline">{n.title}</span></h1>
          <p className="mono mt-3 text-xs text-[hsl(var(--muted-foreground))]">
            {relTime(n.createdAt)} · {n.sources.map((s) => s.name).join(", ")}
            {course && <> · <Link href={`/courses/${course.id}`} className="underline" data-testid="link-course"><Network className="inline h-3 w-3" /> {course.name}</Link></>}
          </p>
        </div>
        <button className="ghost-btn text-sm hover:!bg-[hsl(4_80%_95%)]" onClick={() => setConfirmDel(true)} data-testid="button-delete-notebook"><Trash2 className="h-4 w-4" /> Delete</button>
      </div>

      <div className="mt-6 flex gap-3 rounded-xl border border-[hsl(var(--ink)/0.15)] bg-[hsl(var(--card))] p-4 text-[15px]" data-testid="text-disclaimer">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--pen-blue))]" />
        <p>{n.disclaimer || "These notes were generated from your materials and can contain mistakes. Click a citation to check the source."}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-8">
          {n.sections.length === 0 ? (
            <EmptyNote title="No sections came out" body="Nothing in the sources could be summarized with citations. If these were scanned slides, try pasting a transcript instead." action={<Link href="/notebooks/new" className="ink-btn" data-testid="link-try-again">Try another source</Link>} />
          ) : n.sections.map((s, i) => (
            <SectionBlock key={s.id} section={s} index={i} flags={n.flags.filter((f) => f.sectionId === s.id)} onCite={setCite} onFlag={openFlag} onEdit={openEdit} onRegenerate={regenerate} regenerating={regenId === s.id} />
          ))}
        </div>
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto">
          {run.isLoading ? <div className="h-80 animate-pulse rounded-2xl paper-grid" /> :
            run.data ? <RunDiagram events={run.data.events} running={run.data.status === "running"} /> :
              <p className="text-sm text-[hsl(var(--muted-foreground))]">The run record for this notebook isn't available.</p>}
          <p className="mt-3 px-1 text-xs text-[hsl(var(--muted-foreground))]">Flags, edits and regenerations are added here as steps.</p>
        </aside>
      </div>

      <SourceDialog open={!!cite} onOpenChange={(o) => !o && setCite(null)} citation={cite} sources={allSources} />

      <Dialog open={!!flagging} onOpenChange={(o) => !o && setFlagging(null)}>
        <DialogContent className="bg-[hsl(var(--card))]">
          <DialogHeader>
            <DialogTitle className="hand text-3xl font-bold">Flag this</DialogTitle>
            <DialogDescription>Saved with its section and citation ({flagging?.st.citation.locator}). Only you can see it.</DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-bold">Text that looks wrong
            <textarea className="field mt-1 min-h-[90px] font-normal" maxLength={12000} value={flagText} onChange={(e) => setFlagText(e.target.value)} data-testid="input-flag-text" />
          </label>
          <label className="block text-sm font-bold">What's off? (optional)
            <textarea className="field mt-1 min-h-[70px] font-normal" maxLength={2000} value={flagNote} onChange={(e) => setFlagNote(e.target.value)} placeholder="The slide says 36, not 38." data-testid="input-flag-note" />
          </label>
          {flagM.isError && <p className="text-sm text-[hsl(var(--pen-red))]">{errMsg(flagM.error)}</p>}
          <div className="flex justify-end gap-2">
            <button className="ghost-btn" onClick={() => setFlagging(null)} data-testid="button-cancel-flag">Cancel</button>
            <button className="ink-btn" disabled={flagM.isPending} onClick={submitFlag} data-testid="button-submit-flag">{flagM.isPending ? "Saving..." : "Save flag"}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl bg-[hsl(var(--card))]">
          <DialogHeader>
            <DialogTitle className="hand text-3xl font-bold">Edit "{editing?.section.title}"</DialogTitle>
            <DialogDescription>Your version is saved and labeled "Student edited". It won't be presented as checked by AI.</DialogDescription>
          </DialogHeader>
          {editing?.flag && <p className="rounded-lg bg-[hsl(4_80%_96%)] p-2.5 text-sm">Fixing flag: "{editing.flag.highlightedText}"</p>}
          <textarea className="field min-h-[260px] leading-relaxed" maxLength={12000} value={editText} onChange={(e) => setEditText(e.target.value)} data-testid="input-edit-section" />
          {fixM.isError && <p className="text-sm text-[hsl(var(--pen-red))]">{errMsg(fixM.error)}</p>}
          <div className="flex justify-end gap-2">
            <button className="ghost-btn" onClick={() => setEditing(null)} data-testid="button-cancel-edit">Cancel</button>
            <button className="ink-btn" disabled={fixM.isPending || !editText.trim()} onClick={submitEdit} data-testid="button-save-edit">{fixM.isPending ? "Saving..." : "Save my edit"}</button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-[hsl(var(--card))]">
          <AlertDialogHeader>
            <AlertDialogTitle className="hand text-3xl">Delete this notebook?</AlertDialogTitle>
            <AlertDialogDescription>"{n.title}", its flags and its run history will be removed for good.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-[hsl(var(--pen-red))]" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
