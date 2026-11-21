// Pure geometry helpers for measuring a hand laid flat on a sheet of paper.
export type Pt = { x: number; y: number };
export type HandSize = { palmWidthCm: number; handLengthCm: number; thumbCm: number; spanCm: number };

// US Letter in cm.
export const PAPER = { short: 21.59, long: 27.94 };

/** Solve homography mapping src[i] -> dst[i] (4 points). Returns 3x3 row-major. */
export function homography(src: Pt[], dst: Pt[]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i]!; const { x: u, y: v } = dst[i]!;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    [A[c], A[p]] = [A[p]!, A[c]!];
    for (let r = 0; r < 8; r++) if (r !== c) {
      const f = A[r]![c]! / A[c]![c]!;
      for (let k = c; k < 9; k++) A[r]![k]! -= f * A[c]![k]!;
    }
  }
  const h = A.map((row, i) => row[8]! / row[i]!);
  return [...h, 1];
}

export function apply(H: number[], p: Pt): Pt {
  const w = H[6]! * p.x + H[7]! * p.y + H[8]!;
  return { x: (H[0]! * p.x + H[1]! * p.y + H[2]!) / w, y: (H[3]! * p.x + H[4]! * p.y + H[5]!) / w };
}

/** Corners ordered TL, TR, BR, BL -> map onto paper rectangle in cm (orientation from side lengths). */
export function paperTransform(c: Pt[]): number[] {
  const len = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const top = (len(c[0]!, c[1]!) + len(c[3]!, c[2]!)) / 2;
  const side = (len(c[0]!, c[3]!) + len(c[1]!, c[2]!)) / 2;
  const [W, Hh] = top >= side ? [PAPER.long, PAPER.short] : [PAPER.short, PAPER.long];
  return homography(c, [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: Hh }, { x: 0, y: Hh }]);
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Landmarks already in paper-cm coordinates (MediaPipe 21-point layout). */
export function measureHand(p: Pt[]): HandSize {
  return {
    // Knuckle-to-knuckle (index→pinky) understates full palm breadth by ~15%.
    palmWidthCm: dist(p[5]!, p[17]!) * 1.15,
    handLengthCm: dist(p[0]!, p[12]!),
    thumbCm: dist(p[2]!, p[3]!) + dist(p[3]!, p[4]!),
    spanCm: dist(p[4]!, p[20]!),
  };
}

export function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export function combine(samples: HandSize[]): HandSize {
  const k = (f: keyof HandSize) => Math.round(median(samples.map((s) => s[f])) * 10) / 10;
  return { palmWidthCm: k("palmWidthCm"), handLengthCm: k("handLengthCm"), thumbCm: k("thumbCm"), spanCm: k("spanCm") };
}

/** Relative spread of a metric across samples; used to reject shaky captures. */
export function spread(samples: HandSize[], f: keyof HandSize) {
  const v = samples.map((s) => s[f]); const m = median(v);
  return median(v.map((x) => Math.abs(x - m))) / m;
}

/** Find the largest bright quad (the paper) in a grayscale image. Returns TL,TR,BR,BL or null. */
export function findPaper(gray: Uint8ClampedArray, w: number, h: number): Pt[] | null {
  // Otsu threshold
  const hist = new Array(256).fill(0); for (const g of gray) hist[g]++;
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sB = 0, wB = 0, best = 0, th = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue; const wF = gray.length - wB; if (!wF) break;
    sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) ** 2;
    if (v > best) { best = v; th = t; }
  }
  const seen = new Uint8Array(w * h); let bestPix: number[] = [];
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || gray[s]! <= th) continue;
    const comp: number[] = []; const st = [s]; seen[s] = 1;
    while (st.length) {
      const i = st.pop()!; comp.push(i); const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1])
        if (j >= 0 && !seen[j] && gray[j]! > th) { seen[j] = 1; st.push(j); }
    }
    if (comp.length > bestPix.length) bestPix = comp;
  }
  if (bestPix.length < w * h * 0.12) return null;
  let tl = Infinity, br = -Infinity, tr = -Infinity, bl = Infinity; const c: Pt[] = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  for (const i of bestPix) {
    const x = i % w, y = (i / w) | 0;
    if (x + y < tl) { tl = x + y; c[0] = { x, y }; }
    if (x - y > tr) { tr = x - y; c[1] = { x, y }; }
    if (x + y > br) { br = x + y; c[2] = { x, y }; }
    if (x - y < bl) { bl = x - y; c[3] = { x, y }; }
  }
  // Sanity: quad should fill most of its blob and have paper-like proportions.
  const area = Math.abs(((c[0]!.x * c[1]!.y - c[1]!.x * c[0]!.y) + (c[1]!.x * c[2]!.y - c[2]!.x * c[1]!.y) + (c[2]!.x * c[3]!.y - c[3]!.x * c[2]!.y) + (c[3]!.x * c[0]!.y - c[0]!.x * c[3]!.y)) / 2);
  if (bestPix.length / area < 0.6) return null;
  return c;
}
