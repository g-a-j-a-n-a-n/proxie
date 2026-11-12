import { Router, type IRouter, type Request, type Response } from "express";
import { clerkClient } from "@clerk/express";
import { judgeUserId } from "../lib/judge-demo";

const router: IRouter = Router();
const attempts = new Map<string, { since: number; count: number }>();

router.post("/demo/judge-ticket", async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== "development") { res.sendStatus(404); return; }
  const origin = req.get("origin"), host = req.get("host");
  if (!origin || !host || new URL(origin).host !== host) { res.status(403).json({ error: "Please open the Proxie preview to start the judge demo." }); return; }
  const now = Date.now();
  for (const [key, entry] of attempts) if (now - entry.since >= 60000) attempts.delete(key);
  const key = req.ip || "unknown";
  const entry = attempts.get(key);
  if (entry && now - entry.since < 60000 && entry.count >= 60) { res.setHeader("Retry-After", "60"); res.status(429).json({ error: "Too many demo sign-ins from this connection. Please try again in a minute." }); return; }
  if (!judgeUserId) { res.status(503).json({ error: "The judge account is still starting. Please try again shortly." }); return; }
  if (!entry || now - entry.since >= 60000) attempts.set(key, { since: now, count: 1 });
  else entry.count++;
  const token = await clerkClient.signInTokens.createSignInToken({ userId: judgeUserId, expiresInSeconds: 120 });
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  res.json({ ticket: token.token });
});

export default router;
