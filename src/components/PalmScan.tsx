import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apply, combine, findPaper, measureHand, paperTransform, spread, type HandSize, type Pt } from "@/lib/handMeasure";

export type { HandSize };
type Side = "left" | "right";
type Hands = Partial<Record<Side, HandSize>>;

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const NEED = 30;
const DW = 160, DH = 120; // paper-detection grid
const VW = 480, VH = 360; // outline display

function hull(pts: Pt[]) {
  const s = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop(); lo.push(p); }
  for (const p of s.reverse()) { while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

export function summarizeHands(r: Hands) {
  const parts = (["left", "right"] as Side[]).filter((s) => r[s]).map((s) => {
    const h = r[s]!;
    return `${s} hand: palm width ${h.palmWidthCm} cm, hand length ${h.handLengthCm} cm, thumb ${h.thumbCm} cm, thumb-to-pinky span ${h.spanCm} cm`;
  });
  return parts.length ? parts.join("; ") + " (measured flat on Letter paper, ±0.5 cm)" : "";
}

export function PalmScan({ value, onChange }: { value: Hands; onChange: (v: Hands) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stop = useRef<() => void>(() => {});
  const [side, setSide] = useState<Side | null>(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => () => stop.current(), []);

  async function start(s: Side) {
    stop.current();
    setSide(s); setProgress(0); setStatus("Starting camera…");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: { ideal: "environment" } }, audio: false });
    } catch {
      setStatus("Camera permission was denied — you can enter sizes by hand instead."); setSide(null); return;
    }
    const v = video.current!;
    v.srcObject = stream; await v.play();
    setStatus("Loading…");
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    const fs = await FilesetResolver.forVisionTasks(WASM);
    const lm = await HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL }, runningMode: "VIDEO", numHands: 1 });
    const small = document.createElement("canvas"); small.width = DW; small.height = DH;
    const sctx = small.getContext("2d", { willReadFrequently: true })!;
    let alive = true, raf = 0, last = "";
    let samples: ReturnType<typeof measureHand>[] = [];
    let lastHull: Pt[] = [], lastPaper: Pt[] | null = null, missed = 0;
    stop.current = () => { alive = false; cancelAnimationFrame(raf); stream.getTracks().forEach((t) => t.stop()); lm.close(); stop.current = () => {}; };
    const say = (m: string) => { if (m !== last) { last = m; setStatus(m); } };

    const loop = () => {
      if (!alive) return;
      const vw = v.videoWidth || 640, vh = v.videoHeight || 480;
      // Paper detection on a tiny grayscale copy; the frame itself is never shown or kept.
      sctx.drawImage(v, 0, 0, DW, DH);
      const px = sctx.getImageData(0, 0, DW, DH).data;
      const g = new Uint8ClampedArray(DW * DH);
      for (let i = 0; i < g.length; i++) g[i] = (px[i * 4]! * 3 + px[i * 4 + 1]! * 6 + px[i * 4 + 2]!) / 10;
      const paper = findPaper(g, DW, DH);
      const r = lm.detectForVideo(v, performance.now());
      const hand = r.landmarks[0];

      if (paper) { lastPaper = paper; missed = 0; } else if (++missed > 10) lastPaper = null;
      if (hand) lastHull = hull(hand.map((p) => ({ x: p.x * VW, y: p.y * VH })));

      const ctx = canvas.current!.getContext("2d")!;
      ctx.fillStyle = "#1a1814"; ctx.fillRect(0, 0, VW, VH);
      if (lastPaper) {
        ctx.strokeStyle = paper ? "#5fb27a" : "#6b665c"; ctx.lineWidth = 3; ctx.beginPath();
        lastPaper.forEach((p, k) => { const q = { x: (p.x / DW) * VW, y: (p.y / DH) * VH }; k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        ctx.closePath(); ctx.stroke();
      }
      if (lastHull.length) {
        ctx.strokeStyle = hand ? "#e8562a" : "#7a4a3a"; ctx.lineWidth = 3; ctx.beginPath();
        lastHull.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
      }

      if (!paper) say("Looking for the sheet of paper — keep all four corners in view, on a darker surface.");
      else if (!hand) say("Paper found. Lay your hand flat on it, palm down, fingers spread.");
      else {
        const H = paperTransform(paper.map((p) => ({ x: (p.x / DW) * vw, y: (p.y / DH) * vh })));
        const cm = hand.map((p) => apply(H, { x: p.x * vw, y: p.y * vh }));
        const inside = cm.every((p) => p.x > -0.5 && p.y > -0.5 && p.x < 28.5 && p.y < 28.5);
        if (!inside) say("Move your hand so the wrist and fingertips are all on the paper.");
        else {
          samples.push(measureHand(cm)); setProgress(samples.length / NEED);
          say("Hold still…");
          if (samples.length >= NEED) {
            if (spread(samples, "handLengthCm") > 0.03 || spread(samples, "palmWidthCm") > 0.04) {
              samples = []; setProgress(0); say("Too much movement — hold the camera and hand still.");
            } else {
              const res = combine(samples); stop.current(); setSide(null);
              const next = { ...value, [s]: res }; onChange(next);
              const o = next[s === "left" ? "right" : "left"];
              const off = o && (Math.abs(o.handLengthCm - res.handLengthCm) > 1 || Math.abs(o.palmWidthCm - res.palmWidthCm) > 0.6);
              setStatus(off ? "Measured — but your two hands differ more than usual. Re-measure one to be sure." : `${s === "left" ? "Left" : "Right"} hand measured.`);
              return;
            }
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  }

  function setManualVal(s: Side, f: keyof HandSize, n: string) {
    const cur = value[s] ?? { palmWidthCm: 0, handLengthCm: 0, thumbCm: 0, spanCm: 0 };
    onChange({ ...value, [s]: { ...cur, [f]: Number(n) || 0 } });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-sm border-[1.5px] border-border bg-card p-4 text-sm">
        <p className="font-medium">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Put a plain sheet of Letter paper (8.5 × 11 in) on a darker table.</li>
          <li>Lay one hand flat on it, <b>palm down</b>, fingers spread, wrist at the paper's edge.</li>
          <li>With your other hand, hold your phone or webcam above so all four corners of the paper show.</li>
        </ol>
        <p className="mt-3 text-muted-foreground">🔒 Palm-down means your fingerprints never face the camera. Nothing is recorded or sent — the screen shows only the outline of the paper and your hand, and we keep four numbers in centimetres.</p>
      </div>
      <video ref={video} className="hidden" playsInline muted />
      <canvas ref={canvas} width={VW} height={VH} className={`mx-auto w-full max-w-md rounded-sm ${side ? "" : "hidden"}`} aria-label="Paper and hand outline" />
      {side && <div className="h-1.5 overflow-hidden rounded-full bg-border"><div className="h-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} /></div>}
      {status && <p className="text-sm" aria-live="polite">{status}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {(["left", "right"] as Side[]).map((s) => {
          const h = value[s];
          return (
            <div key={s} className="rounded-sm border-[1.5px] border-border bg-card p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{s} hand</p>
              {manual ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  {([["handLengthCm", "Wrist → middle fingertip"], ["palmWidthCm", "Palm width"], ["spanCm", "Thumb → pinky spread"], ["thumbCm", "Thumb length"]] as [keyof HandSize, string][]).map(([f, l]) => (
                    <label key={f} className="space-y-1"><span className="text-muted-foreground">{l} (cm)</span>
                      <Input type="number" step="0.1" value={h?.[f] || ""} onChange={(e) => setManualVal(s, f, e.target.value)} /></label>
                  ))}
                </div>
              ) : (
                <>
                  {h ? <p className="mt-2 text-sm">{h.handLengthCm} cm long · palm {h.palmWidthCm} cm wide · spread {h.spanCm} cm</p> : <p className="mt-2 text-sm text-muted-foreground">Not measured</p>}
                  <Button variant="outline" className="mt-3 rounded-sm" disabled={!!side} onClick={() => start(s)}>{h ? "Re-measure" : `Measure ${s} hand`}</Button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {side && <Button variant="ghost" onClick={() => { stop.current(); setSide(null); setStatus(""); }}>Cancel</Button>}
        <Button variant="ghost" className="text-muted-foreground" onClick={() => { stop.current(); setSide(null); setManual(!manual); }}>
          {manual ? "Use the camera instead" : "No paper? Enter sizes with a ruler"}
        </Button>
      </div>
    </div>
  );
}
