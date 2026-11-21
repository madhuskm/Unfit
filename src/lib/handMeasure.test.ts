import { describe, it, expect } from "vitest";
import { homography, apply, paperTransform, measureHand, combine, PAPER } from "./handMeasure";

describe("hand measurement", () => {
  it("maps paper corners to Letter size in cm", () => {
    const H = paperTransform([{ x: 100, y: 50 }, { x: 380, y: 50 }, { x: 380, y: 266 }, { x: 100, y: 266 }]);
    const br = apply(H, { x: 380, y: 266 });
    expect(br.x).toBeCloseTo(PAPER.long, 3);
    expect(br.y).toBeCloseTo(PAPER.short, 3);
  });
  it("undoes perspective tilt", () => {
    const src = [{ x: 120, y: 40 }, { x: 360, y: 60 }, { x: 400, y: 300 }, { x: 80, y: 280 }];
    const dst = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    const H = homography(src, dst);
    src.forEach((p, i) => { const q = apply(H, p); expect(q.x).toBeCloseTo(dst[i]!.x, 4); expect(q.y).toBeCloseTo(dst[i]!.y, 4); });
  });
  it("hand length is wrist to middle fingertip", () => {
    const pts = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
    pts[12] = { x: 0, y: 18.5 };
    expect(measureHand(pts).handLengthCm).toBeCloseTo(18.5);
  });
  it("median ignores one bad frame", () => {
    const g = { palmWidthCm: 8, handLengthCm: 18, thumbCm: 6, spanCm: 20 };
    expect(combine([g, g, { ...g, handLengthCm: 40 }]).handLengthCm).toBe(18);
  });
});
