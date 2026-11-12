import test from "node:test";
import assert from "node:assert/strict";
import { sameOrigin, requestSecurity } from "./requestSecurity";

test("same-origin validation rejects opaque, deceptive, and malformed origins", () => {
  assert.equal(sameOrigin("https://study.example", "study.example"), true);
  assert.equal(sameOrigin("http://localhost:5000", "localhost:5000"), true);
  for (const origin of [
    "null", "https://evil.example", "https://study.example.evil.example",
    "https://study.example@evil.example", "https://study.example/path",
    "javascript:alert(1)", "https://study.example:8443", "not a URL",
  ]) assert.equal(sameOrigin(origin, "study.example"), false, origin);
  assert.equal(sameOrigin("https://study.example", undefined), false);
});

test("browser writes are blocked before handlers; same-origin and server clients pass", () => {
  function invoke(method: string, headers: Record<string, string>) {
    let status = 200, called = false;
    const response = {
      setHeader() {},
      status(value: number) { status = value; return this; },
      json() { return this; },
    };
    requestSecurity({
      method, headers: { host: "study.example", ...headers },
      get: (key: string) => headers[key.toLowerCase()],
    } as any, response as any, () => { called = true; });
    return { status, called };
  }
  assert.deepEqual(invoke("POST", { origin: "https://evil.example" }), { status: 403, called: false });
  assert.deepEqual(invoke("POST", { "sec-fetch-site": "cross-site" }), { status: 403, called: false });
  assert.equal(invoke("PATCH", { origin: "https://study.example" }).called, true);
  assert.equal(invoke("POST", {}).called, true);
  assert.equal(invoke("GET", { origin: "https://evil.example" }).called, true);
  assert.equal(invoke("POST", { origin: "https://public.example", "x-forwarded-host": "public.example" }).called, true);
});
