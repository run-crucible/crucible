/**
 * Floating pixel-art damage text — pops up and drifts upward like an old RPG.
 * A new entry is pushed on every break; it auto-removes after the animation.
 */
import { useEffect, useState } from "react";

interface DamageEntry {
  id: number;
  label: string;
  color: string;
  x: number; // % offset from center
}

const SEV_LABEL: Record<string, { label: string; color: string }> = {
  critical: { label: "⚡ CRITICAL",  color: "#FF3D00" },
  high:     { label: "BROKE",        color: "#FF6A1A" },
  medium:   { label: "BROKE",        color: "#FFB020" },
  low:      { label: "breach",       color: "#8A6A4A" },
};

let _counter = 0;

export function usePixelDamage() {
  const [entries, setEntries] = useState<DamageEntry[]>([]);

  function push(severity: string) {
    const { label, color } = SEV_LABEL[severity] ?? SEV_LABEL.medium;
    const id = ++_counter;
    // slight random x offset so multiple hits don't stack exactly
    const x = -20 + Math.random() * 40;
    setEntries((prev) => [...prev, { id, label, color, x }]);
    setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }, 1400);
  }

  return { entries, push };
}

export function PixelDamageLayer({ entries }: { entries: DamageEntry[] }) {
  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
      {entries.map((e) => (
        <FloatText key={e.id} entry={e} />
      ))}
    </div>
  );
}

function FloatText({ entry }: { entry: DamageEntry }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="absolute left-1/2 font-pixel text-center whitespace-nowrap select-none"
      style={{
        bottom: "55%",
        transform: `translateX(calc(-50% + ${entry.x}%))`,
        color: entry.color,
        fontSize: "10px",
        textShadow: `0 0 8px ${entry.color}, 0 0 16px ${entry.color}88`,
        imageRendering: "pixelated",
        transition: visible
          ? "transform 1.3s cubic-bezier(0.1,0.8,0.3,1), opacity 1.3s ease-out"
          : "none",
        opacity: visible ? 0 : 1,
        // float upward 60px
        ...(visible
          ? { transform: `translateX(calc(-50% + ${entry.x}%)) translateY(-60px)` }
          : {}),
      }}
    >
      {entry.label}
    </div>
  );
}
