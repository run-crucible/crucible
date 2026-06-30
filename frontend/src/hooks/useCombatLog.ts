import { useEffect, useRef, useState } from "react";
import { combatLogUrl } from "../lib/api";
import type {
  CombatDoneEvent,
  CombatEvent,
  CombatTurnEvent,
} from "../lib/types";

export interface CombatLogLine {
  key: string;
  attemptSeq: number;
  turn: number;
  role: "attacker" | "agent" | "system";
  content: string;
  broke: boolean;
  detector: string | null;
  severity: string;
  category: string;
  framework: string;
  totalVectors: number;
}

interface CombatLogState {
  lines: CombatLogLine[];
  done: CombatDoneEvent | null;
  fracture: number;
  fractureSeverity: string;
  connected: boolean;
  currentCategory: string;
  currentFramework: string;
  currentVector: number;
  totalVectors: number;
  phaseChange: number; // increments when category changes → triggers banner
}

/**
 * Subscribes to the live combat log for a trial over WebSocket.
 * Handles replay events (on reconnect) + live turn events + the done event.
 */
export function useCombatLog(trialId: string | undefined): CombatLogState {
  const [lines, setLines] = useState<CombatLogLine[]>([]);
  const [done, setDone] = useState<CombatDoneEvent | null>(null);
  const [fracture, setFracture] = useState(0);
  const [fractureSeverity, setFractureSeverity] = useState("high");
  const [connected, setConnected] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentFramework, setCurrentFramework] = useState("");
  const [currentVector, setCurrentVector] = useState(0);
  const [totalVectors, setTotalVectors] = useState(12);
  const [phaseChange, setPhaseChange] = useState(0);
  const lastCategory = useRef("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!trialId) return;
    setLines([]);
    setDone(null);
    setFracture(0);
    setFractureSeverity("high");

    const ws = new WebSocket(combatLogUrl(trialId));
    wsRef.current = ws;

    lastCategory.current = "";
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (ev) => {
      let msg: CombatEvent;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      if ("type" in msg && msg.type === "done") {
        setDone(msg);
        ws.close();
        return;
      }

      if ("type" in msg && msg.type === "attempt_replay") {
        // Replayed historical attempt — render as a compact verdict line.
        setLines((prev) => [
          ...prev,
          {
            key: `replay-${msg.seq}`,
            attemptSeq: msg.seq,
            turn: -1,
            role: "system",
            content: `attempt #${msg.seq} — ${msg.outcome ?? "?"}${
              msg.detector ? ` (${msg.detector})` : ""
            }`,
            broke: msg.outcome === "broke",
            detector: msg.detector,
            severity: msg.severity,
            category: "",
            framework: "",
            totalVectors: 0,
          },
        ]);
        return;
      }

      // Live per-turn event
      const turn = msg as CombatTurnEvent & {
        category?: string; framework?: string; total_vectors?: number;
      };

      const cat = turn.category ?? "";
      const fw  = turn.framework ?? "";
      const tot = turn.total_vectors ?? 12;

      if (cat && cat !== lastCategory.current) {
        lastCategory.current = cat;
        setCurrentCategory(cat);
        setPhaseChange((p) => p + 1);
      }
      if (fw) setCurrentFramework(fw);
      setCurrentVector(turn.attempt_seq ?? 0);
      if (tot) setTotalVectors(tot);

      setLines((prev) => [
        ...prev,
        {
          key: `${turn.attempt_seq}-${turn.turn}-${prev.length}`,
          attemptSeq: turn.attempt_seq,
          turn: turn.turn,
          role: turn.role,
          content: turn.content,
          broke: turn.broke,
          detector: turn.detector,
          severity: turn.severity,
          category: cat,
          framework: fw,
          totalVectors: tot,
        },
      ]);

      if (turn.broke) {
        setFractureSeverity(turn.severity ?? "high");
        setFracture((f) => f + 1);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [trialId]);

  return {
    lines, done, fracture, fractureSeverity, connected,
    currentCategory, currentFramework, currentVector, totalVectors, phaseChange,
  };
}
