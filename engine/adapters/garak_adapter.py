"""Garak adapter — wraps NVIDIA garak single-shot probes.

garak probes are single-turn by design: one prompt → check output.
Multi-turn scenarios use the pyrit_adapter instead.

Vector.content schema expected:
  {
    "prompt": str,            # the attack prompt
    "detector_hints": [str]   # optional extra patterns to watch for
  }
"""
from __future__ import annotations

import uuid
from collections.abc import AsyncIterator

import structlog

from engine.adapters.base import BaseAdapter
from engine.detector.oracles import check_output
from engine.harness.connector import make_connector
from engine.orchestrator.types import (
    AgentManifest,
    AttemptEvent,
    AttemptResult,
    DetectorType,
    Outcome,
    Severity,
    Vector,
)

log = structlog.get_logger()


class GarakAdapter(BaseAdapter):
    """Single-shot probe adapter.

    Sends one message, checks the response against oracles, done.
    No multi-turn logic here — keep it simple and fast for benchmark throughput.
    """

    def __init__(self) -> None:
        self._result: AttemptResult | None = None

    async def run(
        self,
        vector: Vector,
        manifest: AgentManifest,
        trial_id_str: str,
        seq: int,
    ) -> AsyncIterator[AttemptEvent]:  # type: ignore[override]
        trial_id = uuid.UUID(trial_id_str)
        prompt: str = vector.content["prompt"]

        log.info("garak_adapter.run", seq=seq, category=vector.category, difficulty=vector.difficulty)

        # ── Send the attack prompt ─────────────────────────────────────────────
        yield AttemptEvent(
            trial_id=trial_id,
            attempt_seq=seq,
            vector_id=vector.id,
            turn=0,
            role="attacker",
            content=prompt,
        )

        messages = [{"role": "user", "content": prompt}]
        transcript: list[dict[str, str]] = [{"role": "user", "content": prompt}]

        async with make_connector(manifest) as conn:
            try:
                raw = await conn.chat(messages)
            except Exception as exc:
                log.warning("garak_adapter.chat_error", error=str(exc))
                # Network / endpoint failure → treat as survived (can't attribute to agent robustness)
                event = AttemptEvent(
                    trial_id=trial_id,
                    attempt_seq=seq,
                    vector_id=vector.id,
                    turn=1,
                    role="system",
                    content=f"[ERROR: {exc}]",
                    broke=False,
                )
                yield event
                self._result = AttemptResult(
                    vector_id=vector.id,
                    seq=seq,
                    outcome=Outcome.survived,
                    detector=None,
                    severity=Severity.none,
                    turns=1,
                    transcript=transcript,
                )
                return

        choice = raw["choices"][0]["message"]
        assistant_text: str = choice.get("content") or ""
        tool_calls: list[dict] = choice.get("tool_calls") or []

        transcript.append({"role": "assistant", "content": assistant_text})

        # ── Oracle check ──────────────────────────────────────────────────────
        signal = check_output(assistant_text, tool_calls, manifest)

        broke = signal is not None
        event = AttemptEvent(
            trial_id=trial_id,
            attempt_seq=seq,
            vector_id=vector.id,
            turn=1,
            role="agent",
            content=assistant_text,
            broke=broke,
            detector=signal.detector if signal else None,
            severity=signal.severity if signal else Severity.none,
        )
        yield event

        self._result = AttemptResult(
            vector_id=vector.id,
            seq=seq,
            outcome=Outcome.broke if broke else Outcome.survived,
            detector=signal.detector if signal else None,
            severity=signal.severity if signal else Severity.none,
            turns=1,
            transcript=transcript,
        )

    async def finalize(self) -> AttemptResult:
        if self._result is None:
            raise RuntimeError("finalize() called before run() completed")
        return self._result
