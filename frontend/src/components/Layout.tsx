import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

const NAV = [
  { to: "/submit", label: "submit" },
  { to: "/trials", label: "history" },
  { to: "/leaderboard", label: "the tempered" },
  { to: "/litepaper", label: "litepaper" },
];

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.25 2.25h6.988l4.256 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="crt-scanlines crt-vignette min-h-screen flex flex-col animate-flicker">
      <header className="border-b-2 border-warm/30 bg-forge-deep/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex-shrink-0">
            <Logo size={36} />
          </Link>

          <nav className="flex items-center gap-5">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`font-pixel text-[9px] uppercase tracking-wider transition-colors ${
                  pathname === n.to ? "text-molten" : "text-warm hover:text-amber"
                }`}
              >
                {n.label}
              </Link>
            ))}

            {/* Social icons */}
            <a
              href="https://x.com/runcrucible"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm hover:text-amber transition-colors ml-1"
              aria-label="X / Twitter"
            >
              <XIcon />
            </a>
            <a
              href="https://github.com/run-crucible/crucible"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm hover:text-amber transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t-2 border-warm/20 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-warm">
            CRUCIBLE — <span className="text-amber">Proven by fire.</span>
          </p>
          <div className="flex items-center gap-6">
            <Link to="/litepaper" className="font-pixel text-[8px] uppercase tracking-wider text-warm/60 hover:text-warm transition-colors">Litepaper</Link>
            <Link to="/faq" className="font-pixel text-[8px] uppercase tracking-wider text-warm/60 hover:text-warm transition-colors">FAQ</Link>
            <a href="https://x.com/runcrucible" target="_blank" rel="noopener noreferrer" className="text-warm/60 hover:text-warm transition-colors"><XIcon /></a>
            <a href="https://github.com/run-crucible/crucible" target="_blank" rel="noopener noreferrer" className="text-warm/60 hover:text-warm transition-colors"><GithubIcon /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
