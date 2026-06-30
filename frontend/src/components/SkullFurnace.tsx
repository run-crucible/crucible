/**
 * The agent under trial — pixel skull in the forge.
 *
 * damage 0..1     → heat overlay intensity, crack visibility
 * fractured       → triggers animate-shake
 * crackLevel 0..3 → how many crack layers are drawn (each new break adds one)
 * burstTrigger    → passed to PixelBurst to replay the explosion
 * burstSeverity   → severity of the last break
 */
import { PixelBurst } from "./PixelBurst";

// SVG crack paths (in 0–100 viewBox coords, over the skull face)
const CRACKS = [
  // Crack 1: diagonal from top-center down into the eye socket
  "M 52 8 L 46 22 L 50 30 L 44 42",
  // Crack 2: from right temple, branching
  "M 78 28 L 63 40 L 68 52 L 60 64 M 63 40 L 72 50",
  // Crack 3: wide horizontal fracture across forehead
  "M 18 22 L 35 18 L 52 24 L 68 19 L 85 24",
  // Crack 4: jagged lower crack + vertical split
  "M 30 65 L 42 60 L 50 70 L 58 58 L 72 66 M 50 70 L 50 88",
] as const;

const CRACK_COLOR = "#7A1E12";

export function SkullFurnace({
  damage = 0,
  fractured = false,
  crackLevel = 0,
  burstTrigger = 0,
  burstSeverity = "high",
  size = 240,
}: {
  damage?: number;
  fractured?: boolean;
  crackLevel?: number;
  burstTrigger?: number;
  burstSeverity?: string;
  size?: number;
}) {
  const visibleCracks = Math.min(crackLevel, CRACKS.length);

  return (
    <div
      className={`relative mx-auto select-none transition-all duration-500 ${
        fractured ? "animate-shake" : ""
      }`}
      style={{ width: size, height: size }}
    >
      {/* Rising forge glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 animate-riseGlow blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(255,106,26,0.7), rgba(255,61,0,0.2) 50%, transparent 75%)",
        }}
      />

      {/* The skull */}
      <img
        src="/logo-skull.png"
        alt="agent under trial"
        className="pixel-img relative z-10 w-full h-full object-contain transition-all duration-700"
        style={{
          filter: [
            `brightness(${1 + damage * 0.7})`,
            `saturate(${1 + damage * 1.2})`,
            damage > 0.5 ? `hue-rotate(${(damage - 0.5) * -20}deg)` : "",
          ]
            .filter(Boolean)
            .join(" "),
        }}
      />

      {/* Pixel-art crack overlay — blocky segments, no smooth paths */}
      {visibleCracks > 0 && (
        <svg
          className="absolute inset-0 z-20 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ imageRendering: "pixelated" }}
        >
          {CRACKS.slice(0, visibleCracks).map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={i >= 2 && damage > 0.6 ? "#FF3D00" : CRACK_COLOR}
              strokeWidth={i === 0 ? "1.5" : "2"}
              strokeLinecap="square"    /* pixel-art: no rounded ends */
              strokeLinejoin="miter"
              fill="none"
              opacity={0.6 + i * 0.1}
              strokeDasharray="200"
              strokeDashoffset="0"
              className="animate-crackIn"
              style={{
                animationDelay: `${i * 50}ms`,
                shapeRendering: "crispEdges",  /* force pixel-crisp rendering */
              }}
            />
          ))}
        </svg>
      )}

      {/* Molten heat overlay — intensifies with damage */}
      <div
        className="absolute inset-0 z-[21] pointer-events-none mix-blend-screen transition-opacity duration-700"
        style={{
          opacity: damage * 0.75,
          background:
            "radial-gradient(circle at 62% 45%, rgba(255,61,0,0.9), transparent 50%)",
        }}
      />

      {/* FRACTURE flash burst — brief radial bloom */}
      {fractured && (
        <div
          className="absolute inset-0 z-30 pointer-events-none animate-fracture"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(255,80,0,0.7), rgba(122,30,18,0.35) 55%, transparent 80%)",
          }}
        />
      )}

      {/* Pixel art explosion canvas overlay */}
      <PixelBurst trigger={burstTrigger} severity={burstSeverity} size={size} />

      {/* Pixel flame strip at the base */}
      <div
        className="absolute -bottom-2 inset-x-6 h-6 z-10 animate-ember"
        style={{
          background:
            "repeating-linear-gradient(90deg, #FF3D00 0 6px, #FF6A1A 6px 12px, #FFB020 12px 18px)",
          maskImage:
            "repeating-linear-gradient(90deg, black 0 8px, transparent 8px 12px)",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
