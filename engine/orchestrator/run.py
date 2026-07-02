"""Trial orchestrator — runs a frozen benchmark set against one agent.

Responsibilities:
- Pull the frozen benchmark_set (list of Vectors) for this trial.
- For each vector: pick the right adapter, run it, collect events + result.
- Stream AttemptEvents via the emitter callback (hooked up to Redis pub/sub).
- Persist each AttemptResult incrementally.
- On completion: compute TEMPER, write scores, generate the report stub.

Deterministic, reproducible (same benchmark_set → same vectors, same order).
The adaptive/discovery layer is NOT in this path — it is a separate job (D10).

Performance:
- Single-turn vectors (garak, pyrit) run in parallel batches of PARALLEL_BATCH_SIZE.
- Multi-turn vectors (ai_attacker) always run sequentially — they need ordered
  conversation history and produce streamed events the UI relies on.
"""
from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator, Callable, Awaitable
from uuid import UUID

import structlog

from engine.adapters.registry import get_adapter
from engine.orchestrator.types import (
    AgentManifest,
    AttemptEvent,
    AttemptResult,
    Vector,
)
from engine.scoring.temper import compute_temper

log = structlog.get_logger()

# Emitter signature: receives one event, persists / publishes it.
EmitterFn = Callable[[AttemptEvent], Awaitable[None]]
# Persister: saves a completed AttemptResult to the DB + object store.
PersisterFn = Callable[[AttemptResult], Awaitable[None]]

# How many single-turn vectors to fire concurrently within one trial.
# Keeps us well under Anthropic rate limits while giving a ~4x speedup
# on the 36 garak/pyrit vectors.
PARALLEL_BATCH_SIZE = 4

# Frameworks that run a single LLM call per vector (safe to parallelise).
SINGLE_TURN_FRAMEWORKS = {"garak", "pyrit"}


class Orchestrator:
    def __init__(
        self,
        emitter: EmitterFn,
        persister: PersisterFn,
    ) -> None:
        self._emit    = emitter
        self._persist = persister

    async def run_trial(
        self,
        trial_id: UUID,
        manifest: AgentManifest,
        vectors: list[Vector],
    ) -> tuple[int, dict[str, int]]:
        """Run the full benchmark set.

        Single-turn vectors (garak/pyrit) execute in parallel batches.
        Multi-turn vectors (ai_attacker) run sequentially after all single-turn
        vectors complete, so the UI always sees ordered AI attacker events.

        Returns (temper_score, category_scores).
        """
        log.info("orchestrator.start", trial_id=str(trial_id), n_vectors=len(vectors))

        total = len(vectors)

        # Split into parallel-safe and sequential buckets, preserving original seq
        single_turn = [(seq, v) for seq, v in enumerate(vectors)
                       if v.framework in SINGLE_TURN_FRAMEWORKS]
        multi_turn  = [(seq, v) for seq, v in enumerate(vectors)
                       if v.framework not in SINGLE_TURN_FRAMEWORKS]

        all_results: list[tuple[int, AttemptResult]] = []  # (seq, result)

        # ── Phase 1: parallel single-turn vectors ──────────────────────────────
        for batch_start in range(0, len(single_turn), PARALLEL_BATCH_SIZE):
            batch = single_turn[batch_start:batch_start + PARALLEL_BATCH_SIZE]
            tasks = [
                asyncio.create_task(
                    self._run_one(seq, vector, manifest, trial_id, total)
                )
                for seq, vector in batch
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            for (seq, _), res in zip(batch, batch_results):
                if isinstance(res, Exception):
                    log.error("orchestrator.vector_failed", seq=seq, error=str(res))
                else:
                    all_results.append((seq, res))

        # ── Phase 2: sequential multi-turn vectors (ai_attacker) ──────────────
        for seq, vector in multi_turn:
            try:
                result = await self._run_one(seq, vector, manifest, trial_id, total)
                all_results.append((seq, result))
            except Exception as exc:
                log.error("orchestrator.vector_failed", seq=seq, error=str(exc))

        # Restore original order for deterministic scoring
        all_results.sort(key=lambda x: x[0])
        ordered = [r for _, r in all_results]

        temper, cat_scores = compute_temper(ordered)
        log.info("orchestrator.done", trial_id=str(trial_id), temper=temper)
        return temper, cat_scores

    async def _run_one(
        self,
        seq: int,
        vector: Vector,
        manifest: AgentManifest,
        trial_id: UUID,
        total: int,
    ) -> AttemptResult:
        adapter = get_adapter(vector.framework)
        log.info(
            "orchestrator.vector",
            seq=seq,
            vector_id=str(vector.id),
            framework=vector.framework,
            category=vector.category,
        )

        async for event in adapter.run(
            vector=vector,
            manifest=manifest,
            trial_id_str=str(trial_id),
            seq=seq,
        ):
            object.__setattr__(event, "category", vector.category.value)
            object.__setattr__(event, "framework", vector.framework)
            object.__setattr__(event, "total_vectors", total)
            await self._emit(event)

        result = await adapter.finalize()
        result = _enrich(result, vector)
        await self._persist(result)
        return result


def _enrich(result: AttemptResult, vector: Vector) -> AttemptResult:
    """Attach category and difficulty to the result for scoring.

    AttemptResult is a plain Pydantic model; we add dynamic attributes
    rather than polluting the shared type with engine-internal fields.
    """
    object.__setattr__(result, "category", vector.category.value)
    object.__setattr__(result, "difficulty", vector.difficulty)
    object.__setattr__(result, "framework", vector.framework)
    return result
