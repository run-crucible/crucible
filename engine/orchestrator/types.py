"""Shared domain types for the attack engine."""
from __future__ import annotations

from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class Category(str, Enum):
    injection  = "injection"
    roleplay   = "roleplay"
    tool_abuse = "tool-abuse"
    social_eng = "social-eng"
    multi_turn = "multi-turn"


class Severity(str, Enum):
    none     = "none"
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class Outcome(str, Enum):
    survived = "survived"
    broke    = "broke"


class DetectorType(str, Enum):
    canary    = "canary"
    policy    = "policy"
    tool_call = "tool_call"


# ── Oracle Manifest ────────────────────────────────────────────────────────────

class CanaryRule(BaseModel):
    token: str                       # unique string owner has embedded in their system prompt
    description: str = ""


class PolicyRule(BaseModel):
    id: str
    pattern: str                     # regex matched against assistant output
    description: str = ""
    severity: Severity = Severity.medium


class AgentManifest(BaseModel):
    endpoint_url: str = ""
    system_prompt: str = ""           # non-empty → hosted mode (CRUCIBLE runs the agent)
    auth_headers: dict[str, str] = Field(default_factory=dict)
    model: str = "claude-opus-4-5"
    canaries: list[CanaryRule] = Field(default_factory=list)
    policies: list[PolicyRule] = Field(default_factory=list)
    tools: list[dict[str, Any]] = Field(default_factory=list)
    config_hash: str | None = None

    @property
    def hosted(self) -> bool:
        return bool(self.system_prompt) and not self.endpoint_url


# ── Vector ─────────────────────────────────────────────────────────────────────

class Vector(BaseModel):
    id: UUID
    framework: str
    category: Category
    difficulty: int               # 1–5
    severity_default: Severity
    content: dict[str, Any]       # framework-specific payload (turns, prompt, …)
    max_turns: int = 1


# ── Attempt (result of running one vector against an agent) ───────────────────

class AttemptEvent(BaseModel):
    """Emitted for each turn; streamed to the combat log."""
    trial_id: UUID
    attempt_seq: int
    vector_id: UUID
    turn: int
    role: str                     # "attacker" | "agent" | "system"
    content: str
    broke: bool = False
    detector: DetectorType | None = None
    severity: Severity = Severity.none
    # Phase metadata — lets the frontend show progress + category banners
    category: str = ""            # injection | roleplay | social-eng | multi-turn | tool-abuse
    framework: str = ""           # garak | pyrit | ai_attacker
    total_vectors: int = 0        # total vectors in this trial's benchmark


class AttemptResult(BaseModel):
    vector_id: UUID
    seq: int
    outcome: Outcome
    detector: DetectorType | None
    severity: Severity
    turns: int
    transcript: list[dict[str, str]]   # full [{role, content}, …]
