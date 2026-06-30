#!/usr/bin/env bash
# Run AFTER DNS points runcrucible.xyz → 178.18.240.104
# Usage: bash scripts/setup_ssl.sh
set -euo pipefail

VPS="root@178.18.240.104"
DOMAIN="runcrucible.xyz"

echo "▶ Checking DNS..."
IP=$(dig +short "$DOMAIN" A | head -1)
if [ "$IP" != "178.18.240.104" ]; then
  echo "✗ DNS not ready yet: $DOMAIN → $IP (need 178.18.240.104)"
  echo "  Update A-record in your domain registrar and wait 5-60 min"
  exit 1
fi
echo "✓ DNS OK: $DOMAIN → $IP"

echo "▶ Getting SSL certificate..."
ssh -o StrictHostKeyChecking=no "$VPS" bash << 'ENDSSH'
apt-get install -y certbot python3-certbot-nginx -q

certbot certonly --nginx \
  -d runcrucible.xyz -d www.runcrucible.xyz \
  --non-interactive --agree-tos -m admin@runcrucible.xyz

# Upgrade nginx config to HTTPS
cat > /etc/nginx/sites-available/runcrucible.xyz << 'NGINX'
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name runcrucible.xyz www.runcrucible.xyz;
    location /.well-known/acme-challenge/ { root /var/www/html; allow all; }
    location / { return 301 https://runcrucible.xyz$request_uri; }
}

server {
    listen 443 ssl;
    server_name runcrucible.xyz www.runcrucible.xyz;

    ssl_certificate     /etc/letsencrypt/live/runcrucible.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/runcrucible.xyz/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    location /stream/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection $connection_upgrade;
        proxy_set_header   Host       $host;
        proxy_read_timeout 86400s;
    }

    location /api/ {
        rewrite            ^/api/(.*) /$1 break;
        proxy_pass         http://127.0.0.1:3001;
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
    }

    location / {
        proxy_pass         http://127.0.0.1:5174;
        proxy_set_header   Host       $host;
    }
}
NGINX

nginx -t && systemctl reload nginx
echo "✓ HTTPS enabled"
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ https://runcrucible.xyz is live with SSL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
