import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TIER_COLOR, TIER_LABEL, temperTier } from "../lib/temper";
import type { Trial } from "../lib/types";

const STATUS_COLOR: Record<string, string> = {
  queued:  "#e6a817",
  running: "#ff6a1a",
  done:    "#4ade80",
  failed:  "#cc2200",
};

const STATUS_LABEL: Record<string, string> = {
  queued:  "queued",
  running: "● live",
  done:    "done",
  failed:  "failed",
};

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function duration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function TrialRow({ t }: { t: Trial }) {
  const isDone     = t.status === "done";
  const isCritical = t.critical_break ?? false;
  const tier       = isDone && t.temper != null ? temperTier(t.temper, isCritical) : null;
  const tierColor  = tier ? TIER_COLOR[tier] : "#e6a817";
  const tierLabel  = tier ? TIER_LABEL[tier] : "";
  const statusColor = STATUS_COLOR[t.status] ?? "#e6a817";

  return (
    <Link
      to={isDone ? `/trial/${t.id}/report` : `/trial/${t.id}`}
      className="grid grid-cols-12 items-center gap-2 py-3 px-4 border-b border-warm/15
                 last:border-0 hover:bg-forge/30 transition-colors cursor-pointer group"
    >
      {/* Agent name */}
      <div className="col-span-4 flex items-center gap-2 min-w-0">
        <img src="/logo-skull.png" alt="" className="pixel-img w-5 h-5 opacity-70 flex-shrink-0" />
        <span className="font-mono text-sm text-bone/90 truncate group-hover:text-amber transition-colors">
          {(t as any).agent_name ?? "unknown"}
        </span>
      </div>

      {/* Status */}
      <div className="col-span-2">
        <span
          className="font-pixel text-[8px] uppercase tracking-wider"
          style={{ color: statusColor }}
        >
          {STATUS_LABEL[t.status] ?? t.status}
        </span>
      </div>

      {/* TEMPER */}
      <div className="col-span-2 flex items-center gap-2">
        {isDone && t.temper != null ? (
          <>
            <span className="font-pixel text-sm" style={{ color: tierColor }}>
              {t.temper}
            </span>
            <span className="font-pixel text-[7px] uppercase hidden sm:inline" style={{ color: tierColor }}>
              {tierLabel}
            </span>
          </>
        ) : (
          <span className="font-mono text-xs text-warm/30">—</span>
        )}
      </div>

      {/* Duration */}
      <div className="col-span-2 font-mono text-[10px] text-warm/50">
        {duration(t.started_at, t.finished_at)}
      </div>

      {/* Date */}
      <div className="col-span-2 font-mono text-[10px] text-warm/40 text-right">
        {fmt(t.created_at)}
      </div>
    </Link>
  );
}

export function Trials() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["trials"],
    queryFn: () => api.listTrials(),
    refetchInterval: 10000,
  });

  const running = data?.filter(t => t.status === "running" || t.status === "queued") ?? [];
  const finished = data?.filter(t => t.status === "done" || t.status === "failed") ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-pixel text-xl text-bone mb-1">trial history</h1>
          <p className="font-mono text-xs text-warm/50">all agents put to the fire</p>
        </div>
        <Link to="/submit" className="btn-molten text-xs">
          + new trial
        </Link>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: data.length },
            { label: "Running", value: running.length, color: "#ff6a1a" },
            { label: "Done", value: finished.filter(t => t.status === "done").length, color: "#4ade80" },
            {
              label: "Avg TEMPER",
              value: (() => {
                const scored = finished.filter(t => t.temper != null);
                if (!scored.length) return "—";
                return Math.round(scored.reduce((s, t) => s + (t.temper ?? 0), 0) / scored.length);
              })(),
              color: "#e6a817",
            },
          ].map(s => (
            <div key={s.label} className="panel p-4 text-center">
              <p className="font-pixel text-[7px] uppercase text-warm/50 mb-1">{s.label}</p>
              <p className="font-pixel text-lg" style={{ color: s.color ?? "#f5e6c8" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="panel p-12 text-center">
          <p className="font-pixel text-[9px] text-warm animate-ember uppercase tracking-widest">
            loading records...
          </p>
        </div>
      )}

      {error && (
        <div className="panel p-8 border border-oxblood/40 text-center">
          <p className="font-mono text-xs text-oxblood">failed to load trials</p>
        </div>
      )}

      {/* Active trials */}
      {running.length > 0 && (
        <div className="mb-6">
          <h2 className="font-pixel text-[9px] uppercase tracking-widest text-molten mb-3">
            ● active
          </h2>
          <div className="panel overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-warm/20 text-warm/40">
              <div className="col-span-4 font-pixel text-[7px] uppercase">Agent</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">Status</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">TEMPER</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">Time</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase text-right">Started</div>
            </div>
            {running.map(t => <TrialRow key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {/* Finished trials */}
      {finished.length > 0 && (
        <div>
          <h2 className="font-pixel text-[9px] uppercase tracking-widest text-warm/50 mb-3">
            completed
          </h2>
          <div className="panel overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-warm/20 text-warm/40">
              <div className="col-span-4 font-pixel text-[7px] uppercase">Agent</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">Status</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">TEMPER</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase">Duration</div>
              <div className="col-span-2 font-pixel text-[7px] uppercase text-right">Date</div>
            </div>
            {finished.map(t => <TrialRow key={t.id} t={t} />)}
          </div>
        </div>
      )}

      {data?.length === 0 && (
        <div className="panel p-16 text-center space-y-4">
          <img src="/logo-skull.png" alt="" className="pixel-img w-16 h-16 mx-auto opacity-30" />
          <p className="font-pixel text-[9px] uppercase text-warm/40 tracking-widest">
            no trials yet
          </p>
          <Link to="/submit" className="btn-molten text-xs inline-block">
            be the first
          </Link>
        </div>
      )}
    </div>
  );
}
