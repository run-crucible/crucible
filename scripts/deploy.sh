#!/usr/bin/env bash
# CRUCIBLE — one-shot production deploy to VPS
# Usage: ANTHROPIC_API_KEY=sk-ant-... bash scripts/deploy.sh
set -euo pipefail

VPS="root@178.18.240.104"
DOMAIN="runcrucible.xyz"
REMOTE_DIR="/opt/crucible"

# ── Secrets (generated once, stable across deploys) ────────────────────────
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:-crucible}"
S3_SECRET_KEY="${S3_SECRET_KEY:-$(openssl rand -hex 20)}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " CRUCIBLE deploy → $DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Sync code to VPS ─────────────────────────────────────────────────────
echo "▶ Syncing code..."
ssh -o StrictHostKeyChecking=no "$VPS" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='.venv' \
  --exclude='dist' \
  --exclude='.env' \
  "$(dirname "$0")/../" \
  "$VPS:$REMOTE_DIR/"
echo "✓ Code synced"

# ── 2. Write .env on VPS ────────────────────────────────────────────────────
echo "▶ Writing .env..."
ssh "$VPS" "cat > $REMOTE_DIR/.env" << EOF
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
S3_ACCESS_KEY=$S3_ACCESS_KEY
S3_SECRET_KEY=$S3_SECRET_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF
echo "✓ .env written"

# ── 3. Install certbot + get SSL cert ───────────────────────────────────────
echo "▶ Setting up SSL..."
ssh "$VPS" bash << 'ENDSSH'
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx -q
fi
if [ ! -f /etc/letsencrypt/live/runcrucible.xyz/fullchain.pem ]; then
  # Temp nginx block for ACME challenge
  certbot certonly --nginx -d runcrucible.xyz -d www.runcrucible.xyz \
    --non-interactive --agree-tos -m admin@runcrucible.xyz
fi
echo "SSL ready"
ENDSSH

# ── 4. Install nginx config ─────────────────────────────────────────────────
echo "▶ Configuring nginx..."
ssh "$VPS" bash << ENDSSH
cp $REMOTE_DIR/infra/nginx-crucible.conf /etc/nginx/sites-available/runcrucible.xyz
ln -sf /etc/nginx/sites-available/runcrucible.xyz /etc/nginx/sites-enabled/runcrucible.xyz
nginx -t && systemctl reload nginx
echo "nginx OK"
ENDSSH

# ── 5. Build + start Docker stack ───────────────────────────────────────────
echo "▶ Building Docker images (this takes a few minutes)..."
ssh "$VPS" bash << ENDSSH
cd $REMOTE_DIR/infra
docker compose -f docker-compose.prod.yml --env-file $REMOTE_DIR/.env pull --quiet 2>/dev/null || true
docker compose -f docker-compose.prod.yml --env-file $REMOTE_DIR/.env build --quiet
docker compose -f docker-compose.prod.yml --env-file $REMOTE_DIR/.env up -d
echo "Stack up"
ENDSSH

# ── 6. Wait for postgres, run migrations ────────────────────────────────────
echo "▶ Running migrations..."
ssh "$VPS" bash << 'ENDSSH'
echo "Waiting for postgres..."
for i in $(seq 1 30); do
  docker exec crucible-postgres-1 pg_isready -U crucible -q && break
  sleep 2
done

for f in /opt/crucible/db/migrations/*.sql; do
  echo "  applying $f"
  cat "$f" | docker exec -i crucible-postgres-1 psql -U crucible -d crucible 2>&1 | tail -3
done
echo "Migrations done"
ENDSSH

# ── 7. Create MinIO buckets ─────────────────────────────────────────────────
echo "▶ Creating MinIO buckets..."
ssh "$VPS" bash << 'ENDSSH'
cd /opt/crucible/infra
sleep 5  # let minio finish starting
docker compose -f docker-compose.prod.yml exec -T minio \
  sh -c 'mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD 2>/dev/null;
         mc mb --ignore-existing local/transcripts;
         mc mb --ignore-existing local/reports;
         echo "buckets ready"' 2>/dev/null || echo "MinIO buckets (will retry on next deploy)"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ CRUCIBLE IS LIVE"
echo " https://runcrucible.xyz"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
