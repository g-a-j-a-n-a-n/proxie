import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetQuizQueryKey, getGetWorkspaceQueryKey, useGetQuiz, useSubmitAnswer } from "@workspace/api-client-react";
import type { AnswerResult, Course } from "@workspace/api-client-react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errMsg } from "@/lib/proxie";
import { cn } from "@/lib/utils";

export type QuizMode = { kind: "placement" } | { kind: "review"; topicId?: string };

export function QuizDialog({ course, mode, onClose }: { course: Course; mode: QuizMode | null; onClose: () => void }) {
  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto bg-[hsl(var(--card))]">
        {mode && <QuizBody key={JSON.stringify(mode)} course={course} mode={mode} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function QuizBody({ course, mode, onClose }: { course: Course; mode: QuizMode; onClose: () => void }) {
  const qc = useQueryClient();
  const quiz = useGetQuiz(course.id, { query: { queryKey: getGetQuizQueryKey(course.id), staleTime: 60_000 } });
  const submit = useSubmitAnswer();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [tally, setTally] = useState({ correct: 0, xp: 0, answered: 0 });

  const placement = mode.kind === "placement";
  const topicName = mode.kind === "review" && mode.topicId ? course.topics.find((t) => t.id === mode.topicId)?.name : undefined;

  const questions = useMemo(() => {
    const all = quiz.data ?? [];
    if (mode.kind === "review" && mode.topicId) return all.filter((q) => q.topicId === mode.topicId);
    if (placement) {
      // Short diagnostic: up to two per topic, max 12.
      const per = new Map<string, number>();
      return all.filter((q) => {
        const n = per.get(q.topicId) ?? 0;
        if (n >= 2) return false;
        per.set(q.topicId, n + 1);
        return true;
      }).slice(0, 12);
    }
    return all.filter((q) => course.topics.find((t) => t.id === q.topicId)?.level !== "Locked").slice(0, 10);
  }, [quiz.data, mode, placement]);

  const q = questions[idx];
  const done = questions.length > 0 && idx >= questions.length;

  const answer = () => {
    if (picked === null || !q) return;
    submit.mutate({ data: { questionId: q.id, option: picked, placement } }, {
      onSuccess: (r) => {
        setResult(r);
        setTally((t) => ({ correct: t.correct + (r.correct ? 1 : 0), xp: t.xp + r.xpEarned, answered: t.answered + 1 }));
        qc.setQueryData(getGetWorkspaceQueryKey(), (old: unknown) => {
          const ws = old as { courses?: Course[] } | undefined;
          if (!ws?.courses) return old;
          return { ...ws, courses: ws.courses.map((c) => (c.id === r.course.id ? r.course : c)) };
        });
      },
    });
  };
  const next = () => {
    setIdx((i) => i + 1);
    setPicked(null);
    setResult(null);
    submit.reset();
  };
  const finish = () => {
    qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
    onClose();
  };

  const heading = placement ? "Placement check" : topicName ? `Review: ${topicName}` : "Review quiz";

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="hand text-[34px] font-bold leading-none"><span className="marker-underline green">{heading}</span></DialogTitle>
        <DialogDescription>
          {placement ? "A short diagnostic to set where each topic starts. Getting things wrong here is useful, not a penalty." : "XP comes from correct answers, more for harder and spaced-out review. Speed earns nothing."}
        </DialogDescription>
      </DialogHeader>

      {quiz.isLoading && <div className="mt-6 space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[hsl(var(--muted))]" />)}</div>}
      {quiz.isError && (
        <div className="mt-6 text-sm">
          <p className="text-[hsl(var(--pen-red))]">{errMsg(quiz.error, "Couldn't load questions.")}</p>
          <button className="ghost-btn mt-3" onClick={() => quiz.refetch()} data-testid="button-quiz-retry">Try again</button>
        </div>
      )}
      {quiz.isSuccess && questions.length === 0 && (
        <div className="mt-6 rounded-xl bg-[hsl(var(--hl-yellow)/0.35)] p-4 text-[15px]" data-testid="status-quiz-empty">
          <p className="font-bold">No questions yet{topicName ? ` for ${topicName}` : ""}.</p>
          <p className="mt-1 text-[hsl(var(--ink)/0.8)]">Proxie only writes questions it can cite from your materials, and your sources don't say enough about this yet. Build a notebook from lecture slides or a transcript for this course, then come back.</p>
        </div>
      )}

      {q && !done && (
        <div className="mt-5" data-testid="panel-question">
          <div className="flex items-center justify-between text-xs">
            <span className="mono text-[hsl(var(--muted-foreground))]">Question {idx + 1} of {questions.length}</span>
            <span className="mono rounded-full bg-[hsl(var(--muted))] px-2 py-0.5">difficulty {q.difficulty}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
            <div className="h-full origin-left rounded-full bg-[hsl(var(--pen-blue))] transition-transform" style={{ transform: `scaleX(${idx / questions.length})` }} />
          </div>
          <p className="mt-4 text-[17px] font-bold leading-snug">{q.text}</p>
          <p className="mono mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">from {q.citation.locator}</p>
          <div className="mt-4 space-y-2" role="radiogroup">
            {q.options.map((o, i) => {
              const isRight = result && result.correctOption === i;
              const isWrongPick = result && picked === i && !result.correct;
              return (
                <button key={i} role="radio" aria-checked={picked === i} disabled={!!result || submit.isPending} onClick={() => setPicked(i)} data-testid={`button-option-${i}`}
                  className={cn("flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] transition-colors",
                    isRight ? "border-[hsl(110_50%_38%)] bg-[hsl(var(--hl-green)/0.45)]" : isWrongPick ? "border-[hsl(var(--pen-red))] bg-[hsl(4_80%_95%)]" :
                      picked === i ? "border-[hsl(var(--pen-blue))] bg-[hsl(var(--pen-blue)/0.06)]" : "border-[hsl(var(--border))] hover:border-[hsl(var(--ink)/0.4)]")}>
                  <span className="hand grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-current text-lg font-bold">{"ABCD"[i]}</span>
                  <span className="flex-1">{o}</span>
                  {isRight && <Check className="h-5 w-5 text-[hsl(110_50%_32%)]" />}
                  {isWrongPick && <X className="h-5 w-5 text-[hsl(var(--pen-red))]" />}
                </button>
              );
            })}
          </div>
          {submit.isError && <p className="mt-3 text-sm text-[hsl(var(--pen-red))]">{errMsg(submit.error, "Your answer didn't save. Try again.")}</p>}
          {result && (
            <div className="pop mt-4 rounded-xl bg-[hsl(var(--muted))] p-4 text-[15px]" data-testid="text-explanation">
              <p className="font-bold">{result.correct ? "Correct." : "Not quite."} {result.xpEarned > 0 && <span className="text-[hsl(110_50%_30%)]">+{result.xpEarned} XP</span>}</p>
              <p className="mt-1 text-[hsl(var(--ink)/0.85)]">{result.explanation}</p>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            {!result ? (
              <button className="ink-btn" disabled={picked === null || submit.isPending} onClick={answer} data-testid="button-submit-answer">{submit.isPending ? "Checking..." : "Check answer"}</button>
            ) : (
              <button className="ink-btn" onClick={next} data-testid="button-next-question">{idx + 1 < questions.length ? "Next question" : "See summary"} <ArrowRight className="h-4 w-4" /></button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="pop mt-6 text-center" data-testid="panel-quiz-summary">
          <Sparkles className="mx-auto h-8 w-8 text-[hsl(42_92%_45%)]" />
          <p className="hand mt-2 text-4xl font-bold">{tally.correct} of {tally.answered} correct</p>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">{tally.xp} XP earned. {placement ? "Starting levels are set on your skill tree." : "Levels update from spaced-out sessions, so come back another day too."}</p>
          <button className="ink-btn mt-5" onClick={finish} data-testid="button-finish-quiz">Back to the tree</button>
        </div>
      )}
    </div>
  );
}
