import { z } from "zod";

// Public review publishers only. Brand stores are excluded altogether, so
// brand-positive evidence cannot enter the verdict through a redirected URL.
export const REVIEW_GROUPS = [
  ["gsmarena.com"], ["tomsguide.com"], ["phonearena.com"],
  ["cnet.com"], ["theverge.com"], ["amazon.com", "bestbuy.com", "walmart.com", "target.com"],
];
const domains = REVIEW_GROUPS.flat();
export function reviewDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return domains.find((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`)) ?? null;
  } catch { return null; }
}

export const ReviewPageSchema = z.object({
  url: z.string().url(), title: z.string(), excerpts: z.array(z.string()).min(1),
  publish_date: z.string().nullish(),
});
export type ReviewPage = z.infer<typeof ReviewPageSchema>;
export function usablePages(pages: ReviewPage[]): ReviewPage[] {
  return [...new Map(pages.filter((p) => reviewDomain(p.url) && p.excerpts.some((e) => e.trim())).map((p) => [p.url, p])).values()];
}
export function requireSourceCoverage(pages: ReviewPage[]) {
  if (new Set(pages.map((p) => reviewDomain(p.url)).filter(Boolean)).size < 5)
    throw new Error("Not enough live reviews from five independent sites were available. Please try again later; no model-only result was saved.");
}

const evidenceSchema = z.object({
  source: z.string(), url: z.string().url(), claim: z.string().min(1),
  sentiment: z.enum(["positive", "negative", "mixed"]),
});
const verdictSchema = z.object({
  profile_summary: z.string(), research_note: z.string(),
  demands: z.array(z.object({ habit: z.string(), what_the_phone_must_do: z.string(), non_obvious_checks: z.array(z.string()) })),
  picks: z.array(z.object({
    name: z.string(), approx_price_usd: z.number().nonnegative().nullable(), fit_score: z.number().min(0).max(100),
    why_it_fits: z.array(z.string()), watch_outs: z.array(z.string()), evidence: z.array(evidenceSchema).min(1),
  })).length(3),
  rejected: z.array(z.object({ name: z.string(), dealbreaker: z.string(), your_habit: z.string(), evidence: z.array(evidenceSchema).min(1) })).min(5),
});
export function validateLiveVerdict(input: unknown, pages: ReviewPage[]) {
  const verdict = verdictSchema.parse(input);
  const fetched = new Set(pages.map((p) => p.url));
  const used = new Set<string>();
  for (const phone of [...verdict.picks, ...verdict.rejected]) {
    for (const evidence of phone.evidence) {
      const domain = reviewDomain(evidence.url);
      if (!domain || !fetched.has(evidence.url)) throw new Error("A review citation did not match a retrieved source. No result was saved; please try again.");
      evidence.source = domain;
      used.add(domain);
    }
  }
  if (used.size < 5) throw new Error("The screening did not cite five independent review sites. No result was saved; please try again.");
  return verdict;
}