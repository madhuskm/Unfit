export type Evidence = { source: string; url?: string; claim: string; sentiment: "positive" | "negative" | "mixed" };
export type Pick = {
  name: string;
  approx_price_usd: number | null;
  fit_score: number;
  why_it_fits: string[];
  watch_outs: string[];
  evidence: Evidence[];
};
export type Rejected = {
  name: string;
  dealbreaker: string;
  your_habit: string;
  evidence: Evidence[];
};
export type Demand = { habit: string; what_the_phone_must_do: string; non_obvious_checks: string[] };
export type Verdict = {
  profile_summary: string;
  demands: Demand[];
  picks: Pick[];
  rejected: Rejected[];
  research_note: string;
  research_mode?: "live";
  checked_at?: string;
  research_sources?: Array<{ url: string; title: string; excerpts: string[]; publish_date?: string | null }>;
};
