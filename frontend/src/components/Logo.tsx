import { Link } from "react-router-dom";

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img
        src="/logo-skull.png"
        alt="CRUCIBLE"
        className="pixel-img drop-shadow-[0_0_10px_rgba(255,106,26,0.5)]"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="font-pixel text-bone text-sm tracking-widest group-hover:text-amber transition-colors">
          CRUCIBLE
        </span>
      )}
    </Link>
  );
}
