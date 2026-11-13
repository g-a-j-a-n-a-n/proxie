import { randomBytes } from "node:crypto";
import type { State } from "./study-store";

export const EXAMPLE_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 100;
const MAX_STATE_BYTES = 512_000;
type Entry = { state: State; expires: number; minute: number; requests: number };
const sessions = new Map<string, Entry>();

function error(message: string, status: number): never {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  throw err;
}
export const isExampleId = (id: string) => id.startsWith("example_");
export function exampleSession(id: string, now = Date.now()): Entry | undefined {
  const entry = sessions.get(id);
  if (entry && entry.expires <= now) { sessions.delete(id); return undefined; }
  return entry;
}
export function createExampleSession(state: State, now = Date.now()): string {
  for (const [id, entry] of sessions) if (entry.expires <= now) sessions.delete(id);
  if (sessions.size >= MAX_SESSIONS) error("The example workspace is busy. Please try again later.", 503);
  const id = `example_${randomBytes(32).toString("hex")}`;
  sessions.set(id, { state: structuredClone(state), expires: now + EXAMPLE_TTL_MS, minute: now, requests: 0 });
  return id;
}
export function deleteExampleSession(id: string) { sessions.delete(id); }
export function readExampleState(id: string): State {
  const entry = exampleSession(id);
  if (!entry) error("Your example session expired. Reopen the example workspace to start again.", 401);
  return structuredClone(entry.state);
}
export function changeExampleState<T>(id: string, change: (state: State) => T): T {
  const entry = exampleSession(id);
  if (!entry) error("Your example session expired. Reopen the example workspace to start again.", 401);
  const state = structuredClone(entry.state);
  const result = change(state);
  if (Buffer.byteLength(JSON.stringify(state)) > MAX_STATE_BYTES) error("This practice workspace is full. Reset the example to continue.", 413);
  entry.state = state;
  return result;
}
export function countExampleRequest(id: string, now = Date.now()) {
  const entry = exampleSession(id, now);
  if (!entry) error("Your example session expired. Reopen the example workspace.", 401);
  if (now - entry.minute >= 60_000) { entry.minute = now; entry.requests = 0; }
  if (++entry.requests > 120) error("Too many example requests. Please wait a minute.", 429);
}
