import { TIER_COLOR, TIER_LABEL, temperRatio, temperTier } from "../lib/temper";

const SEGMENTS = 20;

export function TemperBar({
  score,
  criticalBreak = false,
  showScore = true,
}: {
  score: number;
  criticalBreak?: boolean;
  showScore?: boolean;
}) {
  const tier = temperTier(score, criticalBreak);
  const ratio = temperRatio(score);
  const filled = Math.round(ratio * SEGMENTS);
  const color = TIER_COLOR[tier];

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-2">
        <span className="font-pixel text-[9px] uppercase tracking-wider text-warm">
          TEMPER
        </span>
        {showScore && (
          <span
            className="font-pixel text-2xl"
            style={{ color, textShadow: `0 0 12px ${color}` }}
          >
            {score}
          </span>
        )}
      </div>

      <div className="flex gap-[3px] h-6">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border border-forge-deep"
            style={{
              background: i < filled ? color : "rgba(138,106,74,0.18)",
              boxShadow: i < filled ? `0 0 6px ${color}` : "none",
              imageRendering: "pixelated",
            }}
          />
        ))}
      </div>

      <div className="mt-2 text-right">
        <span
          className="font-pixel text-[9px] uppercase tracking-widest"
          style={{ color }}
        >
          {TIER_LABEL[tier]}
        </span>
      </div>
    </div>
  );
}
