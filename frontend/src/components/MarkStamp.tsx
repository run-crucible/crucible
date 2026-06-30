/**
 * THE MARK — stamped onto a proven agent. The skull sigil burns in hot-white,
 * then cools to oxblood (animate-stamp drives the scale/brightness).
 */
export function MarkStamp({ size = 200 }: { size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 animate-stamp"
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-skull.png"
          alt="the mark"
          className="pixel-img w-full h-full object-contain"
          style={{ filter: "sepia(1) saturate(3) hue-rotate(-20deg)" }}
        />
      </div>
      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,176,32,0.4), transparent 60%)",
        }}
      />
    </div>
  );
}
