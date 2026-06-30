import type {
  Agent,
  Attempt,
  CanaryInput,
  Leaderboard,
  PolicyInput,
  Trial,
} from "./types";
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.error ? JSON.stringify(body.error) : detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Agents ──────────────────────────────────────────────────────────────
  listAgents: () => req<Agent[]>("/agents"),
  getAgent: (id: string) => req<Agent>(`/agents/${id}`),

  createAgent: (input: {
    name: string;
    system_prompt?: string;
    endpoint_url?: string;
    model?: string;
    auth_headers?: Record<string, string>;
    attestation: true;
  }) =>
    req<Agent>("/agents", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  setManifest: (
    agentId: string,
    input: { canaries?: CanaryInput[]; policies?: PolicyInput[]; config_hash?: string }
  ) =>
    req<{ id: string; version: number; created_at: string }>(
      `/agents/${agentId}/manifest`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  // ── Trials ──────────────────────────────────────────────────────────────
  createTrial: (input: { agent_id: string; budget_cap?: Record<string, number> }) =>
    req<Trial>("/trials", { method: "POST", body: JSON.stringify(input) }),

  listTrials: () => req<Trial[]>("/trials"),
  getTrial: (id: string) => req<Trial>(`/trials/${id}`),
  getAttempts: (id: string) => req<Attempt[]>(`/trials/${id}/attempts`),

  // ── Leaderboard ─────────────────────────────────────────────────────────
  getLeaderboard: () => req<Leaderboard>("/leaderboard"),
};

// WebSocket URL for the live combat log.
export function combatLogUrl(trialId: string): string {
  const base = import.meta.env.VITE_WS_URL;
  if (base) return `${base}/stream/trial/${trialId}`;
  // Dev: same-origin, proxied by Vite.
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/stream/trial/${trialId}`;
}
