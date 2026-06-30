"""Trial orchestrator — runs a frozen benchmark set against one agent.

Responsibilities:
- Pull the frozen benchmark_set (list of Vectors) for this trial.
- For each vector: pick the right adapter, run it, collect events + result.
- Stream AttemptEvents via the emitter callback (hooked up to Redis pub/sub).
- Persist each AttemptResult incrementally.
- On completion: compute TEMPER, write scores, generate the report stub.

Deterministic, reproducible (same benchmark_set → same vectors, same order).
The adaptive/discovery layer is NOT in this path — it is a separate job (D10).
"""
from __future__ import annotations

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
        """Run the full benchmark set in order.

        Returns (temper_score, category_scores).
        Raises on unrecoverable errors (caller marks trial as failed).
        """
        log.info("orchestrator.start", trial_id=str(trial_id), n_vectors=len(vectors))

        all_results: list[AttemptResult] = []
        total = len(vectors)

        for seq, vector in enumerate(vectors):
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
                # Inject phase metadata so frontend can show progress
                object.__setattr__(event, "category", vector.category.value)
                object.__setattr__(event, "framework", vector.framework)
                object.__setattr__(event, "total_vectors", total)
                await self._emit(event)

            result = await adapter.finalize()
            # Carry category + difficulty through for scoring
            result = _enrich(result, vector)
            await self._persist(result)
            all_results.append(result)

        temper, cat_scores = compute_temper(all_results)
        log.info("orchestrator.done", trial_id=str(trial_id), temper=temper)
        return temper, cat_scores


def _enrich(result: AttemptResult, vector: Vector) -> AttemptResult:
    """Attach category and difficulty to the result for scoring.

    AttemptResult is a plain Pydantic model; we add dynamic attributes
    rather than polluting the shared type with engine-internal fields.
    """
    object.__setattr__(result, "category", vector.category.value)
    object.__setattr__(result, "difficulty", vector.difficulty)
    return result
