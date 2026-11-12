import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, LayoutGrid, LogOut, Network, PenLine, Sprout } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { basePath } from "@/lib/proxie";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Desk", icon: LayoutGrid },
  { href: "/notebooks/new", label: "New notes", icon: PenLine },
  { href: "/courses", label: "Courses", icon: Network },
  { href: "/progress", label: "Progress", icon: Sprout },
];

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img src={`${basePath}/logo.svg`} alt="" className="h-8 w-8" />
      <span className="hand text-[30px] font-bold leading-none text-[hsl(var(--ink))]">Proxie</span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [demoError, setDemoError] = useState("");
  const isJudge = user?.publicMetadata?.isProxieJudge === true;
  const name = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "you";
  const initials = (user?.firstName?.[0] ?? name[0] ?? "P").toUpperCase() + (user?.lastName?.[0] ?? "").toUpperCase();
  const active = (href: string) => location === href || (href !== "/dashboard" && href !== "/notebooks/new" && location.startsWith(href));

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0">
      {isJudge && (
        <div className="border-b-2 border-[hsl(var(--hl-yellow))] bg-[hsl(var(--hl-yellow)/0.38)] px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 md:px-2">
            <p className="max-w-3xl text-sm font-semibold text-[hsl(var(--ink))]">
              <b>Shared judge account:</b> every visitor sees and can change this fictional sample workspace. Never upload personal or real student materials.
              {demoError && <span role="alert" className="ml-2 text-[hsl(var(--destructive))]">{demoError}</span>}
            </p>
            <button type="button" disabled={resetting} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[hsl(var(--ink)/0.3)] bg-[hsl(var(--background))] px-4 py-2 text-sm font-bold disabled:opacity-60"
              onClick={async () => {
                if (!window.confirm("Reset the shared judge workspace? This removes every judge’s changes and restores the fictional sample notebook and course.")) return;
                setResetting(true); setDemoError("");
                try {
                  const response = await fetch(`${basePath}/api/demo/reset`, { method: "POST", credentials: "same-origin" });
                  if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.error || "The shared workspace could not be reset.");
                  }
                  await queryClient.invalidateQueries();
                } catch (error) {
                  setDemoError(error instanceof Error ? error.message : "The shared workspace could not be reset.");
                } finally { setResetting(false); }
              }}
              data-testid="button-reset-judge-demo">
              {resetting ? "Restoring sample…" : "Reset shared demo"}
            </button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.88)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/dashboard" data-testid="link-home"><Logo /></Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} data-testid={`link-nav-${n.label.toLowerCase().replace(/\s/g, "-")}`}
                className={cn("relative flex items-center gap-2 rounded-full px-3.5 py-2 text-[15px] font-bold transition-colors",
                  active(n.href) ? "text-[hsl(var(--ink))]" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--ink))]")}>
                <n.icon className="h-4 w-4" />
                <span className={cn(active(n.href) && "marker-underline")}>{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-[hsl(var(--muted))]" data-testid="button-account">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--hl-green))] text-sm font-bold text-[hsl(var(--ink))]">{initials}</span>
                <span className="hidden text-sm font-bold sm:inline">{name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-[hsl(var(--muted-foreground))]">
                  {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
                  <span className="mt-1 block">Your notebooks are private to this account.</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="button-sign-out">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} data-testid={`link-mobile-${n.label.toLowerCase().replace(/\s/g, "-")}`}
            className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold", active(n.href) ? "text-[hsl(var(--pen-blue))]" : "text-[hsl(var(--muted-foreground))]")}>
            <n.icon className="h-5 w-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--ink))]" data-testid="link-back">
      <BookOpen className="h-3.5 w-3.5" /> {children}
    </Link>
  );
}
