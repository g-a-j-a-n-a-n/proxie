export type GenerationUsage = { day: string; count: number };
export const DAILY_GENERATION_LIMIT = 20;

/** Persist this value within the same workspace transaction as the request. */
export function consumeGenerationBudget(previous?: GenerationUsage, now = Date.now()): GenerationUsage {
  const day = new Date(now).toISOString().slice(0, 10);
  const count = previous?.day === day ? previous.count : 0;
  if (count >= DAILY_GENERATION_LIMIT) {
    const error = new Error("Daily generation limit reached (20 builds or regenerations). Try again after 00:00 UTC; your saved materials remain available.") as Error & { status: number };
    error.status = 429;
    throw error;
  }
  return { day, count: count + 1 };
}
