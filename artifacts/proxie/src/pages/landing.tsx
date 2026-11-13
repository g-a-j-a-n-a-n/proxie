import { Link } from "wouter";
import { ArrowRight, Check, FileText, Flag, Lock, MicOff, Network, Quote, Undo2 } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { Highlighted } from "@/components/notebook-parts";
import { LandingFeatureShowcase } from "@/components/landing-feature-showcase";

const EX_POINTS = [
  "Yeast eats sugar: it breaks glucose down without oxygen and releases carbon dioxide and ethanol.",
  "Gluten forms a stretchy web that traps the carbon dioxide, so the dough inflates instead of leaking.",
  "Warmth speeds fermentation up to a point; very hot water kills the yeast.",
];
const EX_STEPS = [
  { s: "Text extraction", r: "Read 14 slides, 1 had no text", st: "ok" },
  { s: "AI model", r: "Section 3 timed out", st: "failed" },
  { s: "Fallback", r: "Retried once, then used an extractive summary", st: "recovered" },
  { s: "Citation check", r: "31 of 33 sentences matched, 2 labeled", st: "ok" },
];

function ExampleTag() {
  return (
    <span className="mono inline-flex items-center gap-1.5 rounded-full border border-dashed border-[hsl(var(--pen-red))] bg-[hsl(var(--card))] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--pen-red))]" data-testid="text-example-label">
      Notebook preview · fictional sample
    </span>
  );
}

export default function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden">
      <header className="mx-auto flex h-20 max-w-6xl items-center px-5">
        <Logo />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/sign-in" className="ghost-btn !border-transparent" data-testid="link-sign-in">Sign in</Link>
          <Link href="/sign-up" className="ink-btn" data-testid="link-sign-up">Start a notebook</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.05fr_1fr] lg:pt-14">
        <div className="rise">
          <p className="mono text-xs uppercase tracking-[0.2em] text-[hsl(var(--pen-blue))]">for the lecture you missed</p>
          <h1 className="hand mt-3 text-[64px] font-bold leading-[0.9] text-[hsl(var(--ink))] md:text-[92px]">
            Your stand-in <br /><span className="marker-underline">for lecture.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[hsl(var(--ink)/0.82)]">
            Upload the slides or paste the transcript. Proxie turns them into a <mark className="hl-g text-inherit">colored-pen notebook</mark> where every sentence points back to the slide it came from, then builds a skill tree so you can see what you actually understand.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="ink-btn !px-6 !py-3 text-lg" data-testid="button-hero-start">Make my first notebook <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/example/dashboard" className="ghost-btn !py-3" data-testid="link-example-workspace">Explore example workspace <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Explore and edit pre-generated examples without signing up. Create an account to add your own notebooks.</p>
          <p className="mt-5 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"><Lock className="h-4 w-4" /> Private account. Your materials stay yours.</p>
        </div>

        {/* Example notebook */}
        <div id="example" className="relative scroll-mt-10 rise" style={{ animationDelay: "120ms" }}>
          <div className="absolute -right-3 -top-4 z-10 rotate-[3deg]"><ExampleTag /></div>
          <div className="paper-lined relative rotate-[0.8deg] rounded-2xl border border-[hsl(var(--border))] py-8 pl-[66px] pr-6 shadow-[0_30px_50px_-30px_hsl(228_40%_20%/0.55)]">
            <h2 className="hand text-[44px] font-bold leading-none"><span className="marker-underline">Why bread rises</span></h2>
            <p className="mt-3 italic leading-8 text-[hsl(var(--ink)/0.85)]">Yeast ferments sugar into gas, and the dough's gluten traps it.<span className="cite-chip">slide 4</span></p>
            <ol className="mt-2 space-y-1">
              {EX_POINTS.map((p, i) => (
                <li key={i} className="flex gap-3 leading-8">
                  <span className="hand w-5 shrink-0 text-2xl font-bold text-[hsl(var(--pen-blue))]">{i + 1}.</span>
                  <span><Highlighted text={p} terms={["carbon dioxide", "Gluten", "fermentation"]} /><span className="cite-chip">slide {5 + i}</span></span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_150px]">
              <div className="callout bg-[hsl(var(--card))] p-3.5 text-[14.5px]">
                <p className="mono text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Definition</p>
                <p className="mt-1"><mark className="hl-g font-bold text-inherit">Fermentation</mark> getting energy from sugar without oxygen.<span className="cite-chip">slide 5</span></p>
                <ul className="mt-1.5 space-y-0.5 text-[13.5px]"><li># Gluten: protein web in wheat dough</li><li># Proofing: letting dough rest and rise</li></ul>
              </div>
              <div className="sticky-note tape relative rotate-[-3deg] rounded-sm p-3">
                <p className="mono text-[9px] uppercase tracking-widest text-[hsl(var(--ink)/0.55)]">Key term</p>
                <p className="hand text-2xl font-bold leading-none">Proofing</p>
                <p className="mt-1 text-[12px] leading-snug">tap to flip for an example</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Run strip */}
      <section className="border-y border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="hand text-[52px] font-bold leading-[0.95]"><span className="marker-underline green">It shows its work.</span></h2>
            <p className="mt-5 text-lg leading-relaxed text-[hsl(var(--ink)/0.82)]">Every build is a list of real steps with real timings. When something breaks, a scanned PDF, a timed-out summary, a sentence it couldn't cite, you see it, plus what happened next. Replay any run at 0.5x, 1x or 2x.</p>
          </div>
          <div className="paper-grid rounded-2xl border border-[hsl(var(--border))] p-5">
            <div className="mb-3 flex justify-end"><ExampleTag /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {EX_STEPS.map((e, i) => (
                <div key={i} className="sketch-box bg-[hsl(var(--card))] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="mono grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--ink))] text-[10px] text-[hsl(44_60%_97%)]">{i + 1}</span>
                    <b>{e.s}</b>
                    <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${e.st === "failed" ? "bg-[hsl(4_80%_90%)] text-[hsl(var(--pen-red))]" : e.st === "recovered" ? "bg-[hsl(var(--hl-yellow))]" : "bg-[hsl(var(--hl-green))]"}`}>
                      {e.st === "recovered" ? <Undo2 className="h-3 w-3" /> : <Check className="h-3 w-3" />}{e.st}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[hsl(var(--ink)/0.8)]">{e.r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingFeatureShowcase />

      {/* Honesty grid */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="hand max-w-3xl text-[52px] font-bold leading-[0.95] md:text-[64px]">Notes you can <span className="marker-underline pink">check</span>, progress you can trust.</h2>
        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-8">
            {[
              { i: Quote, t: "Click any citation", b: "Opens the exact slide text or transcript moment, with the quoted words highlighted. Claims Proxie can't tie to your materials are dropped or labeled." },
              { i: Flag, t: "Flag, fix, or regenerate", b: "Mark a sentence that looks off. Rewrite it yourself, and it's labeled as your edit, never passed off as checked by AI. Or ask Proxie to try that section again." },
              { i: Network, t: "A skill tree, not a score", b: "Paste a syllabus and topics become nodes: Locked, Unlocked, Practicing, Mastered. Levels rise with correct answers across separate days and drift down slowly if you stop reviewing." },
            ].map((x, k) => (
              <div key={k} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[hsl(var(--hl-yellow))]"><x.i className="h-5 w-5" /></span>
                <div><h3 className="text-xl font-bold">{x.t}</h3><p className="mt-1 leading-relaxed text-[hsl(var(--ink)/0.78)]">{x.b}</p></div>
              </div>
            ))}
          </div>
          <div className="sticky-note green tape relative rotate-[1.5deg] self-start rounded-sm p-7">
            <p className="hand text-[34px] font-bold leading-none">Honest labels, always</p>
            <p className="mt-3 leading-relaxed">Every progress view says what it's based on, like "Based on 12 quiz answers in this course". XP comes from getting things right, especially harder questions and spaced review, not from tapping fast. It is never an official grade.</p>
            <p className="mt-3 leading-relaxed">Need a break? Pause your streak. No penalty.</p>
          </div>
        </div>
      </section>

      {/* Consent */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-8 rounded-3xl bg-[hsl(var(--ink))] p-8 text-[hsl(44_60%_96%)] md:grid-cols-[auto_1fr] md:p-12">
          <MicOff className="h-12 w-12 text-[hsl(var(--hl-yellow))]" />
          <div>
            <h2 className="hand text-[44px] font-bold leading-none">Proxie never records a lecture.</h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed opacity-85">It works only with materials you already have access to: posted slides, shared transcripts, notes from your course site. You confirm that before every build.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {["PDF slides up to 15 MB / 100 pages", "Transcripts up to 120,000 characters", "Compile from anything you've saved"].map((t) => (
                <span key={t} className="flex items-center gap-2 rounded-full border border-[hsl(44_60%_96%/0.25)] px-3 py-1.5"><FileText className="h-3.5 w-3.5" />{t}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="hand text-[48px] font-bold"><span className="marker-underline">Made for the week that went sideways</span></h2>
        <ul className="mt-8 grid gap-x-10 gap-y-4 text-lg md:grid-cols-2">
          {["You missed Tuesday for a shift, or a fever, or a clash.", "You'd rather listen in lecture and get notes after.", "The exam is Friday and the slides are 80 pages.", "Note-taking is hard for you: ADHD, dysgraphia, hearing.", "You joined the course in week five.", "Clean notes stick better than raw slides."].map((t, i) => (
            <li key={i} className="flex gap-3 border-b border-dashed border-[hsl(var(--ink)/0.15)] pb-4"><span className="hand text-2xl font-bold text-[hsl(var(--pen-blue))]">{i + 1}.</span>{t}</li>
          ))}
        </ul>
      </section>

      <section className="paper-lined border-t border-[hsl(var(--border))] py-24 text-center">
        <h2 className="hand text-[60px] font-bold leading-none md:text-[80px]"><span className="marker-underline green">Catch up tonight.</span></h2>
        <p className="mx-auto mt-5 max-w-md text-lg text-[hsl(var(--ink)/0.8)]">A fresh account starts with an empty notebook. Bring one lecture and see what it makes.</p>
        <Link href="/sign-up" className="ink-btn mt-8 !px-7 !py-3 text-lg" data-testid="button-footer-start">Create my account <ArrowRight className="h-5 w-5" /></Link>
        <p className="mt-10 text-xs text-[hsl(var(--muted-foreground))]">Proxie is a study aid. It can be wrong; check the citations. Not affiliated with any school.</p>
      </section>
    </div>
  );
}
