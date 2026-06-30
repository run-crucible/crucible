export type Severity = "none" | "low" | "medium" | "high" | "critical";
export type Detector = "canary" | "policy" | "tool_call";
export type Outcome = "survived" | "broke";
export type TrialStatus = "queued" | "running" | "done" | "failed";
export type AgentStatus = "draft" | "verified" | "retired";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  created_at: string;
  updated_at?: string;
}

export interface CanaryInput {
  token: string;
  description?: string;
}

export interface PolicyInput {
  id: string;
  pattern: string;
  description?: string;
  severity: Severity;
}

export interface Trial {
  id: string;
  status: TrialStatus;
  temper: number | null;
  category_scores: Record<string, number> | null;
  critical_break: boolean;
  error_msg: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  agent_name?: string;
  stream_url?: string;
}

export interface Attempt {
  seq: number;
  outcome: Outcome | null;
  detector: Detector | null;
  severity: Severity;
  turns: number;
  created_at: string;
  finished_at: string | null;
  category: string;
  difficulty: number;
  framework: string;
}

export interface LeaderboardEntry {
  temper: number;
  status: "proven" | "slag";
  updated_at: string;
  agent_name: string;
  agent_id: string;
  corpus_version: number;
}

export interface Leaderboard {
  the_proven: LeaderboardEntry[];
  slag: LeaderboardEntry[];
  total: number;
}

// ── WebSocket combat-log message shapes ────────────────────────────────────────

export interface CombatTurnEvent {
  type?: undefined;
  trial_id: string;
  attempt_seq: number;
  vector_id: string;
  turn: number;
  role: "attacker" | "agent" | "system";
  content: string;
  broke: boolean;
  detector: Detector | null;
  severity: Severity;
}

export interface CombatReplayEvent {
  type: "attempt_replay";
  seq: number;
  vector_id: string;
  outcome: Outcome | null;
  detector: Detector | null;
  severity: Severity;
  turns: number;
}

export interface CombatDoneEvent {
  type: "done";
  trial_id: string;
  temper: number;
  category_scores: Record<string, number>;
}

export type CombatEvent = CombatTurnEvent | CombatReplayEvent | CombatDoneEvent;
