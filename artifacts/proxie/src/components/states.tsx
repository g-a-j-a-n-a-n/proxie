import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function HandTitle({ children, tone = "yellow", className, as = "h1" }: { children: ReactNode; tone?: "yellow" | "green" | "pink"; className?: string; as?: "h1" | "h2" | "h3" }) {
  const Tag = as;
  return (
    <Tag className={cn("hand font-bold leading-[0.95] text-[hsl(var(--ink))]", className)}>
      <span className={cn("marker-underline", tone === "green" && "green", tone === "pink" && "pink")}>{children}</span>
    </Tag>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-6" data-testid="status-loading" aria-busy="true">
      <div className="h-12 w-2/3 max-w-md rounded-lg bg-[hsl(var(--muted))] animate-pulse" />
      <div className="h-4 w-1/2 max-w-sm rounded bg-[hsl(var(--muted))] animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl paper-lined opacity-70 animate-pulse" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ title = "This page didn't load", message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-lg rise" data-testid="status-error">
      <div className="relative paper-lined rounded-2xl border border-[hsl(var(--border))] p-8 pl-16 shadow-sm">
        <p className="hand text-3xl font-bold text-[hsl(var(--pen-red))]">{title}</p>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">{message}</p>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Nothing you saved was lost.</p>
        {onRetry && (
          <button className="ink-btn mt-5" onClick={onRetry} data-testid="button-retry">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyNote({ title, body, action, tone = "yellow", art }: { title: string; body: string; action?: ReactNode; tone?: "yellow" | "green" | "pink"; art?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-8 text-center rise" data-testid="status-empty">
      <div className={cn("sticky-note tape relative w-full max-w-sm rotate-[-1.5deg] rounded-sm px-6 pb-6 pt-8", tone === "green" && "green", tone === "pink" && "pink")}>
        {art}
        <p className="hand text-3xl font-bold text-[hsl(var(--ink))]">{title}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[hsl(var(--ink)/0.8)]">{body}</p>
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function HonestLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mono text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]" data-testid="text-honest-label">
      {children}
    </p>
  );
}
