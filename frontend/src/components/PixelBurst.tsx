/**
 * Canvas-based pixel art explosion that plays when a break fires.
 * Classic 8-bit style: blocky pixel particles expanding outward.
 *
 * Usage:
 *   <PixelBurst trigger={fracture} severity="critical" size={220} />
 *
 * Remounts (and replays) whenever `trigger` increments.
 */
import { useEffect, useRef } from "react";

const G = 22;           // game-pixel grid size (G×G)
const C = Math.floor(G / 2); // center

type Px = [number, number, string]; // [gx, gy, color]

const COLORS = {
  white:   "#FFF8F0",
  hot:     "#FF3D00",
  molten:  "#FF6A1A",
  amber:   "#FFB020",
  ember:   "#C2410C",
  oxblood: "#7A1E12",
  dark:    "#4A0F08",
};

// 7 frames of pixel art, each ~60ms apart
function makeFrames(isCritical: boolean): Px[][] {
  const h = isCritical ? COLORS.hot : COLORS.molten;
  const m = isCritical ? COLORS.molten : COLORS.amber;
  const d = isCritical ? COLORS.oxblood : COLORS.ember;

  return [
    // Frame 0 — white flash center
    [
      [C-1,C-1,COLORS.white],[C,C-1,COLORS.white],[C+1,C-1,COLORS.white],
      [C-1,C,  COLORS.white],[C,C,  "#FFFFFF"],    [C+1,C,  COLORS.white],
      [C-1,C+1,COLORS.white],[C,C+1,COLORS.white],[C+1,C+1,COLORS.white],
    ],
    // Frame 1 — hot center cross
    [
      [C,C,h],
      [C-1,C,h],[C+1,C,h],[C,C-1,h],[C,C+1,h],
      [C-2,C,m],[C+2,C,m],[C,C-2,m],[C,C+2,m],
      [C-2,C-1,m],[C+2,C-1,m],[C-1,C-2,m],[C+1,C-2,m],
      [C-2,C+1,m],[C+2,C+1,m],[C-1,C+2,m],[C+1,C+2,m],
      [C-3,C-1,d],[C+3,C-1,d],[C-1,C-3,d],[C+1,C-3,d],
    ],
    // Frame 2 — expanding ring
    [
      [C-3,C,h],[C+3,C,h],[C,C-3,h],[C,C+3,h],
      [C-2,C-2,h],[C+2,C-2,h],[C-2,C+2,h],[C+2,C+2,h],
      [C-4,C-1,m],[C+4,C-1,m],[C-1,C-4,m],[C+1,C-4,m],
      [C-4,C+1,m],[C+4,C+1,m],[C-1,C+4,m],[C+1,C+4,m],
      [C,C,d],[C-1,C,d],[C+1,C,d],[C,C-1,d],[C,C+1,d],
      [C-5,C,d],[C+5,C,d],[C,C-5,d],[C,C+5,d],
    ],
    // Frame 3 — particles flying
    [
      [C-5,C+1,h],[C+5,C-1,h],[C+1,C-5,h],[C-1,C+5,h],
      [C-4,C-4,m],[C+4,C-4,m],[C-4,C+4,m],[C+4,C+4,m],
      [C-6,C,m],[C+6,C,m],[C,C-6,m],[C,C+6,m],
      [C-7,C-2,d],[C+7,C+2,d],[C-2,C-7,d],[C+2,C+7,d],
      [C-3,C-1,d],[C+3,C+1,d],
    ],
    // Frame 4 — sparse flying debris
    [
      [C-7,C+1,m],[C+7,C-1,m],[C+1,C-7,m],[C-1,C+7,m],
      [C-6,C-5,d],[C+6,C+5,d],[C-5,C+6,d],[C+5,C-6,d],
      [C-8,C-1,d],[C+8,C+1,d],[C-1,C-8,d],[C+1,C+8,d],
    ],
    // Frame 5 — final sparks at edge
    [
      [C-9,C,COLORS.dark],[C+9,C,COLORS.dark],
      [C,C-9,COLORS.dark],[C,C+9,COLORS.dark],
      [C-7,C-6,COLORS.dark],[C+7,C+6,COLORS.dark],
      [C-6,C+7,COLORS.dark],[C+6,C-7,COLORS.dark],
    ],
    // Frame 6 — empty (done)
    [],
  ];
}

const FRAME_MS = [40, 55, 70, 80, 90, 100];

export function PixelBurst({
  trigger,
  severity = "high",
  size = 220,
}: {
  trigger: number;
  severity?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isCritical = severity === "critical";
    const frames = makeFrames(isCritical);
    const pxSize = Math.floor(size / G);   // canvas px per game pixel
    const offset = Math.floor((size - G * pxSize) / 2);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameIdx = 0;
    let lastTime = 0;

    function draw(ts: number) {
      if (!ctx) return;
      const elapsed = ts - lastTime;
      if (elapsed < FRAME_MS[Math.min(frameIdx, FRAME_MS.length - 1)]) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastTime = ts;

      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      const px = frames[frameIdx] ?? [];
      for (const [gx, gy, color] of px) {
        ctx.fillStyle = color;
        ctx.fillRect(
          offset + gx * pxSize,
          offset + gy * pxSize,
          pxSize,
          pxSize,
        );
      }

      frameIdx++;
      if (frameIdx < frames.length) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, severity, size]);

  if (trigger === 0) return null;

  return (
    <canvas
      key={trigger}
      ref={canvasRef}
      width={size}
      height={size}
      className="absolute inset-0 z-40 pointer-events-none"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
