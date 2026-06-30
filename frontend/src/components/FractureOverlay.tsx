/**
 * Full-screen pixel-art flash overlay.
 * Uses hard-edged colours, pixel scanlines, and chunky corner borders —
 * no smooth gradients.
 */
import { useEffect, useRef } from "react";

interface FractureOverlayProps {
  trigger: number;
  severity?: string;
}

const SEV: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: "#3A0800",  border: "#FF3D00", text: "#FF3D00", label: "FRACTURE" },
  high:     { bg: "#2A1000",  border: "#FF6A1A", text: "#FF6A1A", label: "BROKE"    },
  medium:   { bg: "#1A0E00",  border: "#FFB020", text: "#FFB020", label: "BROKE"    },
};

function getSev(s: string) {
  return SEV[s] ?? SEV.medium;
}

/** Draw a chunky pixel-art corner bracket at each corner of the screen */
function PixelCorner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const W = 32; const H = 32;
  const flip = pos === "tr" || pos === "br" ? "scaleX(-1)" : "";
  const flipY = pos === "bl" || pos === "br" ? "scaleY(-1)" : "";

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="absolute"
      style={{
        top: pos.startsWith("t") ? 8 : "auto",
        bottom: pos.startsWith("b") ? 8 : "auto",
        left: pos.endsWith("l") ? 8 : "auto",
        right: pos.endsWith("r") ? 8 : "auto",
        transform: `${flip} ${flipY}`.trim() || undefined,
        imageRendering: "pixelated",
      }}
    >
      {/* Horizontal bar */}
      <rect x="0"  y="0"  width={W}     height="4" fill="currentColor" />
      {/* Vertical bar */}
      <rect x="0"  y="0"  width="4"     height={H} fill="currentColor" />
      {/* inner step */}
      <rect x="4"  y="4"  width="4"     height="4" fill="currentColor" />
    </svg>
  );
}

export function FractureOverlay({ trigger, severity = "high" }: FractureOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || trigger === 0) return;
    // Re-trigger animation
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }, [trigger]);

  if (trigger === 0) return null;

  const { bg, border, text, label } = getSev(severity);

  return (
    <div
      key={trigger}
      ref={ref}
      className="fixed inset-0 z-[100] pointer-events-none animate-fracture"
      style={{
        backgroundColor: bg,
        // pixel scanlines — horizontal stripes 2px black every 4px
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.35) 0px,
          rgba(0,0,0,0.35) 2px,
          transparent 2px,
          transparent 4px
        )`,
      }}
    >
      {/* chunky pixel border */}
      <div
        className="absolute inset-2 pointer-events-none"
        style={{
          border: `4px solid ${border}`,
          boxShadow: `inset 0 0 0 4px ${bg}, inset 0 0 0 8px ${border}44`,
          imageRendering: "pixelated",
        }}
      />

      {/* corner brackets */}
      <div style={{ color: border }}>
        <PixelCorner pos="tl" />
        <PixelCorner pos="tr" />
        <PixelCorner pos="bl" />
        <PixelCorner pos="br" />
      </div>

      {/* pixel scanline strip across center */}
      <div
        className="absolute inset-x-0"
        style={{
          top: "50%",
          height: "4px",
          background: border,
          opacity: 0.6,
          imageRendering: "pixelated",
        }}
      />

      {/* main text — hard pixel font, no smooth shadow */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <p
          className="font-pixel uppercase tracking-widest"
          style={{
            color: text,
            fontSize: "clamp(24px, 6vw, 64px)",
            // pixel-style "shadow" via hard offset, not blur
            textShadow: `4px 4px 0px ${bg}, 6px 6px 0px ${border}66`,
            imageRendering: "pixelated",
            letterSpacing: "0.2em",
          }}
        >
          {label}
        </p>
        {label === "FRACTURE" && (
          <p
            className="font-pixel text-[9px] tracking-[0.3em]"
            style={{ color: border, opacity: 0.7 }}
          >
            CRITICAL BREAK DETECTED
          </p>
        )}
      </div>
    </div>
  );
}
