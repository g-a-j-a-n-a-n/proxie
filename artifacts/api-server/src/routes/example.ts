import { Router } from "express";
import { createSampleState } from "../lib/judge-demo";
import { createExampleSession, exampleSession, deleteExampleSession, countExampleRequest } from "../lib/example-store";
import { createStudyRouter } from "./study";
import { changeState } from "../lib/study-store";
import { OpenExampleSessionResponse, ResetExampleSessionResponse } from "@workspace/api-zod";

const router = Router();
const COOKIE = "proxie_example";
const cookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const, path: "/api/example", maxAge: 2 * 60 * 60 * 1000,
};
function sessionId(cookie: string | undefined) {
  const value = cookie?.split(";").map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return value && /^example_[a-f0-9]{64}$/.test(value) ? value : undefined;
}
// A bounded process-local workspace, never a Clerk identity or a student database row.
let creationWindow = Date.now(), creations = 0;
router.post("/session", (req, res) => {
  const existing = sessionId(req.get("cookie"));
  if (existing && exampleSession(existing)) { res.json(OpenExampleSessionResponse.parse({ active: true })); return; }
  const now = Date.now();
  if (now - creationWindow >= 60_000) { creationWindow = now; creations = 0; }
  if (++creations > 60) { res.status(429).json({ error: "The example workspace is busy. Please try again in a minute." }); return; }
  const id = createExampleSession(createSampleState());
  res.cookie(COOKIE, id, cookieOptions);
  res.status(201).json(OpenExampleSessionResponse.parse({ active: true }));
});
router.use((req, res, next) => {
  const id = sessionId(req.get("cookie"));
  if (!id || !exampleSession(id)) {
    res.status(401).json({ error: "Your example session expired. Reopen the example workspace to start again." }); return;
  }
  countExampleRequest(id);
  res.locals.exampleId = id;
  next();
});
router.delete("/session", (_req, res) => {
  deleteExampleSession(res.locals.exampleId);
  res.clearCookie(COOKIE, { ...cookieOptions, maxAge: undefined });
  res.sendStatus(204);
});
router.post("/reset", async (_req, res): Promise<void> => {
  await changeState(res.locals.exampleId, s => Object.assign(s, createSampleState()));
  res.json(ResetExampleSessionResponse.parse({ reset: true }));
});
// Fail closed: examples can exercise saved sample features, never uploads or paid generation.
router.use((req, res, next) => {
  const p = req.path;
  const readable = req.method === "GET" && (
    p === "/workspace" || /^\/(notebooks|runs)\/[^/]+$/.test(p) || /^\/courses\/[^/]+\/quiz$/.test(p)
  );
  const editable = (req.method === "POST" && (p === "/answers" || /^\/notebooks\/[^/]+\/flags$/.test(p))) ||
    (req.method === "PATCH" && (p === "/preferences" || /^\/courses\/[^/]+$/.test(p) ||
      (/^\/notebooks\/[^/]+\/sections\/[^/]+$/.test(p) && req.body?.action === "edit"))) ||
    (req.method === "DELETE" && /^\/(notebooks|courses)\/[^/]+$/.test(p));
  if (!readable && !editable) {
    res.status(403).json({ error: "Uploads and AI generation are not available in the example workspace. Create a personal account to use your own materials." }); return;
  }
  next();
});
router.use(createStudyRouter((_req) => _req.res?.locals.exampleId));
export default router;
