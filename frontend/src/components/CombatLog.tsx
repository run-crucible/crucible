import { useEffect, useRef } from "react";
import type { CombatLogLine } from "../hooks/useCombatLog";

const ROLE_STYLE: Record<string, { label: string; cls: string }> = {
  attacker: { label: "THE CRUCIBLE", cls: "text-molten" },
  agent:    { label: "AGENT",        cls: "text-bone"   },
  system:   { label: "SYSTEM",       cls: "text-warm"   },
};

const SEV_STYLE: Record<string, { border: string; bg: string; badge: string }> = {
  critical: { border: "border-l-[#7A1E12]", bg: "bg-oxblood/15", badge: "bg-oxblood text-bone" },
  high:     { border: "border-l-ember",      bg: "bg-ember/10",   badge: "bg-ember text-amber"   },
  medium:   { border: "border-l-amber/70",   bg: "bg-amber/5",    badge: "bg-amber/20 text-amber" },
  low:      { border: "border-l-warm/40",    bg: "bg-warm/5",     badge: "bg-warm/20 text-warm"  },
};

function VectorSeparator({ seq }: { seq: number }) {
  return (
    <div className="flex items-center gap-2 my-3 px-1">
      <div className="h-px flex-1 bg-warm/20" />
      <span className="font-pixel text-[7px] text-warm/60 uppercase tracking-widest">
        vector {seq + 1}
      </span>
      <div className="h-px flex-1 bg-warm/20" />
    </div>
  );
}

function BreakLine({ line }: { line: CombatLogLine }) {
  const sev = SEV_STYLE[line.severity] ?? SEV_STYLE.medium;
  return (
    <div
      className={`
        relative border-l-4 pl-3 py-2 mb-2 rounded-r
        ${sev.border} ${sev.bg}
        animate-breakFlash
      `}
    >
      {/* role label */}
      <div className="flex items-center gap-2 mb-1">
        <span className={`font-pixel text-[7px] tracking-wider ${ROLE_STYLE[line.role]?.cls ?? "text-warm"}`}>
          {ROLE_STYLE[line.role]?.label ?? "?"}
        </span>
        <span className={`font-pixel text-[7px] px-1.5 py-0.5 tracking-wider ${sev.badge}`}>
          {line.severity === "critical" ? "⚡ CRITICAL BREAK" : `BROKE · ${line.severity}`}
          {line.detector ? ` · ${line.detector}` : ""}
        </span>
      </div>
      <p className="text-bone/90 font-mono text-sm whitespace-pre-wrap break-words">
        {line.content}
      </p>
      {/* decorative corner notch */}
      <div
        className="absolute top-0 right-0 w-2 h-2"
        style={{
          background:
            line.severity === "critical" ? "#7A1E12" : "rgba(194,65,12,0.6)",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />
    </div>
  );
}

function NormalLine({ line }: { line: CombatLogLine }) {
  const role = ROLE_STYLE[line.role] ?? ROLE_STYLE.system;
  return (
    <div className="mb-1.5 leading-relaxed">
      <span className={`font-pixel text-[7px] tracking-wider ${role.cls}`}>
        {role.label}
      </span>
      <span className="text-warm/40 text-xs"> ›</span>{" "}
      <span className="text-bone/80 font-mono text-sm whitespace-pre-wrap break-words">
        {line.content}
      </span>
    </div>
  );
}

export function CombatLog({
  lines,
  running,
}: {
  lines: CombatLogLine[];
  running: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="panel h-[520px] overflow-y-auto p-4 font-mono text-sm leading-relaxed">
      <div className="flex items-center gap-3 text-warm/60 text-xs mb-3 border-b border-warm/20 pb-2">
        <span className="font-pixel text-[7px] tracking-widest">COMBAT LOG</span>
        {running && (
          <span className="text-molten animate-ember font-pixel text-[7px]">● LIVE</span>
        )}
      </div>

      {lines.length === 0 && (
        <p className="text-warm/50 italic font-mono text-sm">awaiting the fire…</p>
      )}

      {lines.map((l, i) => {
        const prevLine = i > 0 ? lines[i - 1] : null;
        const showSep =
          prevLine !== null &&
          l.attemptSeq !== prevLine.attemptSeq &&
          l.attemptSeq >= 0;

        return (
          <div key={l.key}>
            {showSep && <VectorSeparator seq={l.attemptSeq} />}
            {l.broke ? <BreakLine line={l} /> : <NormalLine line={l} />}
          </div>
        );
      })}

      {running && (
        <div className="flex items-center gap-1.5 mt-2 text-molten">
          <span className="font-pixel text-[8px]">▮</span>
          <span className="animate-blink font-pixel text-[8px]">_</span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
