import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetRunQueryKey, getGetWorkspaceQueryKey, useBuildNotebook, useGetRun, useGetWorkspace, useRequestUploadUrl } from "@workspace/api-client-react";
import type { NotebookInput } from "@workspace/api-client-react";
import { AlertTriangle, ClipboardPaste, FileUp, Layers, Wand2 } from "lucide-react";
import { RunDiagram } from "@/components/run-diagram";
import { ErrorState, HandTitle, PageSkeleton } from "@/components/states";
import { errMsg } from "@/lib/proxie";
import { cn } from "@/lib/utils";

type Mode = "pdf" | "paste" | "compile";
const MAX_PDF = 15 * 1024 * 1024;
const MAX_TX = 120_000;

export default function NewNotebook() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const ws = useGetWorkspace();
  const build = useBuildNotebook();
  const reqUrl = useRequestUploadUrl();
  const [mode, setMode] = useState<Mode>("pdf");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const navigated = useRef(false);

  const run = useGetRun(runId ?? "", {
    query: {
      enabled: !!runId,
      queryKey: getGetRunQueryKey(runId ?? ""),
      refetchInterval: (q) => (q.state.data?.status === "running" && q.state.dataUpdateCount < 600 ? 1000 : false),
    },
  });
  const r = run.data;
  const doneId = r?.status === "complete" ? r.notebookId : undefined;
  useEffect(() => {
    if (!doneId || navigated.current) return;
    navigated.current = true;
    qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
    const t = setTimeout(() => setLocation(`/notebooks/${doneId}`), 600);
    return () => clearTimeout(t);
  }, [doneId, qc, setLocation]);
  const failed = r?.status === "failed";
  useEffect(() => {
    if (failed) qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
  }, [failed, qc]);

  const savedSources = useMemo(() => {
    const out: { id: string; name: string; type: string; from: string }[] = [];
    const seen = new Set<string>();
    ws.data?.notebooks.forEach((n) => n.sources.forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); out.push({ id: s.id, name: s.name, type: s.type, from: n.title }); } }));
    ws.data?.courses.forEach((c) => c.sources.forEach((s) => { if (!seen.has(s.id)) { seen.add(s.id); out.push({ id: s.id, name: s.name, type: s.type, from: c.name }); } }));
    return out;
  }, [ws.data]);

  if (ws.isLoading) return <PageSkeleton rows={1} />;
  if (ws.isError) return <ErrorState message={errMsg(ws.error)} onRetry={() => ws.refetch()} />;

  const pickFile = (f: File | null) => {
    setError(null);
    if (!f) return setFile(null);
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return setError("That file isn't a PDF. Export the slides as PDF, or paste a transcript instead.");
    if (f.size > MAX_PDF) return setError(`That PDF is ${(f.size / 1048576).toFixed(1)} MB. The limit is 15 MB and 100 pages; try splitting it.`);
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  };

  const busy = uploading || build.isPending || r?.status === "running";
  const ready = consent && title.trim().length > 0 && (mode === "pdf" ? !!file : mode === "paste" ? transcript.trim().length > 0 && transcript.length <= MAX_TX : picked.length > 0);

  const start = async () => {
    setError(null);
    navigated.current = false;
    const base: NotebookInput = { title: title.trim(), consent, ...(courseId ? { courseId } : {}) };
    try {
      let input: NotebookInput = base;
      if (mode === "pdf" && file) {
        setUploading(true);
        const up = await reqUrl.mutateAsync({ data: { name: file.name, size: file.size, contentType: "application/pdf" } });
        const put = await fetch(up.uploadURL, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
        if (!put.ok) throw new Error("The upload didn't finish. Check your connection and try again.");
        input = { ...base, objectPath: up.objectPath, filename: file.name };
      } else if (mode === "paste") input = { ...base, transcript };
      else input = { ...base, sourceIds: picked };
      const started = await build.mutateAsync({ data: input });
      setRunId(started.id);
      qc.setQueryData(getGetRunQueryKey(started.id), started);
    } catch (e) {
      setError(errMsg(e, "Couldn't start the build."));
    } finally {
      setUploading(false);
    }
  };

  const tabs: { k: Mode; label: string; icon: typeof FileUp }[] = [
    { k: "pdf", label: "Upload slides", icon: FileUp },
    { k: "paste", label: "Paste transcript", icon: ClipboardPaste },
    { k: "compile", label: "Compile saved", icon: Layers },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="rise">
        <HandTitle className="text-[52px] md:text-[60px]">New notebook</HandTitle>
        <p className="mt-3 max-w-lg text-[hsl(var(--ink)/0.75)]">Bring the material, Proxie writes the notes. Every line will cite where it came from.</p>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {tabs.map((t) => (
            <button key={t.k} role="tab" aria-selected={mode === t.k} disabled={busy} onClick={() => { setMode(t.k); setError(null); }} data-testid={`tab-${t.k}`}
              className={cn("flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors", mode === t.k ? "border-[hsl(var(--ink))] bg-[hsl(var(--hl-yellow))]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--ink)/0.4)]")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="paper-grid mt-5 space-y-5 rounded-2xl border border-[hsl(var(--border))] p-5 md:p-7">
          <label className="block">
            <span className="hand text-2xl font-bold">Title</span>
            <input className="field mt-1" maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 6: Cellular respiration" data-testid="input-title" />
          </label>
          <label className="block">
            <span className="hand text-2xl font-bold">Course</span>
            <select className="field mt-1" value={courseId} onChange={(e) => setCourseId(e.target.value)} data-testid="select-course">
              <option value="">Make a new course from this notebook</option>
              {ws.data?.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          {mode === "pdf" && (
            <label className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors", file ? "border-[hsl(110_50%_40%)] bg-[hsl(var(--hl-green)/0.25)]" : "border-[hsl(var(--ink)/0.3)] bg-[hsl(var(--card)/0.7)] hover:bg-[hsl(var(--hl-yellow)/0.2)]")}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files[0] ?? null); }}>
              <FileUp className="h-8 w-8 text-[hsl(var(--pen-blue))]" />
              <span className="mt-2 font-bold">{file ? file.name : "Drop the lecture PDF here, or click to choose"}</span>
              <span className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{file ? `${(file.size / 1048576).toFixed(2)} MB` : "PDF only, up to 15 MB and 100 pages. Scanned slides without text won't work."}</span>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} data-testid="input-file" />
            </label>
          )}

          {mode === "paste" && (
            <label className="block">
              <span className="hand text-2xl font-bold">Transcript</span>
              <textarea className="field mt-1 min-h-[260px] font-[inherit] leading-relaxed" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="[00:00] Okay, let's pick up where we left off..." data-testid="input-transcript" />
              <span className={cn("mono mt-1 block text-right text-xs", transcript.length > MAX_TX ? "text-[hsl(var(--pen-red))]" : "text-[hsl(var(--muted-foreground))]")}>
                {transcript.length.toLocaleString()} / {MAX_TX.toLocaleString()}{transcript.length > MAX_TX ? " · too long, trim it or split into two notebooks" : ""}
              </span>
            </label>
          )}

          {mode === "compile" && (
            savedSources.length === 0 ? (
              <p className="rounded-xl bg-[hsl(var(--card))] p-4 text-[15px] text-[hsl(var(--muted-foreground))]">Nothing saved yet. Once you build a notebook from slides or a transcript, its sources show up here so you can mix them into a study guide.</p>
            ) : (
              <div>
                <span className="hand text-2xl font-bold">Pick saved sources</span>
                <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
                  {savedSources.map((s) => (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-[hsl(var(--card))] px-3 py-2.5">
                        <input type="checkbox" className="h-4 w-4 accent-[hsl(226_60%_36%)]" checked={picked.includes(s.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id)))} data-testid={`checkbox-source-${s.id}`} />
                        <span className="flex-1"><b>{s.name}</b><span className="block text-xs text-[hsl(var(--muted-foreground))]">{s.type} · from {s.from}</span></span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          <label className="flex items-start gap-3 rounded-xl bg-[hsl(var(--card))] p-3.5 text-[15px]">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(226_60%_36%)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="checkbox-consent" />
            <span>I already have access to this material (posted slides, a shared transcript, my own notes). Proxie doesn't record lectures.</span>
          </label>

          {error && (
            <div className="flex gap-2 rounded-xl border border-[hsl(var(--pen-red)/0.4)] bg-[hsl(4_80%_96%)] p-3.5 text-[15px] text-[hsl(var(--pen-red))]" role="alert" data-testid="text-build-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}{mode === "pdf" && " You can paste a transcript in the meantime."}</span>
            </div>
          )}

          <button className="ink-btn w-full !py-3 text-lg" disabled={!ready || busy} onClick={start} data-testid="button-build">
            <Wand2 className="h-5 w-5" /> {uploading ? "Uploading..." : busy ? "Building..." : "Build notebook"}
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        {runId && r ? (
          <>
            <RunDiagram events={r.events} running={r.status === "running"} title={r.status === "complete" ? "Done. Opening..." : r.status === "failed" ? "Build stopped" : "Building"} />
            {r.status === "failed" && (
              <p className="mt-3 rounded-xl bg-[hsl(4_80%_96%)] p-3.5 text-[15px] text-[hsl(var(--pen-red))]" data-testid="text-run-error">
                {r.error ?? "The build didn't finish."} Your input is still here, so adjust and try again.
              </p>
            )}
            {run.isError && <p className="mt-3 text-sm text-[hsl(var(--pen-red))]">Lost track of the build: {errMsg(run.error)}</p>}
          </>
        ) : (
          <div className="sticky-note tape relative rotate-[1deg] rounded-sm p-6">
            <p className="hand text-3xl font-bold">What happens next</p>
            <ol className="mt-3 space-y-2 text-[15px]">
              {["Check the input", "Pull text with page numbers", "Summarize each section with citations", "Retry or fall back if a step fails", "Match every sentence to a source", "Save and open your notebook"].map((s, i) => (
                <li key={i} className="flex gap-2"><span className="hand text-xl font-bold text-[hsl(var(--pen-blue))]">{i + 1}.</span>{s}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-[hsl(var(--ink)/0.7)]">You'll watch each step happen here, live.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
