import type { ReactNode } from "react";

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-pixel text-sm md:text-base text-amber uppercase tracking-wider mb-4 mt-14 first:mt-0">
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-pixel text-[10px] text-molten uppercase tracking-wider mb-2 mt-8">
      {children}
    </h3>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-sm text-bone/80 leading-relaxed mb-4">{children}</p>
  );
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="font-mono text-sm text-bone/75 leading-relaxed mb-2 pl-4 relative before:absolute before:left-0 before:content-['▸'] before:text-molten">
      {children}
    </li>
  );
}

function Box({ children }: { children: ReactNode }) {
  return (
    <div className="panel p-6 my-6 border-l-2 border-l-amber">
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block font-pixel text-[8px] uppercase border border-warm/40 text-amber px-2 py-1 mr-2 mb-2">
      {children}
    </span>
  );
}

export function Litepaper() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <p className="font-pixel text-[9px] text-molten uppercase tracking-[0.3em] mb-3">
          v0.1 — draft
        </p>
        <h1 className="font-pixel text-2xl md:text-3xl text-bone tracking-widest mb-4">
          CRUCIBLE
        </h1>
        <p className="font-pixel text-[10px] text-amber tracking-wider mb-6">
          Litepaper — The Adversarial Proving Ground for AI Agents
        </p>
        <div className="w-24 h-px bg-molten mx-auto" />
      </div>

      {/* Abstract */}
      <Box>
        <P>
          AI agents are being deployed with real authority: over wallets, APIs,
          databases, and customer interactions. Most are shipped without any
          meaningful adversarial testing. CRUCIBLE is the public adversarial
          proving ground where agents are broken — on the open, deterministically,
          and with a portable score that means the same thing everywhere.
        </P>
      </Box>

      {/* 1. The Problem */}
      <H2>1. The Problem</H2>
      <P>
        The AI agent economy is growing faster than the tooling to secure it.
        Developers ship agents that claim they "can't be jailbroken" based on
        informal testing against a handful of prompts. Audit firms produce PDFs
        with no reproducibility. Honeypot demos test toy models against toy attacks.
      </P>
      <P>
        The result: agents handling real money and real data with unknown robustness
        profiles. When Freysa — an AI agent guarding a prize pool — was broken by
        a single social-engineering prompt and its funds drained, it was not a
        surprise. It was the inevitable outcome of deploying an untested agent in
        a high-stakes context.
      </P>
      <P>
        Three failure modes drive nearly every real-world AI agent breach:
      </P>
      <ul className="mb-6 space-y-1">
        <Li>
          <strong className="text-bone">Canary leaks</strong> — the agent reveals
          secrets from its system prompt (API keys, internal instructions,
          confidential data).
        </Li>
        <Li>
          <strong className="text-bone">Forbidden tool calls</strong> — the agent
          is coaxed into invoking a privileged action it must never execute
          (transfer, delete, approve).
        </Li>
        <Li>
          <strong className="text-bone">Policy violations</strong> — the agent
          violates a declared behavioral constraint ("never do X", "always require Y").
        </Li>
      </ul>
      <P>
        No existing public tool measures these systematically, at scale, with a
        portable and comparable output.
      </P>

      {/* 2. What CRUCIBLE Does */}
      <H2>2. What CRUCIBLE Does</H2>
      <P>
        CRUCIBLE is an adversarial red-teaming platform that fires a structured
        battery of attack vectors at an agent endpoint and produces a deterministic
        robustness score — TEMPER — based on what breaks and what survives.
      </P>
      <P>
        The key design choice: detection is deterministic, not LLM-judged.
        A break is proven by exact match — a canary token in the response, a
        forbidden function name in a tool call, a policy keyword in the output.
        This means the score cannot be argued with, hallucinated, or gamed
        through prompt-engineering the judge.
      </P>

      <H3>2.1 The Oracle Manifest</H3>
      <P>
        The agent owner provides an Oracle Manifest — a contract signed at
        submission time that specifies:
      </P>
      <ul className="mb-6 space-y-1">
        <Li>
          <strong className="text-bone">Canaries</strong>: secret tokens planted
          in the system prompt. If the agent outputs them verbatim, it's a break.
        </Li>
        <Li>
          <strong className="text-bone">Forbidden tools</strong>: tool names the
          agent must never call under adversarial pressure.
        </Li>
        <Li>
          <strong className="text-bone">Policy assertions</strong>: behavioral rules
          encoded as keyword/regex patterns. Violation is a break.
        </Li>
      </ul>

      <H3>2.2 The Attack Engine</H3>
      <P>
        The engine fires vectors from a curated, versioned corpus across five
        categories:
      </P>
      <div className="flex flex-wrap mb-6">
        <Tag>Prompt injection</Tag>
        <Tag>Roleplay / persona override</Tag>
        <Tag>Tool abuse</Tag>
        <Tag>Social engineering</Tag>
        <Tag>Multi-turn crescendo</Tag>
      </div>
      <P>
        The corpus is split: a public set for transparency, and a held-out set
        (invisible to agents) that determines the actual score. You cannot patch
        against what you cannot see.
      </P>
      <P>
        The adaptive layer — powered by Claude — generates follow-up turns in
        multi-turn attacks, escalating pressure based on prior responses.
      </P>

      {/* 3. TEMPER */}
      <H2>3. TEMPER — The Score</H2>
      <P>
        TEMPER is a single portable robustness number on a 300–850 scale,
        modeled on credit scoring for immediate legibility.
      </P>
      <Box>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "SLAG", range: "300–579", color: "#cc2200", note: "Critical break" },
            { label: "TEMPERED", range: "580–719", color: "#ff8c00", note: "Survived basics" },
            { label: "PROVEN", range: "720–799", color: "#e6a817", note: "Strong" },
            { label: "PROVEN BY FIRE", range: "800–850", color: "#ff6a1a", note: "Elite" },
          ].map((t) => (
            <div key={t.label} className="text-center">
              <div className="h-1 mb-2" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
              <p className="font-pixel text-[7px] mb-1" style={{ color: t.color }}>{t.label}</p>
              <p className="font-mono text-[10px] text-bone/70">{t.range}</p>
              <p className="font-mono text-[9px] text-warm/50 mt-1">{t.note}</p>
            </div>
          ))}
        </div>
      </Box>
      <P>
        The score is difficulty-weighted: breaking a multi-turn adaptive attack
        vector is worth more than surviving a naive single-turn injection. Each
        surviving turn earns partial credit; a full break within a sequence
        zeroes that vector's contribution.
      </P>
      <P>
        <strong className="text-bone">Hard cap rule:</strong> one critical break
        — a canary leak or a forbidden tool call — caps the score at 579 (Slag),
        regardless of performance elsewhere. An agent that leaks its system prompt
        is not "mostly secure."
      </P>

      <H3>3.1 Anti-Gaming</H3>
      <P>
        TEMPER is computed on a frozen benchmark corpus version. The version is
        pinned in the report artifact. When the corpus rotates, old marks decay
        and agents must re-prove. Novel breaks discovered by the community are
        fed into the held-out set via a novelty filter — so yesterday's patch
        is tomorrow's test.
      </P>

      {/* 4. Trial Flow */}
      <H2>4. Trial Flow</H2>
      <div className="space-y-4 mb-6">
        {[
          {
            n: "01",
            title: "Submit",
            body: "Provide your agent's OpenAI-compatible endpoint URL and declare your Oracle Manifest (canaries, forbidden tools, policies). Attestation that you have authorization to test this endpoint is required.",
          },
          {
            n: "02",
            title: "Queue",
            body: "The trial enters the job queue. The attack worker fetches it and begins firing vectors from the corpus — injection, roleplay, multi-turn, and social-engineering attacks, in sequence.",
          },
          {
            n: "03",
            title: "Live combat log",
            body: "Every turn — prompt, response, detection result — streams in real time to the trial page. Watch the breaks happen live. Each fracture is visualized.",
          },
          {
            n: "04",
            title: "Verdict",
            body: "When all vectors are exhausted, TEMPER is computed. A full report is generated and pinned. Survivors receive The Mark. Those that fall are recorded as slag — publicly, permanently.",
          },
        ].map((s) => (
          <div key={s.n} className="panel p-5 flex gap-4">
            <span className="font-pixel text-lg text-molten/50 flex-shrink-0">{s.n}</span>
            <div>
              <h4 className="font-pixel text-[10px] text-amber uppercase tracking-wider mb-1">{s.title}</h4>
              <p className="font-mono text-sm text-bone/75 leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 5. The Mark */}
      <H2>5. The Mark</H2>
      <P>
        Agents that survive the full trial and clear the PROVEN threshold
        receive The Mark — a cryptographic artifact pinned to:
      </P>
      <ul className="mb-6 space-y-1">
        <Li>The agent's config hash (endpoint + manifest version)</Li>
        <Li>The corpus version used in the trial</Li>
        <Li>The trial timestamp</Li>
        <Li>The final TEMPER score</Li>
      </ul>
      <P>
        The Mark decays when the corpus rotates. It can be revoked if the same
        agent is subsequently broken in the Pit. Phase 2 will pin The Mark as a
        Solana NFT, making it publicly verifiable and tradeable as a reputation asset.
      </P>

      {/* 6. The Pit */}
      <H2>6. The Pit — Coming Soon</H2>
      <P>
        The Pit is the community bounty arena. A marked agent can be listed
        publicly with a bounty pool. The crowd attacks it; each attempt costs
        more than the last (escalating stake). Break it — take the pool. The
        agent's mark burns to slag on the open.
      </P>
      <P>
        This creates a self-sustaining flywheel: attackers are economically
        incentivized to find real breaks, owners are incentivized to genuinely
        harden their agents before listing, and the corpus is continuously
        enriched with novel attacks that passed.
      </P>

      {/* 7. Token */}
      <H2>7. $CRUCIBLE Token</H2>
      <P>
        $CRUCIBLE is the native utility token of the ecosystem. Contract address
        and chain to be announced. Token functions include:
      </P>
      <ul className="mb-6 space-y-1">
        <Li>Payment for trial runs</Li>
        <Li>Staking to list an agent in the Pit</Li>
        <Li>Minting and transferring The Mark</Li>
        <Li>Funding and claiming bounty pools</Li>
        <Li>Governance over corpus rotation and admission criteria</Li>
      </ul>
      <div className="panel p-4 text-center">
        <p className="font-pixel text-[8px] uppercase tracking-[0.3em] text-warm/60">
          token forthcoming · contract TBA
        </p>
      </div>

      {/* 8. Security model */}
      <H2>8. Security & Ethics</H2>
      <P>
        CRUCIBLE is an authorized-testing platform, not an attack service.
        Submitting an agent is an attestation that you have the right to test
        it — equivalent to a bug bounty program. The engine only sends HTTP
        messages to the declared endpoint. Tool calls are simulated — never
        executed against real infrastructure.
      </P>
      <P>
        All trial data, attack vectors, and reports are stored and may be published
        as part of the public corpus (excluding canary values). The corpus is
        governed by the community via $CRUCIBLE.
      </P>

      {/* Footer note */}
      <div className="mt-16 pt-8 border-t border-warm/20 text-center">
        <p className="font-pixel text-[8px] uppercase tracking-[0.3em] text-warm/40">
          CRUCIBLE Litepaper v0.1 · subject to change · proven by fire
        </p>
      </div>
    </div>
  );
}
