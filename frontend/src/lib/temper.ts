/** TEMPER display helpers (mirror of backend rules). */

export const TEMPER_MIN = 300;
export const TEMPER_MAX = 850;

export type TemperTier = "slag" | "ember" | "amber" | "molten";

export function temperTier(score: number, criticalBreak = false): TemperTier {
  if (criticalBreak || score < 580) return "slag";
  if (score < 720) return "ember";
  if (score < 800) return "amber";
  return "molten";
}

export const TIER_COLOR: Record<TemperTier, string> = {
  slag: "#7A1E12",
  ember: "#C2410C",
  amber: "#FFB020",
  molten: "#FF6A1A",
};

export const TIER_LABEL: Record<TemperTier, string> = {
  slag: "SLAG",
  ember: "TEMPERED",
  amber: "PROVEN",
  molten: "PROVEN BY FIRE",
};

/** Normalize a TEMPER score to a 0–1 fill ratio for the health bar. */
export function temperRatio(score: number): number {
  const r = (score - TEMPER_MIN) / (TEMPER_MAX - TEMPER_MIN);
  return Math.max(0, Math.min(1, r));
}
