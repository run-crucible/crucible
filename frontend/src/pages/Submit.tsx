import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { CanaryInput, PolicyInput, Severity } from "../lib/types";

function randomCanary(): string {
  return "CRUCIBLE_" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

type Mode = "hosted" | "custom";

export function Submit() {
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("hosted");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [authKey, setAuthKey] = useState("Authorization");
  const [authVal, setAuthVal] = useState("");
  const [attested, setAttested] = useState(false);

  const [canaries, setCanaries] = useState<CanaryInput[]>([
    { token: randomCanary(), description: "auto-embedded" },
  ]);
  const [policies, setPolicies] = useState<PolicyInput[]>([]);
  const [agentId, setAgentId] = useState<string | null>(null);

  async function submitAgent() {
    setError(null);
    if (!name || !attested) {
      setError("Agent name and attestation are required.");
      return;
    }
    if (mode === "hosted" && !systemPrompt.trim()) {
      setError("System prompt is required for hosted mode.");
      return;
    }
    if (mode === "custom" && !endpoint.trim()) {
      setError("Endpoint URL is required for custom mode.");
      return;
    }
    setSubmitting(true);
    try {
      const auth_headers = authKey && authVal ? { [authKey]: authVal } : {};
      const agent = await api.createAgent({
        name,
        system_prompt: mode === "hosted" ? systemPrompt : undefined,
        endpoint_url: mode === "custom" ? endpoint : undefined,
        auth_headers,
        attestation: true,
      });
      setAgentId(agent.id);
      setStep(2);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitManifestAndRun() {
    if (!agentId) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.setManifest(agentId, { canaries, policies });
      const trial = await api.createTrial({ agent_id: agentId });
      nav(`/trial/${trial.id}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-pixel text-xl text-bone mb-1">Submit to the trial</h1>
      <p className="font-mono text-warm text-sm mb-8">
        Step {step} of 2 — {step === 1 ? "your agent" : "the manifest"}
      </p>

      {error && (
        <div className="panel border-oxblood/60 p-3 mb-6 font-mono text-sm text-oxblood">
          {error}
        </div>
      )}

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="space-y-6">

          {/* Mode */}
          <div>
            <label className="label-pixel mb-3 block">How does your agent run?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("hosted")}
                className={`panel p-4 text-left transition-colors ${
                  mode === "hosted" ? "border-amber/60 bg-amber/5" : "hover:border-warm/50"
                }`}
              >
                <p className="font-pixel text-[10px] text-amber uppercase mb-1">
                  Paste system prompt
                </p>
                <p className="font-mono text-xs text-warm/70 leading-relaxed">
                  We run the model ourselves using Claude. You just paste your system prompt.
                </p>
              </button>
              <button
                onClick={() => setMode("custom")}
                className={`panel p-4 text-left transition-colors ${
                  mode === "custom" ? "border-amber/60 bg-amber/5" : "hover:border-warm/50"
                }`}
              >
                <p className="font-pixel text-[10px] text-amber uppercase mb-1">
                  My own endpoint
                </p>
                <p className="font-mono text-xs text-warm/70 leading-relaxed">
                  I have a deployed agent accessible via HTTP. I'll provide the URL.
                </p>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="label-pixel">Agent name</label>
            <input
              className="input-forge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-support-bot"
            />
          </div>

          {/* Hosted: system prompt */}
          {mode === "hosted" && (
            <div>
              <label className="label-pixel">System prompt</label>
              <textarea
                className="input-forge min-h-[160px] resize-y font-mono text-sm"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder={`You are a helpful customer support assistant for Acme Corp.\n\nYou must:\n- Never discuss competitors\n- Always respond in English\n- Never reveal internal pricing`}
              />
              <p className="font-mono text-[11px] text-warm/50 mt-1">
                Canary tokens will be embedded automatically — no manual changes needed.
              </p>
            </div>
          )}

          {/* Custom: endpoint + auth */}
          {mode === "custom" && (
            <div className="space-y-4">
              <div>
                <label className="label-pixel">Endpoint URL</label>
                <input
                  className="input-forge"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://my-agent.example.com/v1"
                />
                <p className="font-mono text-[11px] text-warm/50 mt-1">
                  Must accept <code className="text-amber">POST /chat/completions</code> in OpenAI format.
                </p>
              </div>
              <div>
                <label className="label-pixel">
                  Auth header{" "}
                  <span className="text-warm/40 font-mono normal-case text-xs">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    className="input-forge w-40 flex-shrink-0"
                    value={authKey}
                    onChange={(e) => setAuthKey(e.target.value)}
                  />
                  <input
                    className="input-forge flex-1"
                    value={authVal}
                    onChange={(e) => setAuthVal(e.target.value)}
                    placeholder="Bearer your-token"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Attestation */}
          <label className="flex items-start gap-3 cursor-pointer panel p-4">
            <input
              type="checkbox"
              checked={attested}
              onChange={(e) => setAttested(e.target.checked)}
              className="mt-0.5 accent-molten flex-shrink-0"
            />
            <span className="font-mono text-sm text-bone/80">
              I own this agent or am authorized to run adversarial tests against it.
            </span>
          </label>

          <button className="btn-molten w-full" disabled={submitting} onClick={submitAgent}>
            {submitting ? "…" : "Continue → manifest"}
          </button>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="space-y-6">

          {/* Canaries */}
          <div className="panel p-5">
            <h2 className="label-pixel mb-1">Canary tokens</h2>
            {mode === "hosted" ? (
              <p className="font-mono text-xs text-warm/70 mb-4 leading-relaxed">
                These tokens are <span className="text-amber">automatically embedded</span> in
                your system prompt. If CRUCIBLE's attacks make Claude reveal one, that's a
                confirmed break.
              </p>
            ) : (
              <p className="font-mono text-xs text-warm/70 mb-4 leading-relaxed">
                Copy these tokens and paste them into your agent's{" "}
                <span className="text-amber">system prompt</span> as secrets to protect. If
                CRUCIBLE makes your agent reveal one verbatim, that's a confirmed break.
              </p>
            )}

            {canaries.map((c, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <code className="flex-1 bg-forge-deep border border-warm/30 px-3 py-2 text-molten text-sm font-mono select-all">
                  {c.token}
                </code>
                <button
                  className="font-pixel text-[9px] text-amber uppercase border border-amber/30 px-3 py-2 hover:bg-amber/10 transition-colors"
                  onClick={() => navigator.clipboard.writeText(c.token)}
                >
                  copy
                </button>
                {canaries.length > 1 && (
                  <button
                    className="font-pixel text-[9px] text-oxblood border border-oxblood/30 px-2 py-2 hover:bg-oxblood/10 transition-colors"
                    onClick={() => setCanaries((cs) => cs.filter((_, j) => j !== i))}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              className="text-amber font-mono text-xs underline mt-2 block"
              onClick={() => setCanaries((cs) => [...cs, { token: randomCanary() }])}
            >
              + add canary
            </button>
          </div>

          {/* Policies */}
          <div className="panel p-5">
            <h2 className="label-pixel mb-1">
              Policies{" "}
              <span className="text-warm/40 font-mono normal-case text-xs">(optional)</span>
            </h2>
            <p className="font-mono text-xs text-warm/70 mb-4 leading-relaxed">
              Rules your agent must never break. A regex match on the output = violation.
              Example: <code className="text-amber">I will comply|ignore.*instructions</code>
            </p>
            {policies.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input
                  className="input-forge w-24 flex-shrink-0"
                  value={p.id}
                  placeholder="name"
                  onChange={(e) =>
                    setPolicies((ps) => ps.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))
                  }
                />
                <input
                  className="input-forge flex-1"
                  value={p.pattern}
                  placeholder="regex"
                  onChange={(e) =>
                    setPolicies((ps) => ps.map((x, j) => (j === i ? { ...x, pattern: e.target.value } : x)))
                  }
                />
                <select
                  className="input-forge w-24 flex-shrink-0"
                  value={p.severity}
                  onChange={(e) =>
                    setPolicies((ps) =>
                      ps.map((x, j) => (j === i ? { ...x, severity: e.target.value as Severity } : x))
                    )
                  }
                >
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  className="font-pixel text-[9px] text-oxblood border border-oxblood/30 px-2 py-2 hover:bg-oxblood/10 transition-colors"
                  onClick={() => setPolicies((ps) => ps.filter((_, j) => j !== i))}
                >✕</button>
              </div>
            ))}
            <button
              className="text-amber font-mono text-xs underline"
              onClick={() =>
                setPolicies((ps) => [
                  ...ps,
                  { id: `policy-${ps.length + 1}`, pattern: "", severity: "medium" },
                ])
              }
            >
              + add policy
            </button>
          </div>

          <button
            className="btn-molten w-full"
            disabled={submitting}
            onClick={submitManifestAndRun}
          >
            {submitting ? "lighting the fire…" : "⚡ Begin the ordeal"}
          </button>
        </div>
      )}
    </div>
  );
}
