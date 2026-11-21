#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Diaspora Connect — build and start (or update) the app on the VPS
#
#     cd /opt/diaspora-connect && bash deploy/deploy.sh
#
#  Pulls the latest code, builds the website inside Docker (no Node.js needed on
#  the server), and starts Caddy (website + automatic HTTPS) and the API.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f backend/.env ]; then
  echo "backend/.env is missing. Run: cp backend/.env.example backend/.env  and fill it in."; exit 1
fi
if ! grep -qE '^SUPABASE_SERVICE_ROLE_KEY="?[A-Za-z0-9._-]{20,}' backend/.env; then
  echo "Set SUPABASE_SERVICE_ROLE_KEY in backend/.env (Supabase → Project Settings → API → service_role)."; exit 1
fi
[ -f .env.production ] || cp .env.example .env.production

echo "==> Latest code"
git pull --ff-only || echo "(could not pull — using the code already here)"

echo "==> Building the website"
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD":/app -w /app node:20-alpine sh -c "npm ci --no-audit --no-fund && npm run build"

echo "==> Starting Caddy + API"
docker compose -f docker/docker-compose.yml up -d --build
docker image prune -f >/dev/null

echo "==> Waiting for the API"
for i in $(seq 1 30); do
  if docker compose -f docker/docker-compose.yml exec -T backend wget -qO- http://localhost:4000/health 2>/dev/null; then
    echo; echo "API is up."; break
  fi
  sleep 3
done

cat <<'EOF'

Done. Check in a browser:
  https://diasporaconnectt.com
  https://api.diasporaconnectt.com/health     → "database":"ok"

The first visit can take a minute while Caddy gets the HTTPS certificates
(the domain's A records must already point to this server).
Logs:  docker compose -f docker/docker-compose.yml logs -f
EOF
