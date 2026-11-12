import type { RequestHandler } from "express";
import { getClerkProxyHost } from "./clerkProxyMiddleware";

export function sameOrigin(origin: string, host: string | undefined): boolean {
  if (!host) return false;
  try {
    const url = new URL(origin);
    return (url.protocol === "https:" || url.protocol === "http:")
      && url.origin === origin
      && url.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** Browser writes are same-origin; non-browser clients still need valid auth. */
export const requestSecurity: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  const writes = !["GET", "HEAD", "OPTIONS"].includes(req.method);
  const origin = req.get("Origin");
  if (writes && (req.get("Sec-Fetch-Site") === "cross-site"
    || (origin !== undefined && !sameOrigin(origin, getClerkProxyHost(req))))) {
    res.status(403).json({ error: "Cross-origin changes are not allowed." });
    return;
  }
  next();
};
