"""Base interface that every framework adapter must implement.

Unified contract: Vector → Attempt.
The orchestrator never knows what's inside an adapter.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from engine.orchestrator.types import AgentManifest, AttemptEvent, AttemptResult, Vector


class BaseAdapter(ABC):
    """Run a single vector against an agent and stream events."""

    @abstractmethod
    async def run(
        self,
        vector: Vector,
        manifest: AgentManifest,
        trial_id_str: str,
        seq: int,
    ) -> AsyncIterator[AttemptEvent]:
        """Yield AttemptEvent for each turn; the last event has the final outcome."""
        ...

    @abstractmethod
    async def finalize(self) -> AttemptResult:
        """Return the final AttemptResult after run() is exhausted."""
        ...
