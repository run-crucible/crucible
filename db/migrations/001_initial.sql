-- CRUCIBLE — initial schema
-- Run order: this file only. Later migrations: 002_*, 003_*, …

BEGIN;

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enum types ────────────────────────────────────────────────────────────────
CREATE TYPE agent_status    AS ENUM ('draft', 'verified', 'retired');
CREATE TYPE trial_status    AS ENUM ('queued', 'running', 'done', 'failed');
CREATE TYPE vector_vis      AS ENUM ('public', 'held_out');
CREATE TYPE attempt_outcome AS ENUM ('survived', 'broke');
CREATE TYPE severity_level  AS ENUM ('none', 'low', 'medium', 'high', 'critical');
CREATE TYPE detector_type   AS ENUM ('canary', 'policy', 'tool_call');
CREATE TYPE leaderboard_status AS ENUM ('proven', 'slag');

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  pwd_hash    TEXT,
  invite_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Agents ───────────────────────────────────────────────────────────────────
CREATE TABLE agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  endpoint_cfg    JSONB NOT NULL,   -- { url, model, auth_headers (encrypted) }
  auth_proof      JSONB NOT NULL DEFAULT '{}',  -- D6: attestation now; challenge-handshake later
  status          agent_status NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Oracle Manifests ─────────────────────────────────────────────────────────
-- Separate from agents so manifests are versioned/snapshotted per trial.
CREATE TABLE manifests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  canaries      JSONB NOT NULL DEFAULT '[]', -- issued tokens owner must embed
  policies      JSONB NOT NULL DEFAULT '[]', -- deterministic assertion rules
  tools         JSONB,                        -- PHASE 2: schema + forbidden/sensitive flags
  config_hash   TEXT,                         -- D11 artifact pinning: hash(model+system_prompt+tools)
  version       INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Corpus Versions ───────────────────────────────────────────────────────────
CREATE TABLE corpus_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version     INT NOT NULL UNIQUE,
  notes       TEXT,
  frozen_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Vectors (metadata only; held-out content lives in restricted file store) ──
CREATE TABLE vectors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework           TEXT NOT NULL,          -- garak | pyrit | promptfoo | deepteam | custom
  category            TEXT NOT NULL,          -- injection | roleplay | tool-abuse | social-eng | multi-turn
  difficulty          INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  visibility          vector_vis NOT NULL,
  corpus_version_id   UUID NOT NULL REFERENCES corpus_versions(id),
  content_ref         TEXT NOT NULL,          -- path or key in corpus store
  severity_default    severity_level NOT NULL DEFAULT 'none',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vectors_corpus   ON vectors(corpus_version_id);
CREATE INDEX idx_vectors_category ON vectors(category);
CREATE INDEX idx_vectors_vis      ON vectors(visibility);

-- ── Benchmark Sets (frozen sample per corpus version) ────────────────────────
CREATE TABLE benchmark_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_version_id UUID NOT NULL REFERENCES corpus_versions(id),
  vector_ids        JSONB NOT NULL,   -- ordered array of vector UUIDs
  frozen_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Trials ────────────────────────────────────────────────────────────────────
CREATE TABLE trials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES agents(id),
  manifest_id         UUID NOT NULL REFERENCES manifests(id),
  benchmark_set_id    UUID NOT NULL REFERENCES benchmark_sets(id),
  corpus_version_id   UUID NOT NULL REFERENCES corpus_versions(id),
  status              trial_status NOT NULL DEFAULT 'queued',
  temper              INT,                      -- null until done
  category_scores     JSONB,                    -- { injection: 720, roleplay: 580, … }
  critical_break      BOOLEAN NOT NULL DEFAULT false,
  budget_cap          JSONB NOT NULL DEFAULT '{}',   -- { max_tokens, max_usd }
  cost_used           JSONB NOT NULL DEFAULT '{}',   -- { tokens, usd } running total
  error_msg           TEXT,
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trials_agent  ON trials(agent_id);
CREATE INDEX idx_trials_status ON trials(status);

-- ── Attempts (written incrementally; tail = live combat log) ─────────────────
CREATE TABLE attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id        UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  vector_id       UUID NOT NULL REFERENCES vectors(id),
  seq             INT NOT NULL,              -- position in the run (for ordered replay)
  transcript_ref  TEXT,                      -- object storage key
  outcome         attempt_outcome,           -- null while in flight
  detector        detector_type,
  severity        severity_level NOT NULL DEFAULT 'none',
  turns           INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);
CREATE INDEX idx_attempts_trial ON attempts(trial_id, seq);

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id      UUID NOT NULL UNIQUE REFERENCES trials(id),
  summary_ref   TEXT NOT NULL,    -- object storage key (markdown)
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Marks (on-chain fields nullable until v2) ─────────────────────────────────
CREATE TABLE marks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID NOT NULL REFERENCES agents(id),
  trial_id            UUID NOT NULL UNIQUE REFERENCES trials(id),
  temper              INT NOT NULL,
  corpus_version_id   UUID NOT NULL REFERENCES corpus_versions(id),
  config_hash         TEXT,
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ,            -- staleness (null = no expiry for v1)
  onchain_ref         TEXT                    -- v2: cNFT/PDA address
);

-- ── Leaderboard entries (materialized, updated on trial completion) ────────────
CREATE TABLE leaderboard_entries (
  agent_id    UUID PRIMARY KEY REFERENCES agents(id),
  temper      INT NOT NULL,
  status      leaderboard_status NOT NULL,
  trial_id    UUID NOT NULL REFERENCES trials(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Trigger: agents.updated_at ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
-- Note: pwd_hash added after initial migration (applied separately)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS pwd_hash TEXT;
