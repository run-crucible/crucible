#!/usr/bin/env bash
# One-shot local setup script (macOS, Homebrew).
# Run once after clone: bash scripts/setup_local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " CRUCIBLE — local setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── .env ──────────────────────────────────────────
if [ ! -f .env ]; then cp .env.example .env; echo "✓ .env created from example"; fi

# ── Postgres ──────────────────────────────────────
PG_BIN="$(brew --prefix postgresql@16)/bin"
export PATH="$PG_BIN:$PATH"
echo "▶ Starting Postgres..."
brew services start postgresql@16 2>/dev/null || true
sleep 2
psql postgres -tc "SELECT 1 FROM pg_database WHERE datname='crucible'" | grep -q 1 \
  || psql postgres -c "CREATE DATABASE crucible;"
psql postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='crucible'" | grep -q 1 \
  || psql postgres -c "CREATE USER crucible WITH PASSWORD 'crucible' SUPERUSER;"
echo "✓ Postgres ready"

# ── Redis ─────────────────────────────────────────
echo "▶ Starting Redis..."
brew services start redis 2>/dev/null || true
sleep 1
echo "✓ Redis ready"

# ── MinIO (object store) — via Python if brew not available ───────────────────
# MVP: we'll use the filesystem fallback (S3 upload gracefully fails in report.py)
echo "ℹ  MinIO: skipped for local MVP (reports saved to /tmp if S3 unavailable)"

# ── Migrations ────────────────────────────────────
echo "▶ Running migrations..."
DATABASE_URL="postgresql://crucible:crucible@localhost:5432/crucible"
export DATABASE_URL
for f in db/migrations/*.sql; do
  echo "  applying $f"
  psql "$DATABASE_URL" -f "$f" -q 2>&1 | grep -v "^$" || true
done
echo "✓ Migrations done"

# ── Python venv ───────────────────────────────────
echo "▶ Python venv..."
if [ ! -d engine/.venv ]; then
  python3 -m venv engine/.venv
fi
source engine/.venv/bin/activate
pip install -q httpx tenacity pydantic pydantic-settings structlog \
  python-dotenv openai anyio "psycopg[binary]" redis boto3 \
  fastapi uvicorn websockets
echo "✓ Python deps ready"

# ── API ───────────────────────────────────────────
echo "▶ Installing API node modules..."
(cd api && npm install --silent 2>/dev/null)
echo "✓ API ready"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " SETUP COMPLETE. Start the stack:"
echo ""
echo "  # Terminal 1 — mock agent"
echo "  cd crucible && source engine/.venv/bin/activate"
echo "  python -m mock_agent.server"
echo ""
echo "  # Terminal 2 — API"
echo "  cd crucible/api && npm run dev"
echo ""
echo "  # Terminal 3 — worker"
echo "  cd crucible && source engine/.venv/bin/activate"
echo "  PYTHONPATH=. python -m engine.worker"
echo ""
echo "  # Terminal 4 — frontend"
echo "  cd crucible/frontend && npm run dev"
echo ""
echo "  # E2E smoke test (after all 4 are up)"
echo "  cd crucible && PYTHONPATH=. python scripts/e2e_smoke.py"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
