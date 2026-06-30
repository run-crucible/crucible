/**
 * Animated "ATTACKER THINKING..." indicator.
 * Shown between WebSocket events to fill the 10-second gaps.
 * Disappears the moment a new event arrives.
 */
import { useEffect, useState } from "react";

const MESSAGES_AI = [
  "ADAPTING STRATEGY...",
  "ANALYZING DEFENSES...",
  "CRAFTING NEXT VECTOR...",
  "ESCALATING PRESSURE...",
  "PROBING VULNERABILITIES...",
  "CALCULATING ATTACK...",
];

const MESSAGES_STATIC = [
  "LOADING VECTOR...",
  "FIRING ATTACK...",
  "AWAITING RESPONSE...",
];

interface Props {
  lastEventAt: number;    // timestamp of last WS event
  framework:   string;
  isDone:      boolean;
}

export function AttackerThinking({ lastEventAt, framework, isDone }: Props) {
  const [show, setShow]       = useState(false);
  const [msgIdx, setMsgIdx]   = useState(0);
  const [dots, setDots]       = useState("");
  const isAI = framework === "ai_attacker";
  const messages = isAI ? MESSAGES_AI : MESSAGES_STATIC;

  useEffect(() => {
    setShow(false);
    if (isDone) return;
    // Show after 1.5s of silence
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [lastEventAt, isDone]);

  // Cycle messages every 3s
  useEffect(() => {
    if (!show) return;
    const t = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 3000);
    return () => clearInterval(t);
  }, [show, messages.length]);

  // Animate dots
  useEffect(() => {
    if (!show) return;
    const t = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Pulsing indicator */}
      <span
        className="w-2 h-2 rounded-none flex-shrink-0"
        style={{
          background: isAI ? "#ff2200" : "#ff6a1a",
          boxShadow: `0 0 8px ${isAI ? "#ff2200" : "#ff6a1a"}`,
          animation: "pulse 1s ease-in-out infinite",
        }}
      />
      <span
        className="font-pixel text-[9px] uppercase tracking-wider"
        style={{ color: isAI ? "#ff2200" : "#e6a817" }}
      >
        {messages[msgIdx]}{dots}
      </span>
    </div>
  );
}
