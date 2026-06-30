import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TemperBar } from "../components/TemperBar";
import { MarkStamp } from "../components/MarkStamp";
import { TIER_COLOR, temperTier } from "../lib/temper";

const SEV_COLOR: Record<string, string> = {
  critical: "#7A1E12",
  high: "#C2410C",
  medium: "#FFB020",
  low: "#8A6A4A",
  none: "#5C7A66",
};

export function Report() {
  const { id } = useParams<{ id: string }>();

  const { data: trial } = useQuery({
    queryKey: ["trial", id],
    queryFn: () => api.getTrial(id!),
    enabled: !!id,
  });
  const { data: attempts } = useQuery({
    queryKey: ["attempts", id],
    queryFn: () => api.getAttempts(id!),
    enabled: !!id,
  });

  if (!trial) return <div className="max-w-3xl mx-auto px-4 py-16 text-warm">Loading verdict…</div>;

  const temper = trial.temper ?? 300;
  const proven = !trial.critical_break && temperTier(temper, trial.critical_break) !== "slag";
  const broke = (attempts ?? []).filter((a) => a.outcome === "broke");

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/leaderboard" className="font-mono text-xs text-warm hover:text-amber">
        ← the tempered
      </Link>

      <div className="text-center my-8">
        <h1 className="font-pixel text-xl text-bone mb-1">{trial.agent_name}</h1>
        <p className="font-mono text-warm text-sm">the verdict</p>
      </div>

      <div className="panel p-8 flex flex-col items-center">
        {proven ? <MarkStamp size={160} /> : (
          <div className="font-pixel text-oxblood text-2xl py-8">SLAG</div>
        )}
        <div className="w-full max-w-md mt-6">
          <TemperBar score={temper} criticalBreak={trial.critical_break} />
        </div>
      </div>

      {/* Category breakdown */}
      {trial.category_scores && (
        <div className="panel p-6 mt-6">
          <h2 className="label-pixel">By category</h2>
          {Object.entries(trial.category_scores).map(([cat, score]) => {
            const c = TIER_COLOR[temperTier(score)];
            const pct = ((score - 300) / 550) * 100;
            return (
              <div key={cat} className="mb-3">
                <div className="flex justify-between font-mono text-xs mb-1">
                  <span className="text-bone/80">{cat}</span>
                  <span style={{ color: c }}>{score}</span>
                </div>
                <div className="h-3 bg-warm/15 border border-forge-deep">
                  <div
                    className="h-full"
                    style={{ width: `${pct}%`, background: c, boxShadow: `0 0 6px ${c}` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Where it cracked */}
      <div className="panel p-6 mt-6">
        <h2 className="label-pixel">Where it cracked</h2>
        {broke.length === 0 ? (
          <p className="font-mono text-sm text-held">Held against every vector. Nothing cracked.</p>
        ) : (
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="text-warm text-xs text-left border-b border-warm/20">
                <th className="py-2">#</th>
                <th>category</th>
                <th>framework</th>
                <th>detector</th>
                <th>severity</th>
              </tr>
            </thead>
            <tbody>
              {broke.map((a) => (
                <tr key={a.seq} className="border-b border-warm/10">
                  <td className="py-2 text-warm">{a.seq}</td>
                  <td className="text-bone/90">{a.category}</td>
                  <td className="text-warm">{a.framework}</td>
                  <td className="text-warm">{a.detector ?? "—"}</td>
                  <td style={{ color: SEV_COLOR[a.severity] }}>{a.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
