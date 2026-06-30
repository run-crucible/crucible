#!/usr/bin/env bash
# Run all migrations in order against DATABASE_URL
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://crucible:crucible@localhost:5432/crucible}"

for f in "$(dirname "$0")"/migrations/*.sql; do
  echo "▶ Applying $f"
  psql "$DB_URL" -f "$f"
done

echo "✓ All migrations applied."
