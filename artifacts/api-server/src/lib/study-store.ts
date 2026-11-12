import { db, studentWorkspaces } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { GetWorkspaceResponse, GetNotebookResponse, CreateCourseResponse, GetRunResponse, GetQuizResponseItem } from "@workspace/api-zod";

export type Notebook = z.infer<typeof GetNotebookResponse>;
export type Course = z.infer<typeof CreateCourseResponse>;
export type Run = z.infer<typeof GetRunResponse>;
export type Source = Notebook["sources"][number];
export type Section = Notebook["sections"][number];
export type Citation = Section["summary"]["citation"];
export type Question = z.infer<typeof GetQuizResponseItem> & { correctOption: number; explanation: string };
export type State = z.infer<typeof GetWorkspaceResponse> & {
  questions: Question[];
  answers: { questionId: string; topicId: string; courseId: string; correct: boolean; at: string; placement: boolean }[];
  uploads: { path: string; name: string; size: number }[];
  reviewDays: string[];
  streakResumeGrace?: boolean;
};
export const emptyState = (): State => ({
  notebooks: [], courses: [], runs: [], questions: [], answers: [], uploads: [],
  reviewDays: [], xp: 0, streak: 0, badges: [], preferences: { streakPaused: false }, quests: [],
});

export function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
export async function readState(userId: string): Promise<State> {
  const [row] = await db.select().from(studentWorkspaces).where(eq(studentWorkspaces.userId, userId));
  return row ? row.data as State : emptyState();
}
export async function changeState<T>(userId: string, change: (state: State) => T): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.insert(studentWorkspaces).values({ userId, data: emptyState() }).onConflictDoNothing();
    const rows = await tx.select().from(studentWorkspaces).where(eq(studentWorkspaces.userId, userId)).for("update");
    const state = rows[0]!.data as State;
    const result = change(state);
    await tx.update(studentWorkspaces).set({ data: state, updatedAt: new Date() }).where(eq(studentWorkspaces.userId, userId));
    return result;
  });
}
export async function addEvent(userId: string, runId: string, step: string, result: string, status: "ok" | "failed" | "recovered" = "ok", started = Date.now()) {
  await changeState(userId, (state) => {
    const run = state.runs.find(r => r.id === runId);
    if (run) run.events.push({ step, status, result, durationMs: Math.max(1, Date.now() - started), startedAt: new Date(started).toISOString() });
  });
}
export function publicWorkspace(state: State) {
  const result = structuredClone(state);
  const now = Date.now();
  for (const course of result.courses) {
    for (const topic of course.topics) {
      if (topic.level === "Mastered" && topic.lastReviewedAt && now - Date.parse(topic.lastReviewedAt) > 30 * 86400000 && !state.preferences.streakPaused) topic.level = "Practicing";
    }
  }
  result.quests = result.courses.flatMap(c => c.topics.filter(t => t.level !== "Mastered" && t.level !== "Locked").slice(0, 3).map(t => ({
    courseId: c.id, topicId: t.id, title: t.name,
    reason: t.lastReviewedAt ? "Strengthen a topic with spaced review" : "Prepare for the next topic in syllabus order",
  }))).slice(0, 6);
  return GetWorkspaceResponse.parse(result);
}
// A process interruption must not leave a replay permanently marked as running.
export async function recoverInterruptedRuns() {
  await db.update(studentWorkspaces).set({
    data: sql`jsonb_set(data, '{runs}', COALESCE((SELECT jsonb_agg(CASE WHEN r->>'status' = 'running' THEN jsonb_set(jsonb_set(r, '{status}', '"failed"'), '{error}', '"The server restarted during this build. Your saved materials are safe; please try again."') ELSE r END) FROM jsonb_array_elements(data->'runs') AS r), '[]'::jsonb))`,
  });
}
