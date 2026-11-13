import { Link } from "wouter";
import { FlaskConical } from "lucide-react";

/** No shared sign-in ticket: public examples use a separate anonymous practice session. */
export function JudgeDemoButton({ className = "" }: { className?: string }) {
  return (
    <div className="w-full">
      <Link href="/example/dashboard"
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[hsl(var(--pen-blue))] px-5 py-3 font-bold text-[hsl(var(--pen-blue))] transition hover:bg-[hsl(var(--pen-blue)/0.08)] ${className}`}
        data-testid="button-example-workspace">
        <FlaskConical className="h-4 w-4" /> Explore an example workspace
      </Link>
      <p className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">No sign-up. Fictional materials. Your practice changes won’t affect other visitors.</p>
    </div>
  );
}
