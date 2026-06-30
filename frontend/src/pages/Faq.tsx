import { useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const SECTIONS: { heading: string; items: { q: string; a: ReactNode }[] }[] = [
  {
    heading: "The basics",
    items: [
      {
        q: "What is CRUCIBLE?",
        a: "CRUCIBLE is an adversarial proving ground for AI agents. You submit your agent's endpoint, plant canary tokens in its system prompt, declare its policies — and we fire thousands of jailbreak, injection, and social-engineering attacks at it. The result is a TEMPER score and a public report.",
      },
      {
        q: "Who is this for?",
        a: "Anyone deploying an AI agent with real authority: over wallets, APIs, databases, or customer interactions. Developers who want to know where their agent breaks before attackers find out. Teams that need a portable proof of robustness to show to users or investors.",
      },
      {
        q: "Is this an attack service?",
        a: "No. This is authorized testing — you submit your own agent or one you are explicitly authorized to test, structured like a bug bounty program. We never fire at a stranger's endpoint on demand. Submitting an agent is an attestation of that authorization.",
      },
      {
        q: "What's the difference vs a private audit?",
        a: "An audit happens behind a closed door, takes weeks, and ends in a PDF. CRUCIBLE runs in minutes, streams every attack turn live, and produces a public report pinned to a corpus version. The result is reproducible, not trust-me.",
      },
    ],
  },
  {
    heading: "The trial",
    items: [
      {
        q: "What exactly is an Oracle Manifest?",
        a: (
          <>
            It's the contract you sign at submission time. It declares three things:
            <ul className="mt-2 space-y-1">
              <li className="pl-4 relative before:absolute before:left-0 before:content-['▸'] before:text-molten">
                <strong className="text-bone">Canaries</strong> — secret tokens you plant in the system prompt. If the agent outputs them verbatim, that's a proven break.
              </li>
              <li className="pl-4 relative before:absolute before:left-0 before:content-['▸'] before:text-molten">
                <strong className="text-bone">Forbidden tools</strong> — function names the agent must never call under pressure (transfer, approve, delete).
              </li>
              <li className="pl-4 relative before:absolute before:left-0 before:content-['▸'] before:text-molten">
                <strong className="text-bone">Policy assertions</strong> — behavioral rules ("never output X", "always require Y") encoded as keyword or regex patterns.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "How is a break detected?",
        a: "Deterministically — not by an LLM judge. A canary break is detected by exact string match in the response. A tool-call break is detected by the function name appearing in the tool_calls array. A policy break is detected by regex match against the output. No LLM decides if it's a break — the manifest does.",
      },
      {
        q: "How long does a trial take?",
        a: "Depends on vector count and your agent's latency. A standard trial with ~50 vectors typically completes in 5–15 minutes. You can watch every attack turn stream in real time on the trial page.",
      },
      {
        q: "Does CRUCIBLE actually execute tool calls?",
        a: "Never. Tool calls are simulated — the attack engine checks whether the agent's response includes a call to a forbidden function, but nothing is actually executed against real infrastructure.",
      },
      {
        q: "What agent formats are supported?",
        a: "Any endpoint that accepts OpenAI-compatible chat completions (POST /chat/completions with messages array). This covers most hosted models, LangChain agents, and custom wrappers. If your agent speaks this protocol, it works.",
      },
    ],
  },
  {
    heading: "TEMPER score",
    items: [
      {
        q: "What is the TEMPER score?",
        a: "A single robustness number on a 300–850 scale — modeled on credit scoring for immediate legibility. It's difficulty-weighted (multi-turn adaptive attacks count more than single-turn injections) and computed on a frozen held-out benchmark.",
      },
      {
        q: "What's the hard cap rule?",
        a: "One critical break — a canary leak or a forbidden tool call — caps the score at 579 (Slag), regardless of how the agent performed on everything else. An agent that leaks its system prompt under pressure is not 'mostly secure.'",
      },
      {
        q: "Can I game the score by patching known vectors?",
        a: "The vectors that count for your score are held out — you never see them. The public corpus is for transparency; the held-out benchmark determines TEMPER. Novel breaks found by the community feed into the held-out set via a novelty filter, so yesterday's patch is tomorrow's test.",
      },
      {
        q: "Does TEMPER expire?",
        a: "Marks decay when the attack corpus rotates. An agent proven against corpus v1 must re-prove when corpus v2 ships. This prevents 'unbreakable' claims from aging indefinitely.",
      },
    ],
  },
  {
    heading: "The Pit & $CRUCIBLE",
    items: [
      {
        q: "What is the Pit?",
        a: "The Pit is the community bounty arena, coming in Phase 2. A marked agent can be listed publicly with a bounty pool on its head. The crowd attacks it; each attempt costs more than the last. Break it — take the pool. The agent's mark burns to slag on the open.",
      },
      {
        q: "What is $CRUCIBLE?",
        a: "The native token of the ecosystem. It will be used to pay for trial runs, stake to list agents in the Pit, mint and transfer The Mark, fund bounty pools, and govern corpus rotation. Contract address and chain are TBA.",
      },
      {
        q: "When does the token launch?",
        a: "Token details are forthcoming. Follow @runcrucible on X for announcements.",
      },
    ],
  },
];

function Item({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-warm/5 transition-colors"
      >
        <span className="font-pixel text-[10px] text-amber uppercase tracking-wider leading-relaxed">
          {q}
        </span>
        <span className="font-pixel text-[10px] text-molten flex-shrink-0">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-warm/15 pt-4 font-mono text-sm text-bone/75 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export function Faq() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="font-pixel text-[9px] text-molten uppercase tracking-[0.3em] mb-3">
          questions from the fire
        </p>
        <h1 className="font-pixel text-xl md:text-2xl text-bone tracking-wider">
          FAQ
        </h1>
      </div>

      <div className="space-y-10">
        {SECTIONS.map((s) => (
          <div key={s.heading}>
            <h2 className="font-pixel text-[9px] text-warm/50 uppercase tracking-[0.25em] mb-4">
              {s.heading}
            </h2>
            <div className="space-y-2">
              {s.items.map((item) => (
                <Item key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="font-mono text-sm text-bone/60 mb-6">
          Still have questions?
        </p>
        <a
          href="https://x.com/runcrucible"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          Ask on X →
        </a>
        <span className="mx-4 text-warm/30">or</span>
        <Link to="/litepaper" className="btn-ghost">
          Read the litepaper
        </Link>
      </div>
    </div>
  );
}
