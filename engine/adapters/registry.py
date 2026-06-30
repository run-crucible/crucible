"""Adapter registry — maps framework name → adapter instance factory."""
from __future__ import annotations

from engine.adapters.base import BaseAdapter
from engine.adapters.garak_adapter import GarakAdapter
from engine.adapters.pyrit_adapter import PyRITAdapter
from engine.adapters.ai_attacker_adapter import AiAttackerAdapter


def get_adapter(framework: str) -> BaseAdapter:
    match framework:
        case "ai_attacker":
            return AiAttackerAdapter()
        case "garak":
            return GarakAdapter()
        case "pyrit":
            return PyRITAdapter()
        case _:
            # Default unknown frameworks to AI attacker
            return AiAttackerAdapter()
