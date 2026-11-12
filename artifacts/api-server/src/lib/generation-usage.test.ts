import test from "node:test";
import assert from "node:assert/strict";
import { consumeGenerationBudget, DAILY_GENERATION_LIMIT } from "./generation-usage";

test("generation budget permits twenty operations and rejects the next without mutation", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  let usage = consumeGenerationBudget(undefined, now);
  for (let i = 1; i < DAILY_GENERATION_LIMIT; i++) usage = consumeGenerationBudget(usage, now);
  assert.equal(usage.count, DAILY_GENERATION_LIMIT);
  assert.throws(() => consumeGenerationBudget(usage, now), (error: any) => error.status === 429);
  assert.equal(usage.count, DAILY_GENERATION_LIMIT);
});

test("generation budget resets at UTC midnight", () => {
  const usage = { day: "2026-11-12", count: DAILY_GENERATION_LIMIT };
  assert.deepEqual(consumeGenerationBudget(usage, Date.parse("2026-11-13T00:00:00Z")), { day: "2026-11-13", count: 1 });
});
