import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="paper-lined flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="hand text-[96px] font-bold leading-none text-[hsl(var(--pen-red))]">p. 404</p>
      <h1 className="hand mt-2 text-5xl font-bold"><span className="marker-underline">This page was torn out.</span></h1>
      <p className="mt-4 max-w-sm text-[hsl(var(--ink)/0.75)]">The link may be old, or the notebook was deleted.</p>
      <Link href="/" className="ink-btn mt-8" data-testid="link-404-home">Back to Proxie</Link>
    </div>
  );
}
