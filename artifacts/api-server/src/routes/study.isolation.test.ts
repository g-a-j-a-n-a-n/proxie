import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import express, { type Request } from "express";
import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, studentWorkspaces } from "@workspace/db";
import { changeState, readState, type Citation, type Source, type State } from "../lib/study-store";
import { createStudyRouter } from "./study";

const studentA = `clerk_test_student_a_${randomUUID()}`;
const studentB = `clerk_test_student_b_${randomUUID()}`;
const identityFixtures = new Map([
  ["student-a", studentA],
  ["student-b", studentB],
]);

const ids = {
  sourceA: randomUUID(),
  sourceB: randomUUID(),
  notebookA: randomUUID(),
  notebookB: randomUUID(),
  sectionA: randomUUID(),
  sectionB: randomUUID(),
  runA: randomUUID(),
  runB: randomUUID(),
  courseA: randomUUID(),
  courseB: randomUUID(),
  topicA: randomUUID(),
  topicB: randomUUID(),
  questionA: randomUUID(),
  questionB: randomUUID(),
};
const source = (id: string, objectPath: string, text: string): Source => ({
  id,
  name: "Private lecture slides",
  type: "pdf" as const,
  objectPath,
  pages: [{ locator: "Slide 1", text }],
});
const sourceA = source(ids.sourceA, "/objects/student-a/lecture.pdf", "A-only biology source text.");
const sourceB = source(ids.sourceB, "/objects/student-b/lecture.pdf", "B-only history source text.");
const citationA: Citation = { sourceId: ids.sourceA, locator: "Slide 1", quote: "A-only biology source text." };
const citationB: Citation = { sourceId: ids.sourceB, locator: "Slide 1", quote: "B-only history source text." };
const section = (id: string, citation: Citation, text: string) => ({
  id,
  title: `${text} section`,
  summary: { text, citation },
  points: [{ text, citation }],
  terms: [],
  diagram: [],
  status: "Source syllabus",
});
const notebook = (id: string, courseId: string, runId: string, sourceId: string, sectionId: string, citation: Citation, text: string) => ({
  id,
  title: `${text} notebook`,
  courseId,
  createdAt: new Date().toISOString(),
  sections: [section(sectionId, citation, text)],
  sources: [sourceId === ids.sourceA ? sourceA : sourceB],
  flags: [],
  runId,
  disclaimer: "Fixture",
});
const course = (id: string, topicId: string, runId: string, src: Source, citation: Citation, title: string) => ({
  id,
  name: `${title} course`,
  color: "sage",
  topics: [{
    id: topicId,
    name: `${title} topic`,
    position: 0,
    level: "Unlocked" as const,
    citation,
    prerequisites: [],
    correctSessions: 0,
    lastReviewedAt: null,
  }],
  answerCount: 0,
  xp: 0,
  placementDone: false,
  sources: [src],
  runId,
});
const run = (id: string, notebookId: string) => ({
  id,
  status: "complete" as const,
  notebookId,
  events: [],
});
const question = (id: string, courseId: string, topicId: string, citation: Citation, text: string) => ({
  id,
  courseId,
  topicId,
  text: `${text} question`,
  options: ["One", "Two", "Three", "Four"],
  correctOption: 0,
  explanation: `${text} explanation`,
  difficulty: 1,
  citation,
});

let server: Server;
let apiUrl: string;

async function putFixture(userId: string, owner: "a" | "b") {
  const a = owner === "a";
  const notebookId = a ? ids.notebookA : ids.notebookB;
  const courseId = a ? ids.courseA : ids.courseB;
  const runId = a ? ids.runA : ids.runB;
  const topicId = a ? ids.topicA : ids.topicB;
  const sourceId = a ? ids.sourceA : ids.sourceB;
  const citation = a ? citationA : citationB;
  const src = a ? sourceA : sourceB;
  const text = a ? "A-only biology" : "B-only history";
  const sectionId = a ? ids.sectionA : ids.sectionB;
  await changeState(userId, (state) => {
    state.notebooks = [notebook(notebookId, courseId, runId, sourceId, sectionId, citation, text)];
    state.courses = [course(courseId, topicId, runId, src, citation, text)];
    state.runs = [run(runId, notebookId)];
    state.questions = [question(a ? ids.questionA : ids.questionB, courseId, topicId, citation, text)];
    state.uploads = [{ path: src.objectPath!, name: src.name, size: 1024 }];
  });
}

before(async () => {
  await putFixture(studentA, "a");
  await putFixture(studentB, "b");

  const app = express();
  app.use(pinoHttp({ logger: pino({ enabled: false }), autoLogging: false }));
  app.use(express.json());
  // This adapter exists only in this test server. Production continues to use Clerk's getAuth().
  app.use("/api", createStudyRouter((req: Request) => {
    const fixtureName = req.header("x-test-student");
    return fixtureName ? identityFixtures.get(fixtureName) : undefined;
  }));
  app.use((error: any, _req: Request, res: express.Response, _next: express.NextFunction) => {
    res.status(error?.status || 500).json({ error: error?.status ? error.message : "Unexpected test server error" });
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  apiUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await db.delete(studentWorkspaces).where(eq(studentWorkspaces.userId, studentA));
  await db.delete(studentWorkspaces).where(eq(studentWorkspaces.userId, studentB));
  await pool.end();
});

function request(path: string, options: RequestInit = {}, student?: "student-a" | "student-b") {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (student) headers.set("x-test-student", student);
  return fetch(`${apiUrl}${path}`, { ...options, headers });
}

async function snapshot(userId: string): Promise<State> {
  return structuredClone(await readState(userId));
}

test("two authenticated Clerk student fixtures stay isolated across study routes", async (t) => {
  await t.test("signed-out requests cannot read or mutate private routes", async () => {
    const signedOut = [
      request("/workspace"),
      request(`/notebooks/${ids.notebookA}`),
      request(`/runs/${ids.runA}`),
      request(`/courses/${ids.courseA}/quiz`),
      request(`/storage/objects/student-a/lecture.pdf`),
      request("/notebooks", { method: "POST", body: JSON.stringify({ title: "No access", transcript: "A lecture transcript long enough to pass validation.", consent: true }) }),
      request("/courses", { method: "POST", body: JSON.stringify({ name: "No access", syllabus: "A syllabus long enough to pass validation." }) }),
      request(`/notebooks/${ids.notebookA}/flags`, { method: "POST", body: JSON.stringify({}) }),
      request(`/notebooks/${ids.notebookA}/sections/${ids.sectionA}`, { method: "PATCH", body: JSON.stringify({}) }),
      request(`/courses/${ids.courseA}`, { method: "PATCH", body: JSON.stringify({}) }),
      request(`/notebooks/${ids.notebookA}`, { method: "DELETE" }),
      request(`/courses/${ids.courseA}`, { method: "DELETE" }),
      request("/answers", { method: "POST", body: JSON.stringify({ questionId: ids.questionA, option: 0, placement: false }) }),
      request("/preferences", { method: "PATCH", body: JSON.stringify({ streakPaused: true }) }),
      request("/storage/uploads/request-url", { method: "POST", body: JSON.stringify({ name: "private.pdf", size: 1024, contentType: "application/pdf" }) }),
    ];
    for (const response of await Promise.all(signedOut)) assert.equal(response.status, 401);
  });

  await t.test("each workspace returns only its own materials", async () => {
    const [responseA, responseB] = await Promise.all([
      request("/workspace", {}, "student-a"),
      request("/workspace", {}, "student-b"),
    ]);
    assert.equal(responseA.status, 200);
    assert.equal(responseB.status, 200);
    const [workspaceA, workspaceB] = await Promise.all([responseA.json(), responseB.json()]);
    assert.match(JSON.stringify(workspaceA), /A-only biology/);
    assert.doesNotMatch(JSON.stringify(workspaceA), /B-only history/);
    assert.match(JSON.stringify(workspaceB), /B-only history/);
    assert.doesNotMatch(JSON.stringify(workspaceB), /A-only biology/);
    assert.equal(responseA.headers.get("cache-control"), "private, no-store");
    assert.equal(responseB.headers.get("cache-control"), "private, no-store");
  });

  await t.test("students can read their own notebook, run, and quiz", async () => {
    for (const path of [`/notebooks/${ids.notebookA}`, `/runs/${ids.runA}`, `/courses/${ids.courseA}/quiz`]) {
      assert.equal((await request(path, {}, "student-a")).status, 200, `student A should access ${path}`);
    }
    for (const path of [`/notebooks/${ids.notebookB}`, `/runs/${ids.runB}`, `/courses/${ids.courseB}/quiz`]) {
      assert.equal((await request(path, {}, "student-b")).status, 200, `student B should access ${path}`);
    }
  });

  await t.test("foreign notebook, run, source, quiz and PDF requests reveal nothing", async () => {
    const beforeA = await snapshot(studentA);
    const beforeB = await snapshot(studentB);
    const foreignResponses = await Promise.all([
      request(`/notebooks/${ids.notebookA}`, {}, "student-b"),
      request(`/runs/${ids.runA}`, {}, "student-b"),
      request(`/courses/${ids.courseA}/quiz`, {}, "student-b"),
      request(`/storage/objects/student-a/lecture.pdf`, {}, "student-b"),
    ]);
    for (const response of foreignResponses) assert.equal(response.status, 404);
    const waitForFailedRun = async (buildResponse: Response) => {
      assert.equal(buildResponse.status, 202);
      const buildRun = await buildResponse.json() as { id: string };
      let completedRun: any;
      for (let attempt = 0; attempt < 30; attempt++) {
        const response = await request(`/runs/${buildRun.id}`, {}, "student-b");
        completedRun = await response.json();
        if (completedRun.status !== "running") break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.equal(completedRun.status, "failed");
      assert.doesNotMatch(JSON.stringify(completedRun), /A-only biology source text/);
      return completedRun;
    };
    await waitForFailedRun(await request("/notebooks", {
      method: "POST",
      body: JSON.stringify({ title: "Attempt to compile another student's source", sourceIds: [ids.sourceA], consent: true }),
    }, "student-b"));
    await waitForFailedRun(await request("/notebooks", {
      method: "POST",
      body: JSON.stringify({ title: "Attempt to compile another student's PDF", objectPath: sourceA.objectPath, consent: true }),
    }, "student-b"));
    assert.deepEqual(await snapshot(studentA), beforeA);
    const afterB = await snapshot(studentB);
    assert.equal(afterB.notebooks.length, beforeB.notebooks.length);
    assert.equal(afterB.courses.length, beforeB.courses.length);
    assert.equal(afterB.runs.length, beforeB.runs.length + 2);
  });

  await t.test("foreign flag, fix, answer and delete attempts cannot mutate the owner", async () => {
    const beforeA = await snapshot(studentA);
    const foreignMutationResponses = await Promise.all([
      request(`/notebooks/${ids.notebookA}/flags`, {
        method: "POST",
        body: JSON.stringify({
          sectionId: ids.sectionA,
          highlightedText: "A-only biology",
          citation: citationA,
          note: "foreign flag attempt",
        }),
      }, "student-b"),
      request(`/notebooks/${ids.notebookA}/sections/${ids.sectionA}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "edit", text: "Changed by another student" }),
      }, "student-b"),
      request("/answers", {
        method: "POST",
        body: JSON.stringify({ questionId: ids.questionA, option: 0, placement: false }),
      }, "student-b"),
      request(`/notebooks/${ids.notebookA}`, { method: "DELETE" }, "student-b"),
      request(`/courses/${ids.courseA}`, { method: "PATCH", body: JSON.stringify({ name: "Hijacked course" }) }, "student-b"),
      request(`/courses/${ids.courseA}`, { method: "DELETE" }, "student-b"),
    ]);
    for (const response of foreignMutationResponses) assert.equal(response.status, 404);
    assert.deepEqual(await snapshot(studentA), beforeA);
  });
});
