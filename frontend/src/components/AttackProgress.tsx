/**
 * Forge progress bar — shows current vector, category, and framework.
 * Displayed at the top of the trial forge panel.
 */

const CATEGORY_LABEL: Record<string, string> = {
  injection:    "PROMPT INJECTION",
  roleplay:     "PERSONA OVERRIDE",
  "social-eng": "SOCIAL ENGINEERING",
  "multi-turn": "MULTI-TURN CRESCENDO",
  "tool-abuse": "TOOL ABUSE",
};

const FRAMEWORK_COLOR: Record<string, string> = {
  garak:       "#e6a817",
  pyrit:       "#ff8c00",
  ai_attacker: "#ff2200",
};

const CATEGORY_COLOR: Record<string, string> = {
  injection:    "#ff6a1a",
  roleplay:     "#e6a817",
  "social-eng": "#ff8c00",
  "multi-turn": "#cc2200",
  "tool-abuse": "#ff2200",
};

interface Props {
  currentVector: number;
  totalVectors:  number;
  category:      string;
  framework:     string;
  isDone:        boolean;
}

export function AttackProgress({ currentVector, totalVectors, category, framework, isDone }: Props) {
  const pct    = isDone ? 100 : Math.round(((currentVector) / totalVectors) * 100);
  const label  = CATEGORY_LABEL[category] ?? category.toUpperCase();
  const fwColor = FRAMEWORK_COLOR[framework] ?? "#e6a817";
  const catColor = CATEGORY_COLOR[category] ?? "#ff6a1a";
  const isAI   = framework === "ai_attacker";

  return (
    <div className="w-full space-y-2 mb-4">
      {/* Category label + vector counter */}
      <div className="flex items-center justify-between">
        <span
          className="font-pixel text-[9px] uppercase tracking-wider"
          style={{ color: catColor }}
        >
          {category ? label : isDone ? "COMPLETE" : "INITIALIZING..."}
        </span>
        <span className="font-mono text-[10px] text-warm/60">
          {isDone ? totalVectors : currentVector} / {totalVectors}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-forge-deep border border-warm/20 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${catColor}88, ${catColor})`,
            boxShadow: `0 0 8px ${catColor}`,
          }}
        />
        {/* Scanline tick marks */}
        {Array.from({ length: totalVectors - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px bg-forge-deep/80"
            style={{ left: `${((i + 1) / totalVectors) * 100}%` }}
          />
        ))}
      </div>

      {/* Framework badge */}
      {framework && (
        <div className="flex items-center gap-2">
          <span
            className="font-pixel text-[7px] uppercase tracking-widest px-2 py-0.5 border"
            style={{ color: fwColor, borderColor: `${fwColor}60` }}
          >
            {isAI ? "⚡ AI ATTACKER" : framework.toUpperCase()}
          </span>
          {isAI && (
            <span className="font-mono text-[9px] text-warm/50">
              claude vs your agent
            </span>
          )}
        </div>
      )}
    </div>
  );
}
