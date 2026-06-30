from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    # Postgres
    database_url: str = "postgresql://crucible:crucible@localhost:5432/crucible"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Object storage
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "crucible"
    s3_secret_key: str = "crucible_secret"
    s3_bucket_transcripts: str = "transcripts"
    s3_bucket_reports: str = "reports"

    # Attacker LLM — Anthropic Claude for adaptive attacks
    anthropic_api_key: str = ""
    openai_api_key: str = ""          # fallback / legacy
    attacker_model: str = "claude-opus-4-5"
    attacker_temperature: float = 0.7
    attacker_seed: int = 42

    # Corpus paths
    held_out_store_path: str = "/corpus/held_out"
    public_corpus_path: str = "/corpus/public"


settings = Settings()
