import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { basePath, errMsg } from "@/lib/proxie";

export function ExampleBanner() {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="border-b-2 border-[hsl(var(--hl-yellow))] bg-[hsl(var(--hl-yellow)/0.38)] px-4 py-3" data-testid="banner-example-workspace">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
      <div className="max-w-2xl text-sm">
        <p className="font-bold">Example workspace — your own practice copy</p>
        <p>Try citations, flags, edits, quizzes, and the honeycomb tree. Fictional materials only; don’t enter private information. Changes expire after two hours or a server restart and are not shared with other visitors.</p>
        {error && <p role="alert" className="mt-1 font-bold">{error} <a className="underline" href={`${basePath}/example/dashboard`}>Reopen example</a></p>}
      </div>
      <div className="flex flex-wrap gap-3 text-sm font-bold">
        <button className="ghost-btn" disabled={busy} data-testid="button-reset-example" onClick={async () => {
          if (!window.confirm("Reset only your practice changes and restore the fictional sample?")) return;
          setBusy(true); setError("");
          try {
            await client.cancelQueries(); client.clear();
            const response = await fetch(`${basePath}/api/example/reset`, { method: "POST", credentials: "same-origin" });
            if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Reset failed."); }
            window.location.assign(`${basePath}/example/dashboard`);
          } catch (e) { setError(errMsg(e)); setBusy(false); }
        }}>{busy ? "Restoring…" : "Reset example"}</button>
        <a className="ghost-btn" href={`${basePath}/sign-up`} data-testid="link-example-personal-account">Personal account</a>
        <a className="ghost-btn" href={basePath || "/"} data-testid="link-exit-example">Exit example</a>
      </div>
    </div>
  </div>;
}
