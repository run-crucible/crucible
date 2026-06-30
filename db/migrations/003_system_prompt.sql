-- Add system_prompt to agents for "hosted" mode (CRUCIBLE runs the agent itself)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS system_prompt TEXT;
