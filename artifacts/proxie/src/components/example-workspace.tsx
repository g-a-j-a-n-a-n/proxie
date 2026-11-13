import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Redirect, Route, Router, Switch } from "wouter";
import { AppShell } from "./app-shell";
import { ErrorState, PageSkeleton } from "./states";
import { basePath, errMsg } from "@/lib/proxie";
import Dashboard from "@/pages/dashboard";
import Notebook from "@/pages/notebook";
import Courses from "@/pages/courses";
import Course from "@/pages/course";
import Progress from "@/pages/progress";
import { ExampleContext } from "@/lib/example-mode";
import { Lock } from "lucide-react";

function PersonalAccountPrompt() {
  return <div className="paper-grid rounded-2xl border p-7">
    <Lock className="mb-3 h-6 w-6 text-[hsl(var(--pen-blue))]" aria-hidden />
    <h1 className="hand text-4xl font-bold" data-testid="text-notebook-creation-locked">Sign up to create notebooks</h1>
    <p className="mt-3 max-w-xl">Notebook creation is locked in the example workspace. You can browse and experiment with the pre-generated notes, citations, flags, quizzes, and honeycomb tree. Sign up to add your own notebooks, courses, or uploads and use AI generation.</p>
    <a href={`${basePath}/sign-up`} className="ink-btn mt-5" data-testid="link-unlock-notebooks">Sign up to unlock creation</a>
    <div className="mt-4"><Link href="/dashboard" className="underline">Back to the example desk</Link></div>
  </div>;
}

export function ExampleWorkspace() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setError(""); setReady(false);
    void fetch(`${basePath}/api/example/session`, { method: "POST", credentials: "same-origin", signal: abort.signal })
      .then(async r => { if (!r.ok) { const d = await r.json(); throw new Error(d.error || "The example could not open."); } })
      .then(() => { if (!abort.signal.aborted) setReady(true); })
      .catch(e => { if (!abort.signal.aborted) setError(errMsg(e)); });
    return () => { abort.abort(); void client.cancelQueries(); client.clear(); };
  }, [attempt, client]);

  const body: ReactNode = error ? <ErrorState message={error} onRetry={() => setAttempt(n => n + 1)} /> :
    !ready ? <PageSkeleton rows={2} /> : <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/notebooks/new" component={PersonalAccountPrompt} />
      <Route path="/notebooks/:id" component={Notebook} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:id" component={Course} />
      <Route path="/progress" component={Progress} />
      <Route><Redirect to="/dashboard" /></Route>
    </Switch>;

  return <Router base="/example">
    <ExampleContext.Provider value={true}>
      <QueryClientProvider client={client}><AppShell>{body}</AppShell></QueryClientProvider>
    </ExampleContext.Provider>
  </Router>;
}
