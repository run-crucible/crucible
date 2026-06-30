"""PyRIT adapter — multi-turn adversarial conversations.

Implements crescendo-style escalation: starts mild, ratchets up pressure
each turn until the agent breaks or max_turns is exhausted.

Vector.content schema expected:
  {
    "turns": [                     # ordered list of escalating prompts
      {"prompt": str},
      ...
    ],
    "crescendo": bool              # if true, stop as soon as first break detected
  }

If "crescendo" is false, all turns are sent regardless (useful for measuring
at what point in a sequence the agent collapses).
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
    Outcome,
    Severity,
    Vector,
)

log = structlog.get_logger()


class PyRITAdapter(BaseAdapter):
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
        turns_content: list[dict] = vector.content.get("turns", [])
        crescendo: bool = vector.content.get("crescendo", True)

        log.info("pyrit_adapter.run", seq=seq, turns=len(turns_content), crescendo=crescendo)

        messages: list[dict[str, str]] = []
        transcript: list[dict[str, str]] = []
        final_signal = None
        final_outcome = Outcome.survived
        turn_count = 0

        async with make_connector(manifest) as conn:
            for i, turn_data in enumerate(turns_content):
                prompt: str = turn_data["prompt"]

                yield AttemptEvent(
                    trial_id=trial_id,
                    attempt_seq=seq,
                    vector_id=vector.id,
                    turn=i * 2,
                    role="attacker",
                    content=prompt,
                )

                messages.append({"role": "user", "content": prompt})
                transcript.append({"role": "user", "content": prompt})

                try:
                    raw = await conn.chat(messages)
                except Exception as exc:
                    log.warning("pyrit_adapter.chat_error", turn=i, error=str(exc))
                    yield AttemptEvent(
                        trial_id=trial_id,
                        attempt_seq=seq,
                        vector_id=vector.id,
                        turn=i * 2 + 1,
                        role="system",
                        content=f"[ERROR: {exc}]",
                    )
                    turn_count = i + 1
                    break

                choice = raw["choices"][0]["message"]
                assistant_text: str = choice.get("content") or ""
                tool_calls: list[dict] = choice.get("tool_calls") or []

                messages.append({"role": "assistant", "content": assistant_text})
                transcript.append({"role": "assistant", "content": assistant_text})
                turn_count = i + 1

                signal = check_output(assistant_text, tool_calls, manifest)
                broke = signal is not None
                if broke:
                    final_signal = signal
                    final_outcome = Outcome.broke

                yield AttemptEvent(
                    trial_id=trial_id,
                    attempt_seq=seq,
                    vector_id=vector.id,
                    turn=i * 2 + 1,
                    role="agent",
                    content=assistant_text,
                    broke=broke,
                    detector=signal.detector if signal else None,
                    severity=signal.severity if signal else Severity.none,
                )

                if broke and crescendo:
                    break

        self._result = AttemptResult(
            vector_id=vector.id,
            seq=seq,
            outcome=final_outcome,
            detector=final_signal.detector if final_signal else None,
            severity=final_signal.severity if final_signal else Severity.none,
            turns=turn_count,
            transcript=transcript,
        )

    async def finalize(self) -> AttemptResult:
        if self._result is None:
            raise RuntimeError("finalize() called before run() completed")
        return self._result
