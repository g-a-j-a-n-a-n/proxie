import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWorkspaceQueryKey, useGetWorkspace, useUpdatePreferences } from "@workspace/api-client-react";
import { Award, Flame, PauseCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EmptyNote, ErrorState, HandTitle, HonestLabel, PageSkeleton } from "@/components/states";
import { useToast } from "@/hooks/use-toast";
import { LEVELS, errMsg } from "@/lib/proxie";

export default function Progress() {
  const ws = useGetWorkspace();
  const qc = useQueryClient();
  const { toast } = useToast();
  const prefs = useUpdatePreferences();
  if (ws.isLoading) return <PageSkeleton />;
  if (ws.isError || !ws.data) return <ErrorState message={errMsg(ws.error)} onRetry={() => ws.refetch()} />;
  const { xp, streak, badges, preferences, courses } = ws.data;
  const answers = courses.reduce((a, c) => a + c.answerCount, 0);

  const togglePause = (v: boolean) => prefs.mutate({ data: { streakPaused: v } }, {
    onSuccess: () => { qc.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() }); toast({ title: v ? "Streak paused" : "Streak resumed", description: v ? "No penalty while it's paused." : "Welcome back." }); },
    onError: (e) => toast({ title: "Didn't save", description: errMsg(e), variant: "destructive" }),
  });

  return (
    <div className="space-y-12">
      <div className="rise">
        <HandTitle className="text-[52px] md:text-[64px]" tone="pink">Progress</HandTitle>
        <p className="mt-3 max-w-xl text-[hsl(var(--ink)/0.75)]">How your understanding is moving. It's a study signal, never an official grade.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl bg-[hsl(var(--ink))] p-6 text-[hsl(44_60%_96%)]">
          <p className="mono text-xs uppercase tracking-widest opacity-70">Total XP</p>
          <p className="hand mt-1 text-[64px] font-bold leading-none" data-testid="text-total-xp">{xp}</p>
          <p className="mt-2 text-sm opacity-80">Based on {answers} quiz answer{answers === 1 ? "" : "s"} across {courses.length} course{courses.length === 1 ? "" : "s"}. Earned by correct answers, more for hard ones and spaced review.</p>
        </div>
        <div className="rounded-2xl bg-[hsl(var(--card))] p-6">
          <p className="mono flex items-center gap-1.5 text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))]"><Flame className="h-3.5 w-3.5 text-[hsl(var(--pen-red))]" /> Review streak</p>
          <p className="hand mt-1 text-[64px] font-bold leading-none" data-testid="text-streak-days">{streak}<span className="text-3xl"> day{streak === 1 ? "" : "s"}</span></p>
          <label className="mt-3 flex items-center gap-3 text-sm">
            <Switch checked={preferences.streakPaused} disabled={prefs.isPending} onCheckedChange={togglePause} data-testid="switch-pause-streak" />
            <span><b>Pause streak</b><span className="block text-[hsl(var(--muted-foreground))]">Sick week, exams, life. No penalty.</span></span>
          </label>
          {preferences.streakPaused && <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--pen-blue))]"><PauseCircle className="h-4 w-4" /> Paused</p>}
        </div>
        <div className="sticky-note tape relative rotate-[1deg] rounded-sm p-6">
          <p className="mono flex items-center gap-1.5 text-xs uppercase tracking-widest text-[hsl(var(--ink)/0.6)]"><Award className="h-3.5 w-3.5" /> Badges</p>
          {badges.length === 0 ? (
            <p className="mt-2 text-[15px]">None yet. Your first quiz, a fully mastered unit and a week of review all earn one.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => <li key={b} className="rounded-full border-2 border-[hsl(var(--ink))] bg-[hsl(44_60%_98%)] px-3 py-1 text-sm font-bold" data-testid={`badge-${b}`}>{b}</li>)}
            </ul>
          )}
        </div>
      </div>

      <section>
        <h2 className="hand mb-4 text-[40px] font-bold">By course</h2>
        {courses.length === 0 ? (
          <EmptyNote tone="green" title="Nothing to measure yet" body="Progress comes from quiz answers on a course's skill tree." action={<Link href="/courses" className="ink-btn" data-testid="link-setup-course">Set up a course</Link>} />
        ) : (
          <div className="space-y-4">
            {courses.map((c) => {
              const total = c.topics.length || 1;
              return (
                <Link key={c.id} href={`/courses/${c.id}`} className="block rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-colors hover:border-[hsl(var(--ink)/0.4)]" data-testid={`row-progress-${c.id}`}>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                    <span className="hand text-3xl font-bold">{c.name}</span>
                    <span className="mono ml-auto text-sm">{c.xp} XP</span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {(Object.keys(LEVELS) as (keyof typeof LEVELS)[]).map((k) => {
                      const n = c.topics.filter((t) => t.level === k).length;
                      return (
                        <div key={k}>
                          <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full origin-left rounded-full" style={{ background: LEVELS[k].dot, transform: `scaleX(${n / total})` }} /></div>
                          <p className="mt-1 text-xs"><b>{n}</b> {k}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3"><HonestLabel>Based on {c.answerCount} quiz answer{c.answerCount === 1 ? "" : "s"} in this course{c.placementDone ? "" : " · placement check not taken"}</HonestLabel></div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
