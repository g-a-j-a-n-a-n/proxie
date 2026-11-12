import { useState } from "react";
import { useSignIn } from "@clerk/react";
import { useLocation } from "wouter";
import { FlaskConical } from "lucide-react";
import { basePath } from "@/lib/proxie";

export function JudgeDemoButton({ className = "" }: { className?: string }) {
  const { signIn, fetchStatus } = useSignIn();
  const [, setLocation] = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!import.meta.env.DEV) return null;

  const enterDemo = async () => {
    if (!signIn || fetchStatus === "fetching" || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${basePath}/api/demo/judge-ticket`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      const data = await response.json() as { ticket?: string; error?: string };
      if (!response.ok || !data.ticket) throw new Error(data.error || "The shared judge account is not ready yet.");
      const attempt = await signIn.ticket({ ticket: data.ticket });
      if (attempt.error) throw attempt.error;
      if (signIn.status !== "complete") throw new Error("The judge sign-in did not finish. Please try again.");
      const finalized = await signIn.finalize();
      if (finalized.error) throw finalized.error;
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the judge demo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full">
      <button type="button" onClick={enterDemo} disabled={!signIn || fetchStatus === "fetching" || busy}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[hsl(var(--pen-blue))] px-5 py-3 font-bold text-[hsl(var(--pen-blue))] transition hover:bg-[hsl(var(--pen-blue)/0.08)] disabled:opacity-60 ${className}`}
        data-testid="button-judge-demo">
        <FlaskConical className="h-4 w-4" />
        {busy ? "Opening shared demo…" : "Try the shared judge demo"}
      </button>
      <p className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">Shared with other judges. Don’t upload private or real student materials.</p>
      {error && <p role="alert" className="mt-2 text-center text-sm font-semibold text-[hsl(var(--destructive))]">{error}</p>}
    </div>
  );
}
