import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Unfit — find out which phones won't fit your life" },
      { name: "description", content: "Answer questions about your habits. We screen phones against real reviews and tell you why each one won't work for you." },
      { property: "og:title", content: "Unfit — phone screening by your habits" },
      { property: "og:description", content: "We find why a phone won't fit you, using reviews from Amazon, Best Buy, Walmart and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EXAMPLES = [
  ["You play Temple Run for 40 min on the train", "Rejected: frame rate drops after ~15 min as it heats up; camera bump sits under the left index finger in landscape."],
  ["You drop your phone once a month, without a case", "Rejected: buyers on Best Buy and Amazon say the glass back cracks when the phone falls from pocket height — an ordinary drop, not a hard one."],
  ["You zoom in on photos of your kids' games", "Rejected: the '50MP' sensor turns to mush past 2× — reviewers show heavy smearing."],
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6">
        <section className="grid gap-12 py-20 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <p className="label-mono text-accent">For US shoppers · Mobile phones</p>
            <h1 className="mt-4 text-6xl leading-[0.95] md:text-8xl">
              Every phone looks great on the spec sheet.
              <em className="block text-accent">Find out why it won't fit you.</em>
            </h1>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-muted-foreground">
              Tell us how you actually live — the drops, the games, the sunny commute, the one-handed scrolling. We
              screen phones against what owners report on Amazon, Best Buy, Walmart, Target, carrier stores and
              independent reviewers, and knock out the ones that will let you down.
            </p>
            <Button asChild size="lg" className="card-hard h-14 rounded-sm px-8 text-base hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <Link to="/quiz">Start my screening →</Link>
            </Button>
            <p className="text-xs text-muted-foreground">Takes about 3 minutes. Brand websites are only quoted when the review is negative.</p>
          </div>
        </section>

        <section className="border-t border-foreground/80 py-14">
          <p className="label-mono mb-8 text-muted-foreground">What the screening catches</p>
          <div className="grid gap-6 md:grid-cols-3">
            {EXAMPLES.map(([habit, verdict], i) => (
              <div key={i} className="card-hard p-6">
                <p className="label-mono text-muted-foreground">Habit 0{i + 1}</p>
                <p className="mt-3 font-display text-2xl leading-tight">{habit}</p>
                <p className="mt-4 border-t border-dashed border-foreground/40 pt-4 text-sm">
                  <span className="font-semibold text-destructive">✕ </span>
                  {verdict}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
