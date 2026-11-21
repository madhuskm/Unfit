import { describe, expect, it } from "vitest";
import { requireSourceCoverage, reviewDomain, usablePages, validateLiveVerdict, type ReviewPage } from "./liveReviews";

const sites = ["gsmarena.com", "tomsguide.com", "phonearena.com", "cnet.com", "theverge.com"];
const pages: ReviewPage[] = sites.map((site) => ({ url: `https://${site}/phone-review`, title: "Phone review", excerpts: ["Sustained gaming heats the phone."] }));
const evidence = pages.map((p) => ({ source: "Publisher", url: p.url, claim: p.excerpts[0] ?? "", sentiment: "negative" }));
function verdict() {
  return { profile_summary: "Gaming shopper", research_note: "Live",
    demands: [], picks: Array.from({ length: 3 }, (_, i) => ({ name: `Pick ${i}`, approx_price_usd: 500, fit_score: 80, why_it_fits: ["Fits budget"], watch_outs: [], evidence })),
    rejected: Array.from({ length: 5 }, (_, i) => ({ name: `Reject ${i}`, dealbreaker: "Heating", your_habit: "Gaming", evidence })),
  };
}
describe("live review rules", () => {
  it("requires at least five distinct non-brand sites", () => {
    expect(() => requireSourceCoverage(pages)).not.toThrow();
    expect(() => requireSourceCoverage(pages.slice(0, 4))).toThrow();
    expect(() => requireSourceCoverage(Array(5).fill(pages[0]))).toThrow();
  });
  it("never admits brand-positive reviews or lookalike domains", () => {
    expect(reviewDomain("https://samsung.com/reviews")).toBeNull();
    expect(reviewDomain("https://amazon.com.evil.test/review")).toBeNull();
    expect(reviewDomain("https://www.bestbuy.com/review")).toBe("bestbuy.com");
    expect(usablePages([{ url: "https://apple.com/reviews", title: "Great phone", excerpts: ["Positive review"] }])).toHaveLength(0);
  });
  it("returns exactly three picks", () => {
    expect(validateLiveVerdict(verdict(), pages).picks).toHaveLength(3);
    expect(() => validateLiveVerdict({ ...verdict(), picks: verdict().picks.slice(0, 2) }, pages)).toThrow();
  });
  it("requires at least five rejected phones", () => {
    expect(() => validateLiveVerdict({ ...verdict(), rejected: verdict().rejected.slice(0, 4) }, pages)).toThrow();
  });
  it("rejects invented URLs, even from allowed sites", () => {
    const v = verdict();
    const p = v.picks[0];
    if (!p) throw new Error("Missing fixture");
    p.evidence = [{ source: "Amazon", url: "https://amazon.com/not-fetched", claim: "Unverified", sentiment: "negative" }];
    expect(() => validateLiveVerdict(v, pages)).toThrow(/retrieved source/);
  });
  it("requires five cited sites, not just five fetched sites", () => {
    const v = verdict();
    for (const p of [...v.picks, ...v.rejected]) p.evidence = evidence.slice(0, 4);
    expect(() => validateLiveVerdict(v, pages)).toThrow(/five independent/);
  });
});