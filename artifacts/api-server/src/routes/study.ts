import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import * as api from "@workspace/api-zod";
import { addEvent, changeState, fail, publicWorkspace, readState, type Course, type Run, type State } from "../lib/study-store";
import { courseFromSections, generateNotes, runNotebook, transcriptSource, validCitation } from "../lib/study-generation";
import { ObjectStorageService } from "../lib/objectStorage";
import { judgeUserId, seedJudgeWorkspace } from "../lib/judge-demo";
import { consumeGenerationBudget } from "../lib/generation-usage";

const storage = new ObjectStorageService();
type UserIdResolver = (req: Request) => string | null | undefined;

export function createStudyRouter(resolveUserId: UserIdResolver = (req) => getAuth(req).userId) {
const router: IRouter = Router();
function user(req: Request) { return resolveUserId(req)!; }
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) fail("Please check your input. " + result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
  return result.data;
}
const idParams = z.object({ id: z.string().uuid() });
function id(req: Request) { return parse(idParams, req.params).id; }
function notebook(state: State, notebookId: string) { return state.notebooks.find(n => n.id === notebookId) || fail("Notebook not found.", 404); }
function course(state: State, courseId: string) { return state.courses.find(c => c.id === courseId) || fail("Course not found.", 404); }

router.use((req: Request, res: Response, next: NextFunction) => {
  if (!resolveUserId(req)) { res.status(401).json({ error: "Sign in to access your private study materials." }); return; }
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

router.get("/workspace", async (req, res): Promise<void> => {
  res.json(publicWorkspace(await readState(user(req))));
});
router.post("/demo/reset", async (req, res): Promise<void> => {
  if (process.env.NODE_ENV !== "development" || user(req) !== judgeUserId) fail("This action is only available in the shared development judge account.", 404);
  await seedJudgeWorkspace(user(req));
  res.json({ reset: true });
});
router.get("/notebooks/:id", async (req, res): Promise<void> => {
  res.json(api.GetNotebookResponse.parse(notebook(await readState(user(req)), id(req))));
});
router.post("/notebooks", async (req, res): Promise<void> => {
  const input = parse(api.BuildNotebookBody, req.body);
  if (!input.title.trim()) fail("Give your notebook a title.");
  if (!input.consent) fail("Confirm that you have permission to use these materials.");
  if (!input.transcript?.trim() && !input.objectPath && !input.sourceIds?.length) fail("Paste a transcript, upload slides, or select saved sources.");
  if (input.transcript && input.transcript.trim().length < 20) fail("Please paste at least 20 characters of lecture content.");
  const run: Run = { id: randomUUID(), status: "running", events: [] };
  await changeState(user(req), s => {
    if (s.runs.some(r => r.status === "running")) fail("A notebook is already building. Wait for it to finish.");
    if (input.courseId) course(s, input.courseId);
    s.generationUsage = consumeGenerationBudget(s.generationUsage);
    s.runs.unshift(run);
  });
  await addEvent(user(req), run.id, "Page", "Student submitted materials and confirmed access permission");
  await addEvent(user(req), run.id, "Server", "Validated title, input length and permission");
  res.status(202).json(api.BuildNotebookResponse.parse(run));
  void runNotebook(user(req), run.id, input).catch(() => req.log.error("Notebook background job failed"));
});
router.delete("/notebooks/:id", async (req, res): Promise<void> => {
  const notebookId = id(req);
  await changeState(user(req), s => { notebook(s, notebookId); s.notebooks = s.notebooks.filter(n => n.id !== notebookId); });
  res.sendStatus(204);
});
router.get("/runs/:id", async (req, res): Promise<void> => {
  const run = (await readState(user(req))).runs.find(r => r.id === id(req));
  if (!run) fail("Run not found.", 404);
  res.json(api.GetRunResponse.parse(run));
});
router.post("/notebooks/:id/flags", async (req, res): Promise<void> => {
  const notebookId = id(req), input = parse(api.FlagContentBody, req.body);
  const result = await changeState(user(req), s => {
    const n = notebook(s, notebookId);
    const section = n.sections.find(v => v.id === input.sectionId);
    if (!section) fail("Section not found.", 404);
    if (!validCitation(input.citation, n.sources)) fail("Choose a citation from this notebook.");
    const content = [section.summary.text, ...section.points.map(p => p.text), ...section.terms.flatMap(t => [t.term, t.definition, t.example]), ...section.diagram.map(p => p.text)].join("\n");
    if (!input.highlightedText.trim() || !content.includes(input.highlightedText.trim())) fail("Select text that appears in this section.");
    n.flags.push({ ...input, id: randomUUID(), status: "open" });
    return n;
  });
  await addEvent(user(req), result.runId, "Flag", "Student flagged cited content for review");
  res.json(api.FlagContentResponse.parse(result));
});
router.patch("/notebooks/:id/sections/:sectionId", async (req, res): Promise<void> => {
  const notebookId = id(req);
  const sectionId = parse(z.object({ sectionId: z.string().uuid() }), req.params).sectionId;
  const input = parse(api.FixSectionBody, req.body);
  const n = notebook(await readState(user(req)), notebookId);
  const existing = n.sections.find(s => s.id === sectionId) || fail("Section not found.", 404);
  let replacement = structuredClone(existing);
  if (input.action === "regenerate") {
    await changeState(user(req), s => { s.generationUsage = consumeGenerationBudget(s.generationUsage); });
    const sourceIds = new Set([existing.summary.citation.sourceId, ...existing.points.map(p => p.citation.sourceId)]);
    const locators = new Set([existing.summary.citation.locator, ...existing.points.map(p => p.citation.locator)]);
    const sources = n.sources.filter(s => sourceIds.has(s.id)).map(s => ({ ...s, pages: s.pages.filter(p => locators.has(p.locator)) }));
    replacement = (await generateNotes(user(req), n.runId, sources, existing.title)).sections[0] || fail("No grounded replacement was returned.");
    replacement.id = sectionId;
  } else {
    if (!input.text?.trim()) fail("Enter your corrected section text.");
    const lines = input.text.trim().split(/\n/).map(line => line.trim()).filter(Boolean);
    const pointLines = lines.filter(line => /^[-*]\s/.test(line));
    const summaryLines = lines.filter(line => !/^[-*]\s/.test(line));
    replacement.summary = { ...existing.summary, text: summaryLines.join(" ") || pointLines[0]!.replace(/^[-*]\s/, "") };
    replacement.points = pointLines.map((line, i) => ({ text: line.replace(/^[-*]\s/, ""), citation: existing.points[i]?.citation || existing.summary.citation }));
    replacement.terms = []; replacement.diagram = [];
    replacement.status = "Student edited · original source reference, not AI-verified";
  }
  const result = await changeState(user(req), s => {
    const current = notebook(s, notebookId);
    const index = current.sections.findIndex(section => section.id === sectionId);
    if (index < 0) fail("Section no longer exists.", 404);
    current.sections[index] = replacement;
    for (const flag of current.flags.filter(f => f.sectionId === sectionId && f.status === "open" && (!input.flagId || f.id === input.flagId))) {
      flag.status = "resolved"; flag.before = JSON.stringify(existing); flag.after = JSON.stringify(replacement);
    }
    return current;
  });
  await addEvent(user(req), n.runId, input.action === "edit" ? "Edit" : "Regenerate", `Student ${input.action === "edit" ? "saved a correction" : "regenerated a section from its source"}`);
  await addEvent(user(req), n.runId, "Save", "Saved section and flag resolution history");
  res.json(api.FixSectionResponse.parse(result));
});

router.post("/courses", async (req, res): Promise<void> => {
  const input = parse(api.CreateCourseBody, req.body);
  if (!input.name.trim()) fail("Enter a course name.");
  const source = transcriptSource(input.syllabus, `${input.name} syllabus`);
  const run: Run = { id: randomUUID(), status: "running", events: [] };
  await changeState(user(req), s => {
    if (s.runs.some(r => r.status === "running")) fail("Wait for your current build to finish.");
    s.generationUsage = consumeGenerationBudget(s.generationUsage);
    s.runs.unshift(run);
  });
  try {
    await addEvent(user(req), run.id, "Page", "Student submitted a course syllabus");
    await addEvent(user(req), run.id, "Topic extraction", `Extracted ${Math.min(source.pages.length, 30)} ordered syllabus topics with line citations`);
    const sections = source.pages.slice(0, 30).map((p) => ({
      id: randomUUID(), title: p.text.slice(0, 100), summary: { text: p.text, citation: { sourceId: source.id, locator: p.locator, quote: p.text } },
      points: [], terms: [], diagram: [], status: "Source syllabus",
    }));
    const result = courseFromSections(input.name, [source], sections, run.id, input.color);
    const generated = await generateNotes(user(req), run.id, [source], input.name);
    await changeState(user(req), s => {
      s.courses.push(result);
      s.questions.push(...generated.questions.map(q => ({ ...q, courseId: result.id, topicId: result.topics.find(t => t.citation.locator === q.citation.locator)?.id || result.topics[0]!.id })));
      const currentRun = s.runs.find(r => r.id === run.id)!; currentRun.status = "complete";
    });
    await addEvent(user(req), run.id, "Database", "Saved course topics, citations and placement questions");
    res.status(201).json(api.CreateCourseResponse.parse(result));
  } catch (err) {
    await changeState(user(req), s => { const r = s.runs.find(x => x.id === run.id)!; r.status = "failed"; r.error = "Course setup did not finish. Please try again."; });
    throw err;
  }
});
function validateGraph(c: Course) {
  const ids = new Set(c.topics.map(t => t.id));
  if (ids.size !== c.topics.length) fail("Each topic must have a unique identifier.");
  for (const t of c.topics) if (t.prerequisites.some(id => !ids.has(id) || id === t.id)) fail("Topic links must point to other topics in this course.");
  const visited = new Set<string>(), active = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id)) fail("Topic links cannot form a circular dependency.");
    if (visited.has(id)) return;
    active.add(id);
    for (const p of c.topics.find(t => t.id === id)!.prerequisites) visit(p);
    active.delete(id); visited.add(id);
  };
  c.topics.forEach(t => visit(t.id));
}
function unlock(c: Course) {
  c.topics.forEach(t => {
    if (t.level === "Mastered" || t.level === "Practicing") return;
    t.level = t.prerequisites.every(id => { const p = c.topics.find(v => v.id === id); return p && (p.level === "Mastered" || p.level === "Practicing"); }) ? "Unlocked" : "Locked";
  });
}
router.patch("/courses/:id", async (req, res): Promise<void> => {
  const courseId = id(req), input = parse(api.UpdateCourseBody, req.body);
  const result = await changeState(user(req), s => {
    const c = course(s, courseId);
    if (input.name) c.name = input.name.trim() || fail("Course name cannot be blank.");
    if (input.mergeFromId && input.mergeIntoId) {
      const from = c.topics.find(t => t.id === input.mergeFromId), into = c.topics.find(t => t.id === input.mergeIntoId);
      if (!from || !into || from.id === into.id) fail("Select two different topics to merge.");
      c.topics = c.topics.filter(t => t.id !== from.id);
      for (const t of c.topics) t.prerequisites = [...new Set(t.prerequisites.map(p => p === from.id ? into.id : p))].filter(p => p !== t.id);
      for (const q of s.questions.filter(q => q.courseId === c.id && q.topicId === from.id)) q.topicId = into.id;
    }
    if (input.topics) {
      if (!input.topics.length || input.topics.length > 100) fail("Keep between 1 and 100 topics.");
      const old = new Map(c.topics.map(t => [t.id, t]));
      c.topics = input.topics.map((t, i) => {
        const previous = old.get(t.id) || fail("Topics must come from your saved course materials.");
        if (!t.name.trim() || t.name.length > 200) fail("Enter topic names of 1–200 characters.");
        return { ...previous, name: t.name.trim(), position: i, prerequisites: [...new Set(t.prerequisites)] };
      });
      const kept = new Set(c.topics.map(t => t.id));
      c.topics.forEach(t => { t.prerequisites = t.prerequisites.filter(p => kept.has(p)); });
      s.questions = s.questions.filter(q => q.courseId !== c.id || kept.has(q.topicId));
    }
    validateGraph(c); unlock(c);
    return c;
  });
  await addEvent(user(req), result.runId, "Topics edited", "Student updated topic names, order or prerequisite links");
  res.json(api.UpdateCourseResponse.parse(result));
});
router.delete("/courses/:id", async (req, res): Promise<void> => {
  const courseId = id(req);
  await changeState(user(req), s => {
    course(s, courseId);
    s.courses = s.courses.filter(c => c.id !== courseId);
    s.questions = s.questions.filter(q => q.courseId !== courseId);
    s.notebooks.forEach(n => { if (n.courseId === courseId) n.courseId = ""; });
  });
  res.sendStatus(204);
});
router.get("/courses/:id/quiz", async (req, res): Promise<void> => {
  const state = await readState(user(req)), courseId = id(req);
  const c = course(state, courseId);
  const questions = state.questions.filter(q => q.courseId === c.id && validCitation(q.citation, c.sources)).map(({ correctOption: _correct, explanation: _explanation, ...q }) => q);
  res.json(api.GetQuizResponse.parse(questions));
});
router.post("/answers", async (req, res): Promise<void> => {
  const input = parse(api.SubmitAnswerBody, req.body);
  const result = await changeState(user(req), s => {
    const q = s.questions.find(q => q.id === input.questionId) || fail("Question not found.", 404);
    const c = course(s, q.courseId), topic = c.topics.find(t => t.id === q.topicId) || fail("Topic not found.", 404);
    const now = new Date(), correct = input.option === q.correctOption;
    if (!input.placement && topic.level === "Locked") fail("Practice the preceding topic or take the placement check first.");
    const already = s.answers.find(a => a.questionId === q.id && now.getTime() - Date.parse(a.at) < 20 * 3600000);
    let xpEarned = 0;
    if (!already) {
      const spaced = !topic.lastReviewedAt || now.getTime() - Date.parse(topic.lastReviewedAt) >= 20 * 3600000;
      s.answers.push({ questionId: q.id, topicId: topic.id, courseId: c.id, correct, at: now.toISOString(), placement: input.placement });
      c.answerCount++;
      if (correct && spaced) {
        xpEarned = q.difficulty * (topic.lastReviewedAt ? 20 : 10);
        topic.correctSessions++; topic.lastReviewedAt = now.toISOString();
        topic.level = topic.correctSessions >= 3 ? "Mastered" : "Practicing";
      } else if (input.placement && !correct && topic.level === "Locked") topic.level = "Unlocked";
      c.xp += xpEarned; s.xp += xpEarned; unlock(c);
      const day = now.toISOString().slice(0, 10);
      if (!s.reviewDays.includes(day)) {
        if (!s.preferences.streakPaused) {
          const previous = s.reviewDays[s.reviewDays.length - 1];
          s.streak = s.streakResumeGrace || (previous && Date.parse(day) - Date.parse(previous) <= 86400000) ? s.streak + 1 : 1;
          s.streakResumeGrace = false;
        }
        s.reviewDays.push(day);
      }
      if (!s.badges.includes("First review")) s.badges.push("First review");
      if (c.topics.every(t => t.level === "Mastered") && !s.badges.includes("Unit mastered")) s.badges.push("Unit mastered");
      if (s.streak >= 7 && !s.badges.includes("A week of review")) s.badges.push("A week of review");
    }
    if (input.placement) {
      if (already) already.placement = true;
      // Match the client's short diagnostic: two per topic, up to twelve.
      const per = new Map<string, number>();
      const diagnostic = s.questions.filter(v => v.courseId === c.id).filter(v => {
        const count = per.get(v.topicId) || 0;
        if (count >= 2) return false;
        per.set(v.topicId, count + 1); return true;
      }).slice(0, 12);
      c.placementDone = diagnostic.length > 0 && diagnostic.every(v => s.answers.some(a => a.questionId === v.id && a.placement));
    }
    return { correct, correctOption: q.correctOption, explanation: q.explanation + (already ? " Already reviewed today; try a spaced review tomorrow to earn XP." : ""), xpEarned, course: c };
  });
  await addEvent(user(req), result.course.runId, "Quiz result", `${result.correct ? "Correct answer" : "Review needed"}; earned ${result.xpEarned} XP`);
  await addEvent(user(req), result.course.runId, "Level check", "Updated topic level from spaced-session evidence, not answer speed");
  res.json(api.SubmitAnswerResponse.parse(result));
});
router.patch("/preferences", async (req, res): Promise<void> => {
  const input = parse(api.UpdatePreferencesBody, req.body);
  await changeState(user(req), s => {
    if (s.preferences.streakPaused && !input.streakPaused) s.streakResumeGrace = true;
    s.preferences = input;
  });
  res.json(api.UpdatePreferencesResponse.parse(input));
});
router.post("/storage/uploads/request-url", async (req, res): Promise<void> => {
  const input = parse(api.RequestUploadUrlBody, req.body);
  if (!process.env.PRIVATE_OBJECT_DIR) fail("PDF storage is not available yet. Paste a transcript to build your notebook instead.", 503);
  try {
    const uploadURL = await storage.getObjectEntityUploadURL();
    const objectPath = storage.normalizeObjectEntityPath(uploadURL);
    await changeState(user(req), s => { s.uploads.push({ path: objectPath, name: input.name, size: input.size }); });
    res.json(api.RequestUploadUrlResponse.parse({ uploadURL, objectPath }));
  } catch (error) {
    if ((error as any)?.status) throw error;
    fail("PDF storage is temporarily unavailable. Your transcript can still be used.", 503);
  }
});
router.get("/storage/objects/{*path}", async (req, res): Promise<void> => {
  const path = req.path.slice("/storage".length);
  const state = await readState(user(req));
  if (!state.uploads.some(u => u.path === path)) fail("File not found.", 404);
  const file = await storage.getObjectEntityFile(path);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("X-Content-Type-Options", "nosniff");
  file.createReadStream().on("error", () => { if (!res.headersSent) res.status(404).json({ error: "File not found." }); else res.end(); }).pipe(res);
});
return router;
}

export default createStudyRouter();
