import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import type { AddressInfo } from "node:net";
import exampleRouter from "./example";
import { requestSecurity } from "../middlewares/requestSecurity";
import { createExampleSession, exampleSession, EXAMPLE_TTL_MS, deleteExampleSession, changeExampleState, readExampleState } from "../lib/example-store";
import { createSampleState } from "../lib/judge-demo";
import { GetWorkspaceResponse, GetNotebookResponse, GetQuizResponse } from "@workspace/api-zod";

test("public examples isolate visitors and forbid storage and AI even in production", async () => {
  const app = express();
  app.use("/api", requestSecurity);
  app.use(express.json());
  app.use("/api/example", exampleRouter);
  app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.status || 500).json({ error: err.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const request = (path: string, cookie = "", method = "GET", body?: unknown, otherOrigin = origin) =>
    fetch(`${origin}/api/example${path}`, { method, headers: { cookie, origin: otherOrigin, "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  let cookieA = "", cookieB = "";
  try {
    assert.equal((await request("/workspace")).status, 401);
    assert.equal((await request("/session", "", "POST", {}, "https://evil.example")).status, 403);
    const a = await request("/session", "", "POST");
    assert.equal(a.status, 201);
    const setCookie = a.headers.get("set-cookie")!;
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Strict/i);
    assert.match(setCookie, /Path=\/api\/example/i);
    if (process.env.NODE_ENV === "production") assert.match(setCookie, /Secure/i);
    cookieA = setCookie.split(";")[0]!;
    const b = await request("/session", "", "POST");
    cookieB = b.headers.get("set-cookie")!.split(";")[0]!;
    assert.notEqual(cookieA, cookieB);
    const wa = GetWorkspaceResponse.parse(await (await request("/workspace", cookieA)).json());
    const wb = GetWorkspaceResponse.parse(await (await request("/workspace", cookieB)).json());
    assert.notEqual(wa.notebooks[0]!.id, wb.notebooks[0]!.id);
    const nb = wa.notebooks[0]!, section = nb.sections[0]!;
    assert.equal((await request(`/notebooks/${nb.id}`, cookieB)).status, 404);
    assert.equal((await request(`/notebooks/${nb.id}/sections/${section.id}`, cookieB, "PATCH", { action: "edit", text: "Foreign edit" })).status, 404);
    const flagged = await request(`/notebooks/${nb.id}/flags`, cookieA, "POST", {
      sectionId: section.id, highlightedText: section.summary.text, citation: section.summary.citation, note: "Practice flag",
    });
    assert.equal(flagged.status, 200);
    assert.equal((await request(`/notebooks/${nb.id}/sections/${section.id}`, cookieA, "PATCH", { action: "edit", text: "My practice correction" })).status, 200);
    assert.equal(GetNotebookResponse.parse(await (await request(`/notebooks/${nb.id}`, cookieA)).json()).sections[0]!.summary.text, "My practice correction");
    assert.equal((await request("/session", cookieA, "POST")).status, 200);
    const quiz = GetQuizResponse.parse(await (await request(`/courses/${wa.courses[0]!.id}/quiz`, cookieA)).json());
    assert.ok(quiz.length > 0);
    assert.equal((await request("/answers", cookieA, "POST", { questionId: quiz[0]!.id, option: 0, placement: true })).status, 200);
    for (const [path, method, body] of [
      ["/notebooks", "POST", {}], ["/courses", "POST", {}], ["/storage/uploads/request-url", "POST", {}],
      [`/notebooks/${nb.id}/sections/${section.id}`, "PATCH", { action: "regenerate" }],
      ["/storage/objects/anything", "GET", undefined], ["/demo/reset", "POST", {}],
    ] as const) assert.equal((await request(path, cookieA, method, body)).status, 403, path);
    assert.equal((await request("/reset", cookieA, "POST")).status, 200);
    const reset = GetWorkspaceResponse.parse(await (await request("/workspace", cookieA)).json());
    assert.notEqual(reset.notebooks[0]!.id, nb.id);
    assert.deepEqual(await (await request("/workspace", cookieB)).json(), wb);
    assert.equal((await request("/session", cookieA, "DELETE")).status, 204);
    assert.equal((await request("/workspace", cookieA)).status, 401);
  } finally {
    if (cookieB) await request("/session", cookieB, "DELETE");
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
});

test("temporary example state expires and failed/oversized edits are rolled back", () => {
  const id = createExampleSession(createSampleState());
  try {
    const initial = readExampleState(id);
    assert.throws(() => changeExampleState(id, s => { s.xp = 999; throw new Error("reject"); }), /reject/);
    assert.equal(readExampleState(id).xp, initial.xp);
    assert.throws(() => changeExampleState(id, s => { s.notebooks[0]!.title = "x".repeat(600_000); }), /full/);
    assert.equal(readExampleState(id).notebooks[0]!.title, initial.notebooks[0]!.title);
    assert.equal(exampleSession(id, Date.now() + EXAMPLE_TTL_MS + 1000), undefined);
    assert.throws(() => readExampleState(id), /expired/);
  } finally { deleteExampleSession(id); }
});
