/**
 * Full-screen phase change announcement.
 * Flashes when a new attack category begins.
 */
import { useEffect, useState } from "react";

const PHASE_INFO: Record<string, { label: string; sub: string; color: string }> = {
  injection:    { label: "INJECTION",          sub: "Direct system override attempts",       color: "#ff6a1a" },
  roleplay:     { label: "PERSONA OVERRIDE",   sub: "Forcing a new identity",                color: "#e6a817" },
  "social-eng": { label: "SOCIAL ENGINEERING", sub: "Manipulation and authority attacks",    color: "#ff8c00" },
  "multi-turn": { label: "CRESCENDO",          sub: "Escalating multi-turn pressure",        color: "#cc2200" },
  "tool-abuse": { label: "TOOL ABUSE",         sub: "Forbidden function calls",              color: "#ff2200" },
};

const AI_PHASE = {
  label: "AI ATTACKER ENGAGED",
  sub:   "Claude adapts strategy in real time",
  color: "#ff0033",
};

interface Props {
  trigger:   number;
  category:  string;
  framework: string;
}

export function PhaseAnnouncer({ trigger, category, framework }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!visible || !category) return null;

  const isAI = framework === "ai_attacker";
  const info = isAI ? AI_PHASE : (PHASE_INFO[category] ?? { label: category.toUpperCase(), sub: "", color: "#ff6a1a" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{ animation: "fadeInOut 1.8s ease forwards" }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-forge-deep/85" />

      <div className="relative text-center px-8">
        {isAI && (
          <p className="font-pixel text-[10px] text-warm/60 uppercase tracking-[0.4em] mb-3">
            ⚡ phase escalation
          </p>
        )}
        <h2
          className="font-pixel text-2xl md:text-4xl uppercase tracking-widest mb-3"
          style={{
            color: info.color,
            textShadow: `0 0 20px ${info.color}, 0 0 40px ${info.color}80`,
          }}
        >
          {info.label}
        </h2>
        <p className="font-mono text-sm text-bone/60">{info.sub}</p>

        {/* Horizontal bar */}
        <div
          className="mt-4 h-0.5 mx-auto w-48"
          style={{ background: info.color, boxShadow: `0 0 12px ${info.color}` }}
        />
      </div>

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: scale(0.97); }
          15%  { opacity: 1; transform: scale(1); }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
