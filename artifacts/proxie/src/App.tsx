import { useEffect, type ComponentType, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell, Logo } from "@/components/app-shell";
import { JudgeDemoButton } from "@/components/judge-demo-button";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewNotebook from "@/pages/new-notebook";
import NotebookPage from "@/pages/notebook";
import Courses from "@/pages/courses";
import CoursePage from "@/pages/course";
import Progress from "@/pages/progress";
import { clearQueryCacheOnUserChange } from "@/lib/auth-cache";
import { ExampleWorkspace } from "@/components/example-workspace";
import { setRequestUrlMapper } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// REQUIRED — copy verbatim.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
setRequestUrlMapper(url => {
  if (!url.startsWith("/api/")) return url;
  if (url.startsWith("/api/example/")) return `${basePath}${url}`;
  const example = window.location.pathname.startsWith(`${basePath}/example/`) || window.location.pathname === `${basePath}/example`;
  return `${basePath}/api/${example ? "example/" : ""}${url.slice(5)}`;
});

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const ink = "hsl(228 42% 20%)";
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(226 60% 36%)",
    colorForeground: ink,
    colorMutedForeground: "hsl(228 15% 40%)",
    colorDanger: "hsl(4 68% 46%)",
    colorBackground: "hsl(44 60% 98%)",
    colorInput: "hsl(44 60% 99%)",
    colorInputForeground: ink,
    colorNeutral: ink,
    fontFamily: "'Atkinson Hyperlegible', system-ui, sans-serif",
    borderRadius: "0.7rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[hsl(44_60%_98%)] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[hsl(40_22%_80%)] shadow-[0_30px_50px_-30px_hsl(228_40%_20%/0.55)]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-['Caveat'] !text-[38px] !font-bold !leading-none text-[hsl(228_42%_20%)]",
    headerSubtitle: "text-[hsl(228_15%_40%)]",
    socialButtonsBlockButtonText: "!font-bold text-[hsl(228_42%_20%)]",
    formFieldLabel: "!font-bold text-[hsl(228_42%_20%)]",
    footerActionLink: "!font-bold text-[hsl(226_60%_36%)]",
    footerActionText: "text-[hsl(228_15%_40%)]",
    dividerText: "text-[hsl(228_15%_40%)]",
    identityPreviewEditButton: "text-[hsl(226_60%_36%)]",
    formFieldSuccessText: "text-[hsl(140_45%_25%)]",
    alertText: "text-[hsl(4_68%_40%)]",
    logoBox: "justify-center",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border-[hsl(40_22%_76%)] bg-[hsl(44_60%_99%)]",
    formButtonPrimary: "!rounded-full !bg-[hsl(226_60%_36%)] !font-bold !shadow-[0_2px_0_hsl(228_50%_18%)]",
    formFieldInput: "border-[hsl(40_22%_76%)] bg-[hsl(44_60%_99%)] text-[hsl(228_42%_20%)]",
    footerAction: "justify-center",
    dividerLine: "bg-[hsl(40_22%_80%)]",
    alert: "bg-[hsl(4_80%_96%)] border-[hsl(4_68%_80%)]",
    otpCodeFieldInput: "border-[hsl(40_22%_70%)] text-[hsl(228_42%_20%)]",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

function AuthFrame({ children, note }: { children: ReactNode; note: string }) {
  return (
    <div className="paper-grid flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" data-testid="link-auth-home"><Logo /></Link>
      <div className="w-full max-w-[440px]"><JudgeDemoButton /></div>
      {children}
      <p className="hand max-w-xs rotate-[-1deg] text-center text-2xl text-[hsl(var(--ink)/0.7)]">{note}</p>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthFrame note="your notebooks are waiting">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/dashboard`} />
    </AuthFrame>
  );
}

function SignUpPage() {
  return (
    <AuthFrame note="private to you. no lecture recording, ever.">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/dashboard`} />
    </AuthFrame>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();

  useEffect(() => {
    return clearQueryCacheOnUserChange(addListener, () => qc.clear());
  }, [addListener, qc]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function Private({ page: Page }: { page: ComponentType }) {
  const [location] = useLocation();
  return (
    <>
      <Show when="signed-in">
        <AppShell>
          <ErrorBoundary resetKey={location}><Page /></ErrorBoundary>
        </AppShell>
      </Show>
      <Show when="signed-out"><Redirect to="/" /></Show>
    </>
  );
}

const priv = (p: ComponentType) => () => <Private page={p} />;
const DashboardR = priv(Dashboard);
const NewNotebookR = priv(NewNotebook);
const NotebookR = priv(NotebookPage);
const CoursesR = priv(Courses);
const CourseR = priv(CoursePage);
const ProgressR = priv(Progress);

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/dashboard`}
      signUpFallbackRedirectUrl={`${basePath}/dashboard`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Open your Proxie notebooks" } },
        signUp: { start: { title: "Start your notebook", subtitle: "A private study space for catching up" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/example/*?" component={ExampleWorkspace} />
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={DashboardR} />
            <Route path="/notebooks/new" component={NewNotebookR} />
            <Route path="/notebooks/:id" component={NotebookR} />
            <Route path="/courses" component={CoursesR} />
            <Route path="/courses/:id" component={CourseR} />
            <Route path="/progress" component={ProgressR} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
