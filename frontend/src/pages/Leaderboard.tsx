import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TIER_COLOR, TIER_LABEL, temperTier } from "../lib/temper";
import type { LeaderboardEntry } from "../lib/types";

function Row({ e, slag }: { e: LeaderboardEntry; slag?: boolean }) {
  const tier = temperTier(e.temper, slag);
  const c = TIER_COLOR[tier];
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-warm/15 last:border-0 hover:bg-forge/40 transition-colors">
      <div className="flex items-center gap-3">
        <img src="/logo-skull.png" alt="" className="pixel-img w-6 h-6 opacity-80" />
        <span
          className={`font-mono ${slag ? "text-warm line-through decoration-oxblood" : "text-bone/90"}`}
        >
          {e.agent_name}
        </span>
        <span className="font-mono text-[10px] text-warm/50">v{e.corpus_version}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[8px] uppercase" style={{ color: c }}>
          {TIER_LABEL[tier]}
        </span>
        <span className="font-pixel text-sm" style={{ color: c }}>
          {e.temper}
        </span>
      </div>
    </div>
  );
}

export function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: api.getLeaderboard,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-pixel text-xl text-bone mb-2">The tempered</h1>
      <p className="font-mono text-warm text-sm mb-8">
        What survives is proven. What does not is slag.
      </p>

      {isLoading && <p className="text-warm font-mono">Reading the marks…</p>}

      <div className="panel mb-8">
        <h2 className="font-pixel text-[11px] text-amber uppercase p-4 border-b-2 border-warm/30">
          The proven
        </h2>
        {data?.the_proven.length ? (
          data.the_proven.map((e) => <Row key={e.agent_id} e={e} />)
        ) : (
          <p className="p-4 text-warm/60 font-mono text-sm">No survivors yet.</p>
        )}
      </div>

      <div className="panel">
        <h2 className="font-pixel text-[11px] text-oxblood uppercase p-4 border-b-2 border-warm/30">
          Slag
        </h2>
        {data?.slag.length ? (
          data.slag.map((e) => <Row key={e.agent_id} e={e} slag />)
        ) : (
          <p className="p-4 text-warm/60 font-mono text-sm">None broken yet.</p>
        )}
      </div>

      <div className="text-center mt-10">
        <Link to="/submit" className="btn-molten">
          Submit your agent
        </Link>
      </div>
    </div>
  );
}
