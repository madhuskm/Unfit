import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

const CAPTIONS = [
  "Eliminating the misfits.",
  "Hunting for dealbreakers.",
  "Every phone has to earn its place.",
  "Ruling out the wrong ones.",
];

const STEPS = [
  "Reading your habits",
  "Turning habits into functional demands",
  "Searching live retail and independent reviews",
  "Comparing retrieved evidence across review sites",
  "Screening out phones that won't fit",
];

// Phones that get swiped off: x = resting offset, dir = swipe direction, d = delay before the swipe
const REJECTED = [
  { x: -168, dir: -1, d: 0 },
  { x: -112, dir: 1, d: 0.9 },
  { x: -56, dir: -1, d: 1.8 },
  { x: 56, dir: 1, d: 2.7 },
  { x: 112, dir: -1, d: 3.6 },
  { x: 168, dir: 1, d: 4.5 },
];

// Phones that survive: appear one by one in the tray and stay until the loop restarts
const KEPT = [
  { x: -56, d: 0 },
  { x: 0, d: 0.6 },
  { x: 56, d: 1.2 },
];

const CYCLE = 8;

function Phone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`h-14 w-7 rounded-md border-[1.5px] border-foreground bg-card ${className ?? ""}`} style={style}>
      <div className="mx-auto mt-1.5 h-1 w-1 rounded-full bg-foreground/40" />
      <div className="mx-auto mt-1 h-8 w-4 rounded-[2px] border border-border bg-muted" />
    </div>
  );
}

export function ScreeningBusy() {
  const [cap, setCap] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const c = setInterval(() => setCap((v) => (v + 1) % CAPTIONS.length), 4200);
    const s = setInterval(() => setStep((v) => Math.min(v + 1, STEPS.length - 1)), 9000);
    return () => {
      clearInterval(c);
      clearInterval(s);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <p className="label-mono text-accent">Live review screening in progress</p>

        {/* Animated screening: misfits get swiped off, the fits stay */}
        <div className="relative mt-10 h-56 overflow-hidden rounded-sm border-[1.5px] border-border bg-card" aria-hidden="true">
          {/* dashed "verdict line" */}
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
          {/* retained tray */}
          <div className="absolute inset-x-8 bottom-4 flex justify-center gap-3">
            {KEPT.map((k, i) => (
              <div key={i} className="h-16 w-8 rounded-md border border-dashed border-foreground/30" />
            ))}
          </div>
          {/* rejected phones */}
          {REJECTED.map((p, i) => (
            <div
              key={i}
              className="animate-phone-swipe absolute top-10 left-1/2 -ml-3.5"
              style={
                {
                  "--px": `${p.x}px`,
                  "--swipe": `${p.dir * 340}px`,
                  "--tilt": `${p.dir * 70}deg`,
                  animationDelay: `${p.d}s`,
                  animationDuration: `${CYCLE}s`,
                } as React.CSSProperties
              }
            >
              <Phone className="opacity-70" />
              <span className="mt-1 block text-center font-mono text-[10px] text-destructive">✕</span>
            </div>
          ))}
          {/* kept phones */}
          {KEPT.map((k, i) => (
            <div
              key={i}
              className="animate-phone-keep absolute bottom-5 left-1/2 -ml-4"
              style={{ "--px": `${k.x}px`, animationDelay: `${k.d}s`, animationDuration: `${CYCLE}s` } as React.CSSProperties}
            >
              <Phone />
              <span className="mt-1 block text-center font-mono text-[10px] text-success">✓</span>
            </div>
          ))}
        </div>

        <div className="relative mt-10 h-16">
          {CAPTIONS.map((c, k) => (
            <h1
              key={c}
              className={`absolute inset-x-0 text-4xl transition-all duration-700 md:text-5xl ${
                k === cap ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              {c}
            </h1>
          ))}
        </div>

        <ol className="mt-10 space-y-3">
          {STEPS.map((s, k) => (
            <li key={s} className={`flex items-center gap-3 ${k > step ? "text-muted-foreground/50" : ""}`}>
              <span
                className={`inline-block h-3 w-3 rounded-full border border-foreground ${
                  k < step ? "bg-foreground" : k === step ? "animate-pulse bg-accent" : ""
                }`}
              />
              {s}
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
