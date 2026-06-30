import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useCombatLog } from "../hooks/useCombatLog";
import { SkullFurnace } from "../components/SkullFurnace";
import { CombatLog } from "../components/CombatLog";
import { TemperBar } from "../components/TemperBar";
import { MarkStamp } from "../components/MarkStamp";
import { FractureOverlay } from "../components/FractureOverlay";
import { PixelDamageLayer, usePixelDamage } from "../components/PixelDamage";
import { AttackProgress } from "../components/AttackProgress";
import { PhaseAnnouncer } from "../components/PhaseAnnouncer";
import { AttackerThinking } from "../components/AttackerThinking";
import { temperTier } from "../lib/temper";

export function Trial() {
  const { id } = useParams<{ id: string }>();
  const {
    lines, done, fracture, fractureSeverity, connected,
    currentCategory, currentFramework, currentVector, totalVectors, phaseChange,
  } = useCombatLog(id);
  const { entries: damageEntries, push: pushDamage } = usePixelDamage();

  // Track last event timestamp for "thinking" indicator
  const [lastEventAt, setLastEventAt] = useState(Date.now());
  const prevLinesLen = useRef(0);
  useEffect(() => {
    if (lines.length !== prevLinesLen.current) {
      prevLinesLen.current = lines.length;
      setLastEventAt(Date.now());
    }
  }, [lines.length]);

  // Poll trial status until done
  const { data: trial } = useQuery({
    queryKey: ["trial", id],
    queryFn: () => api.getTrial(id!),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data && ["done", "failed"].includes(q.state.data.status) ? false : 3000,
  });

  const breakCount  = lines.filter((l) => l.broke).length;
  const damage      = Math.min(1, breakCount * 0.2);
  const crackLevel  = Math.min(breakCount, 4);

  const finalTemper  = done?.temper ?? trial?.temper ?? null;
  const isDone       = !!done || trial?.status === "done" || trial?.status === "failed";
  const criticalBreak = trial?.critical_break ?? false;

  const proven = useMemo(() => {
    if (finalTemper == null) return false;
    return !criticalBreak && temperTier(finalTemper, criticalBreak) !== "slag";
  }, [finalTemper, criticalBreak]);

  // Screen shake + pixel damage on every break
  const [panelShake, setPanelShake] = useState(false);
  useEffect(() => {
    if (fracture === 0) return;
    setPanelShake(true);
    pushDamage(fractureSeverity);
    const t = setTimeout(() => setPanelShake(false), 600);
    return () => clearTimeout(t);
  }, [fracture]); // eslint-disable-line

  return (
    <>
      {/* Full-screen fracture flash */}
      <FractureOverlay trigger={fracture} severity={fractureSeverity} />

      {/* Phase announcement banner */}
      <PhaseAnnouncer
        trigger={phaseChange}
        category={currentCategory}
        framework={currentFramework}
      />

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-pixel text-lg text-bone">
            {trial?.agent_name ?? "the ordeal"}
          </h1>
          <span
            className={`font-pixel text-[9px] uppercase px-2 py-1 border ${
              connected
                ? "border-molten text-molten"
                : isDone ? "border-warm/40 text-warm" : "border-warm/20 text-warm/40"
            }`}
          >
            {connected ? "● live" : isDone ? "complete" : "○ connecting..."}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── Left: forge panel ── */}
          <div
            className={`panel p-6 flex flex-col items-center transition-all ${
              panelShake ? "animate-shake" : ""
            }`}
          >
            {/* Progress bar — visible while running */}
            {!isDone && (
              <div className="w-full">
                <AttackProgress
                  currentVector={currentVector}
                  totalVectors={totalVectors}
                  category={currentCategory}
                  framework={currentFramework}
                  isDone={isDone}
                />
              </div>
            )}

            {/* Skull / Mark */}
            {isDone && proven ? (
              <MarkStamp size={220} />
            ) : (
              <div className="relative my-4">
                <SkullFurnace
                  damage={damage}
                  fractured={panelShake}
                  crackLevel={crackLevel}
                  burstTrigger={fracture}
                  burstSeverity={fractureSeverity}
                  size={220}
                />
                <PixelDamageLayer entries={damageEntries} />
              </div>
            )}

            {/* "Thinking" indicator between events */}
            {!isDone && (
              <AttackerThinking
                lastEventAt={lastEventAt}
                framework={currentFramework}
                isDone={isDone}
              />
            )}

            {/* TEMPER bar or "in the fire" */}
            <div className="w-full mt-4">
              {finalTemper != null ? (
                <TemperBar score={finalTemper} criticalBreak={criticalBreak} />
              ) : (
                <div className="text-center space-y-1">
                  <p className="font-pixel text-[9px] text-warm uppercase tracking-widest animate-ember">
                    {lines.length === 0 ? "igniting..." : "in the fire"}
                  </p>
                  {breakCount > 0 && (
                    <p className="font-pixel text-[8px] text-oxblood">
                      {breakCount} fracture{breakCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Done verdict */}
            {isDone && (
              <div className="mt-6 text-center w-full">
                <div
                  className={`panel p-4 border-2 ${
                    proven ? "border-amber/60" : "border-oxblood/60"
                  }`}
                >
                  {proven ? (
                    <>
                      <p className="font-pixel text-amber text-xs mb-1">
                        THE MARK IS BURNED
                      </p>
                      <p className="font-mono text-warm text-xs">
                        TEMPER {finalTemper} — proven by fire
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-pixel text-oxblood text-xs mb-1">
                        REDUCED TO SLAG
                      </p>
                      <p className="font-mono text-warm text-xs">
                        TEMPER {finalTemper} —{" "}
                        {criticalBreak
                          ? "critical break capped the score"
                          : "not yet proven"}
                      </p>
                    </>
                  )}
                </div>
                <Link
                  to={`/trial/${id}/report`}
                  className="btn-molten inline-block mt-4 text-xs"
                >
                  VIEW THE VERDICT
                </Link>
              </div>
            )}

            {/* Live attack counter while running */}
            {!isDone && lines.length > 0 && (
              <div className="mt-4 w-full grid grid-cols-3 gap-2 text-center">
                <div className="panel p-2">
                  <p className="font-pixel text-[7px] text-warm/50 uppercase mb-1">Attacks</p>
                  <p className="font-pixel text-sm text-amber">
                    {lines.filter(l => l.role === "attacker").length}
                  </p>
                </div>
                <div className="panel p-2">
                  <p className="font-pixel text-[7px] text-warm/50 uppercase mb-1">Survived</p>
                  <p className="font-pixel text-sm text-amber">
                    {lines.filter(l => l.role === "agent" && !l.broke).length}
                  </p>
                </div>
                <div className="panel p-2">
                  <p className="font-pixel text-[7px] text-warm/50 uppercase mb-1">Breaks</p>
                  <p className={`font-pixel text-sm ${breakCount > 0 ? "text-oxblood" : "text-amber"}`}>
                    {breakCount}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: combat log ── */}
          <CombatLog lines={lines} running={!isDone} />
        </div>
      </div>
    </>
  );
}
