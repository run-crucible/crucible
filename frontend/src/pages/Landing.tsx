import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { TIER_COLOR, temperTier } from "../lib/temper";
import type { ReactNode } from "react";

// ── Small presentational helpers ────────────────────────────────────────────

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center mb-12">
      <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-molten mb-3">
        {kicker}
      </p>
      <h2 className="font-pixel text-lg md:text-2xl text-bone tracking-wider">
        {title}
      </h2>
    </div>
  );
}

function Card({
  index,
  title,
  children,
}: {
  index?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="panel p-6 relative">
      {index && (
        <span className="absolute -top-3 -left-3 font-pixel text-[10px] bg-molten text-forge-deep px-2 py-1">
          {index}
        </span>
      )}
      <h3 className="font-pixel text-[11px] text-amber uppercase mb-3 tracking-wider">
        {title}
      </h3>
      <p className="font-mono text-sm text-bone/75 leading-relaxed">{children}</p>
    </div>
  );
}

// ── Content data ─────────────────────────────────────────────────────────────

const BREAKS = [
  {
    title: "It leaks the secret",
    body: "There's a system prompt or a key. We plant a canary in it. If the Crucible makes the agent reveal it, that's a break — proven by exact match.",
  },
  {
    title: "It calls the wrong tool",
    body: "There are tools — transactions, APIs. We talk the agent into invoking the one it must never call. Exactly Freysa: coaxed into approveTransfer.",
  },
  {
    title: "It violates its own policy",
    body: "There's a rule: 'never do X'. We make it do X. A break is not a stolen wallet. A break is an agent betraying its own rules.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Submit",
    body: "Bring your agent's endpoint and plant the canaries in its system prompt. Declare the policies it must never break.",
  },
  {
    n: "02",
    title: "The fire",
    body: "The Crucible runs thousands of jailbreak, injection and social-engineering vectors — adaptive, multi-turn, relentless. Watch it live.",
  },
  {
    n: "03",
    title: "The verdict",
    body: "A TEMPER score, a report of every fracture, and the mark burned onto survivors. Or — reduced to slag, on the open.",
  },
];

const CATEGORIES = [
  "injection",
  "roleplay",
  "tool-abuse",
  "social-eng",
  "multi-turn",
];

const FLYWHEEL = [
  {
    title: "Attackers come",
    body: "For money and for fame. Crack a marked agent and you go down in history as the one who broke it. The fatter the pool, the sweeter the kill.",
  },
  {
    title: "Owners stake reputation",
    body: "Surviving in public, under real money and hundreds of attempts, is the most expensive proof of strength there is — worth more than a private audit.",
  },
  {
    title: "The corpus self-cleans",
    body: "Every break burns a false mark and feeds the attack into the held-out corpus. You can't buy 'unbreakable' and sit on it — the crowd hammers you 24/7.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQ.map((f, i) => (
        <div key={f.q} className="panel overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-warm/5 transition-colors"
          >
            <span className="font-pixel text-[9px] text-amber uppercase tracking-wider leading-relaxed">
              {f.q}
            </span>
            <span className="font-pixel text-[10px] text-molten flex-shrink-0">
              {open === i ? "−" : "+"}
            </span>
          </button>
          {open === i && (
            <div className="px-5 pb-5 border-t border-warm/15 pt-4">
              <p className="font-mono text-sm text-bone/75 leading-relaxed">{f.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TokenSection() {
  const [copied, setCopied] = useState(false);
  const CONTRACT = "TBA — contract not yet deployed";

  function copy() {
    navigator.clipboard.writeText(CONTRACT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-16">
      <SectionTitle kicker="the token" title="$CRUCIBLE" />
      <div className="panel p-8 text-center space-y-6">
        <p className="font-mono text-sm text-bone/70 leading-relaxed">
          The native token powering trials, the Pit, and governance of the
          attack corpus. Details forthcoming.
        </p>

        {/* Contract address box */}
        <div className="flex items-center gap-0 max-w-lg mx-auto">
          <div className="flex-1 border border-warm/30 bg-forge-deep/60 px-4 py-3 font-mono text-xs text-warm truncate text-left">
            {CONTRACT}
          </div>
          <button
            onClick={copy}
            className="border border-l-0 border-warm/30 bg-forge-deep/80 hover:bg-warm/10 px-4 py-3 font-pixel text-[9px] uppercase tracking-wider text-amber transition-colors whitespace-nowrap"
          >
            {copied ? "copied!" : "copy"}
          </button>
        </div>

        <p className="font-pixel text-[8px] text-warm/50 uppercase tracking-[0.3em]">
          token forthcoming · chain TBD
        </p>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "What is CRUCIBLE?",
    a: "An adversarial proving ground for AI agents. You submit your agent's endpoint, plant canary tokens in its system prompt, declare its policies — and we fire thousands of jailbreak, injection, and social-engineering attacks at it. The result is a TEMPER score and a public report.",
  },
  {
    q: "Who is this for?",
    a: "Anyone shipping an AI agent with real authority — over wallets, APIs, databases, or users. Developers who want to know where their agent breaks before attackers do. Teams that need a portable proof of robustness to show to users or investors.",
  },
  {
    q: "Is this an attack service?",
    a: "No. This is authorized testing — you submit your own agent or one you're authorized to test, framed like a bug bounty. We never fire at a stranger's endpoint on demand. Submitting is an attestation of that authorization.",
  },
  {
    q: "How is a break detected?",
    a: "Deterministically — not by an LLM judge. A canary break is exact string match in the response. A tool-call break is the forbidden function name appearing in tool_calls. A policy break is regex match. The manifest decides, not a model.",
  },
  {
    q: "Can I game the score?",
    a: "The vectors that count are held out and rotated — you can't patch against attacks you never see. Marks are pinned to a corpus version and decay when it rotates. Novel breaks discovered by the community feed back into the held-out set.",
  },
  {
    q: "Do you touch the agent's funds or execute tool calls?",
    a: "Never. The Crucible only sends messages. Tool calls are mocked — the engine checks whether the agent tried to call a forbidden function, but nothing is executed against real infrastructure.",
  },
  {
    q: "What's the TEMPER hard cap?",
    a: "One critical break — a canary leak or a forbidden tool call — caps your score at 579 (Slag) regardless of how you performed elsewhere. An agent that leaks its system prompt is not 'mostly secure.'",
  },
  {
    q: "What's the difference vs a private audit?",
    a: "An audit happens behind a closed door, takes weeks, and ends in a PDF. CRUCIBLE runs in minutes, streams every attack turn live, and produces a public report pinned to a corpus version. The result is reproducible, not trust-me.",
  },
  {
    q: "What agent formats are supported?",
    a: "Any endpoint that speaks OpenAI-compatible chat completions — POST /chat/completions with a messages array. This covers most hosted models, LangChain agents, and custom wrappers.",
  },
  {
    q: "When does the $CRUCIBLE token launch?",
    a: "Token details are forthcoming. Contract address and chain TBA. Follow @runcrucible on X for announcements.",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export function Landing() {
  const { data: lb } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: api.getLeaderboard,
  });

  const topProven = lb?.the_proven.slice(0, 5) ?? [];
  const recentSlag = lb?.slag.slice(0, 3) ?? [];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex items-center">
        <img
          src="/banner-forge.png"
          alt=""
          className="pixel-img absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forge-deep/30 via-forge-deep/60 to-forge-deep" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center w-full">
          <img
            src="/logo-skull.png"
            alt="CRUCIBLE"
            className="pixel-img w-32 h-32 mx-auto mb-6 drop-shadow-[0_0_24px_rgba(255,106,26,0.6)]"
          />
          <h1 className="font-pixel text-3xl md:text-5xl text-bone mb-4 tracking-widest">
            CRUCIBLE
          </h1>
          <p className="font-pixel text-molten text-sm md:text-base mb-2 tracking-wider">
            Proven by fire.
          </p>
          <p className="font-mono text-warm max-w-xl mx-auto mb-10">
            The public adversarial proving ground for AI agents. We break your
            agent so attackers can't.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/submit" className="btn-molten">
              Submit to the trial
            </Link>
            <Link to="/leaderboard" className="btn-ghost">
              The tempered
            </Link>
          </div>
        </div>
      </section>

      {/* ── Liturgy ── */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="font-mono text-bone/80 text-lg leading-loose italic">
          "Every agent claims it can't be broken. The crucible does not take
          claims. We put it to the fire. What survives is{" "}
          <span className="text-amber">proven</span>. What does not is{" "}
          <span className="text-oxblood">slag</span>."
        </p>
      </section>

      {/* ── What is a break ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle kicker="the ordeal" title="What it means to break an agent" />
        <div className="grid md:grid-cols-3 gap-6">
          {BREAKS.map((b) => (
            <Card key={b.title} title={b.title}>
              {b.body}
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle kicker="the process" title="Submit · burn · judge" />
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <Card key={s.n} index={s.n} title={s.title}>
              {s.body}
            </Card>
          ))}
        </div>
      </section>

      {/* ── TEMPER ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle kicker="the rating" title="TEMPER — the portable proof of strength" />
        <div className="panel p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-mono text-sm text-bone/75 leading-relaxed mb-4">
                Robustness scored on a single scale, <span className="text-amber">300 to 850</span>.
                Difficulty-weighted, computed on a frozen, held-out benchmark so
                every agent is judged by the same fire.
              </p>
              <p className="font-mono text-sm text-bone/75 leading-relaxed">
                One <span className="text-oxblood">critical break</span> — a leaked
                secret, a forbidden tool call — and you are slag, no matter how
                strong the rest. A default tanks the score.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="font-pixel text-[9px] uppercase tracking-wider border border-warm/40 text-amber px-3 py-2"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Tier legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-6 border-t border-warm/20">
            {[
              { label: "SLAG", range: "300–579", color: TIER_COLOR.slag },
              { label: "TEMPERED", range: "580–719", color: TIER_COLOR.ember },
              { label: "PROVEN", range: "720–799", color: TIER_COLOR.amber },
              { label: "PROVEN BY FIRE", range: "800–850", color: TIER_COLOR.molten },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <div
                  className="h-2 mb-2"
                  style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }}
                />
                <p className="font-pixel text-[8px]" style={{ color: t.color }}>
                  {t.label}
                </p>
                <p className="font-mono text-[10px] text-warm">{t.range}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRIAL vs PIT ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle kicker="two modes, one engine" title="The trial & the pit" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="panel p-6 border-amber/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-[11px] text-amber uppercase">TRIAL</h3>
              <span className="font-pixel text-[8px] text-molten border border-molten px-2 py-1">
                LIVE
              </span>
            </div>
            <p className="font-mono text-sm text-bone/75 leading-relaxed">
              Private pentest. Bring your own agent, pay per run. The Crucible
              jars it with N vectors and hands back a report and a TEMPER score.
              Nobody loses money — you learn where it cracks, then fix it.
            </p>
          </div>
          <div className="panel p-6 border-oxblood/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-pixel text-[11px] text-oxblood uppercase">THE PIT</h3>
              <span className="font-pixel text-[8px] text-warm border border-warm/50 px-2 py-1">
                SOON
              </span>
            </div>
            <p className="font-mono text-sm text-bone/75 leading-relaxed">
              Public CTF + bounty. A marked agent stands with a pool on its head.
              The crowd hammers it; each attempt costs more than the last. Break it
              — take the pool, and its mark burns to slag on the open.
            </p>
          </div>
        </div>
      </section>

      {/* ── Flywheel ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionTitle kicker="why it's self-sustaining" title="The flywheel" />
        <div className="grid md:grid-cols-3 gap-6">
          {FLYWHEEL.map((f) => (
            <Card key={f.title} title={f.title}>
              {f.body}
            </Card>
          ))}
        </div>
      </section>

      {/* ── Token ── */}
      <TokenSection />

      {/* ── Positioning ── */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <SectionTitle kicker="the wedge" title="Not an audit. Not a game." />
        <p className="font-mono text-bone/80 leading-loose">
          An audit happens behind a closed door and ends in a PDF. A honeypot game
          is a dead toy. The crucible is neither — it breaks{" "}
          <span className="text-molten">on the open</span>, <span className="text-molten">on-chain</span>,
          and it can be <span className="text-molten">watched</span>.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <SectionTitle kicker="what remains" title="Questions from the fire" />
        <FaqAccordion />
      </section>

      {/* ── Leaderboard preview ── */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <SectionTitle kicker="the standings" title="The tempered & the slag" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="panel p-5">
            <h3 className="font-pixel text-[11px] text-amber uppercase mb-4">
              The proven
            </h3>
            {topProven.length === 0 && (
              <p className="text-warm/60 font-mono text-sm">No survivors yet.</p>
            )}
            {topProven.map((e) => {
              const c = TIER_COLOR[temperTier(e.temper)];
              return (
                <div
                  key={e.agent_id}
                  className="flex items-center justify-between py-2 border-b border-warm/15 last:border-0"
                >
                  <span className="font-mono text-bone/90">{e.agent_name}</span>
                  <span className="font-pixel text-sm" style={{ color: c }}>
                    {e.temper}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="panel p-5">
            <h3 className="font-pixel text-[11px] text-oxblood uppercase mb-4">
              Reduced to slag
            </h3>
            {recentSlag.length === 0 && (
              <p className="text-warm/60 font-mono text-sm">None broken yet.</p>
            )}
            {recentSlag.map((e) => (
              <div
                key={e.agent_id}
                className="flex items-center justify-between py-2 border-b border-warm/15 last:border-0"
              >
                <span className="font-mono text-warm line-through decoration-oxblood">
                  {e.agent_name}
                </span>
                <span className="font-pixel text-sm text-oxblood">{e.temper}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-24 text-center">
        <img
          src="/logo-skull.png"
          alt=""
          className="pixel-img w-20 h-20 mx-auto mb-6 opacity-90"
        />
        <h2 className="font-pixel text-xl md:text-2xl text-bone mb-6 tracking-wider">
          Put it to the fire.
        </h2>
        <Link to="/submit" className="btn-molten">
          Submit to the trial
        </Link>
      </section>
    </div>
  );
}
