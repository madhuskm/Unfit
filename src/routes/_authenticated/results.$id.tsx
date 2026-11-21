import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import type { Evidence, Verdict } from "@/lib/types";
import { reviewDomain } from "@/lib/liveReviews";

const searchQuery = (id: string) =>
  queryOptions({
    queryKey: ["search", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("phone_searches").select("id, created_at, result").eq("id", id).single();
      if (error) throw error;
      return { ...data, result: data.result as unknown as Verdict };
    },
  });

export const Route = createFileRoute("/_authenticated/results/$id")({
  head: () => ({
    meta: [
      { title: "Your phone verdict — Unfit" },
      { name: "description", content: "Your top 3 phones and the ones screened out, with review evidence." },
      { property: "og:title", content: "Your phone verdict — Unfit" },
      { property: "og:description", content: "Top 3 picks and review-backed rejections." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(searchQuery(params.id)),
  component: Results,
});

function EvidenceList({ items }: { items: Evidence[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 space-y-2 border-t border-dashed border-foreground/30 pt-3 text-sm">
      {items.map((e, k) => (
        <li key={k} className="flex flex-wrap gap-2">
          <span className={`label-mono pt-0.5 ${e.sentiment === "negative" ? "text-destructive" : e.sentiment === "positive" ? "text-success" : "text-muted-foreground"}`}>
            {e.url && reviewDomain(e.url) ? <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{e.source} ↗</a> : e.source}
          </span>
          <span className="min-w-0 text-muted-foreground">{e.claim}</span>
        </li>
      ))}
    </ul>
  );
}

function Results() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(searchQuery(id));
  const v = data.result;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-14">
        <p className="label-mono text-accent">Verdict · {new Date(data.created_at).toLocaleDateString()}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {v.research_mode === "live" && v.checked_at
            ? `Live reviews · retrieved ${new Date(v.checked_at).toLocaleString()}`
            : "Earlier screening · model-knowledge evidence, not live reviews"}
        </p>
        <h1 className="mt-3 max-w-4xl text-3xl leading-snug md:text-4xl">{v.profile_summary}</h1>

        <section className="mt-12">
          <h2 className="label-mono mb-4 text-muted-foreground">What your habits demand</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {v.demands.map((d, k) => (
              <div key={k} className="rounded-sm border border-border bg-card p-5">
                <p className="text-sm text-muted-foreground">{d.habit}</p>
                <p className="mt-1 font-display text-xl leading-snug">{d.what_the_phone_must_do}</p>
                <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                  {d.non_obvious_checks.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-4xl">Survived the screening</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {v.picks.map((p, k) => (
              <article key={p.name} className="card-hard flex flex-col p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="label-mono text-accent">#{k + 1}</span>
                  <span className="label-mono rounded-sm bg-success px-2 py-1 text-success-foreground">Fit {Math.round(p.fit_score)}</span>
                </div>
                <h3 className="mt-3 text-3xl leading-tight">{p.name}</h3>
                {p.approx_price_usd != null && <p className="text-sm text-muted-foreground">≈ ${Math.round(p.approx_price_usd)}</p>}
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.why_it_fits.map((w) => <li key={w}><span className="text-success">✓ </span>{w}</li>)}
                </ul>
                {p.watch_outs.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {p.watch_outs.map((w) => <li key={w}><span className="text-accent">! </span>{w}</li>)}
                  </ul>
                )}
                <EvidenceList items={p.evidence} />
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-4xl">Screened out — and why</h2>
          <div className="mt-6 divide-y divide-border border-y border-foreground/80">
            {v.rejected.map((r) => (
              <div key={r.name} className="grid gap-4 py-5 md:grid-cols-[220px_1fr]">
                <div>
                  <p className="font-display text-2xl leading-tight"><span className="text-destructive">✕ </span>{r.name}</p>
                  <p className="label-mono mt-1 text-muted-foreground">Clashes with: {r.your_habit}</p>
                </div>
                <div>
                  <p>{r.dealbreaker}</p>
                  <EvidenceList items={r.evidence} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-10 text-xs text-muted-foreground">{v.research_note}</p>
        <Link to="/quiz" className="mt-6 inline-block underline underline-offset-4 hover:text-accent">Run another screening</Link>
      </main>
    </div>
  );
}
