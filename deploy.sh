#!/usr/bin/env bash
# Boot the school cluster and print isolated host log streams.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

POSTGRES_CONTAINER="postgres-service"
FRONTEND_CONTAINER="frontend-service"
BACKEND_CONTAINER="backend-service"

# shellcheck source=docker-access.sh
source "${ROOT}/docker-access.sh"

require_env_files() {
  local missing=0
  if [[ ! -f "${ROOT}/backend/.env" ]]; then
    echo "Missing backend/.env — copy backend/.env.example" >&2
    missing=1
  fi
  if [[ ! -f "${ROOT}/frontend/.env" ]]; then
    echo "Missing frontend/.env — copy frontend/.env.example" >&2
    missing=1
  fi
  if [[ "${missing}" -eq 1 ]]; then
    exit 1
  fi
}

read_database_url() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    printf '%s' "${DATABASE_URL}"
    return
  fi

  if [[ -f "${ROOT}/backend/.env" ]]; then
    local line
    line="$(grep -E '^DATABASE_URL=' "${ROOT}/backend/.env" | tail -n 1 || true)"
    if [[ -n "${line}" ]]; then
      printf '%s' "${line#DATABASE_URL=}"
      return
    fi
  fi

  printf '%s' "postgresql://school:school@postgres:5432/school"
}

redact_database_url() {
  sed -E 's#(://[^:/@]+):[^@/]*@#\1:***@#'
}

wait_healthy() {
  local container="$1"
  local deadline=$((SECONDS + 90))
  while true; do
    local status
    status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container}")"
    if [[ "${status}" == "healthy" ]]; then
      return 0
    fi
    if [[ "${status}" == "exited" || "${status}" == "dead" || "${status}" == "unhealthy" ]]; then
      echo "Container ${container} is ${status}" >&2
      docker logs --tail 80 "${container}" >&2 || true
      return 1
    fi
    if (( SECONDS >= deadline )); then
      echo "Timed out waiting for ${container} (last status: ${status})" >&2
      docker logs --tail 80 "${container}" >&2 || true
      return 1
    fi
    sleep 2
  done
}

require_env_files
DATABASE_URL_VALUE="$(read_database_url)"

echo "==> Building and starting postgres-service, backend-service, and frontend-service"
echo "==> DATABASE_URL $(printf '%s' "${DATABASE_URL_VALUE}" | redact_database_url)"
# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/write-dns-bind.sh"
if [[ -f docker-compose.dns-bind.yml ]]; then
  docker compose -f docker-compose.yml -f docker-compose.dns-bind.yml up -d --build
else
  docker compose up -d --build
fi

echo "==> Waiting for containers to become healthy"
wait_healthy "${POSTGRES_CONTAINER}"
wait_healthy "${BACKEND_CONTAINER}"
wait_healthy "${FRONTEND_CONTAINER}"

echo "==> Seeding first platform admin (no-op if one already exists)"
docker compose exec -T backend node src/seed-platform-admin.ts

FRONTEND_LOG="$(docker inspect --format='{{.LogPath}}' "${FRONTEND_CONTAINER}")"
BACKEND_LOG="$(docker inspect --format='{{.LogPath}}' "${BACKEND_CONTAINER}")"
POSTGRES_LOG="$(docker inspect --format='{{.LogPath}}' "${POSTGRES_CONTAINER}")"

cat <<EOF

Cluster is up.

  Frontend     http://localhost:3000
  Backend      http://localhost:5000/health
  Postgres     docker-only (postgres-service on the compose network)
  DATABASE_URL $(printf '%s' "${DATABASE_URL_VALUE}" | redact_database_url)

  Local default:  postgresql://school:school@postgres:5432/school
  Supabase:       put the pooler or direct URI in backend/.env as DATABASE_URL
                  (sslmode=require). Same key, no Supabase SDK.

Absolute host log paths (Docker json-file driver):

  postgres-service  ${POSTGRES_LOG}
  frontend-service  ${FRONTEND_LOG}
  backend-service   ${BACKEND_LOG}

These files are isolated, rotated (10m x 5), and tagged.
Each Docker line wraps one Pino JSON event in
{"log":"...","stream":"stdout|stderr","time":"..."}
(postgres writes plain server logs, not Pino).

--- Tail the separated host streams ---

  sudo tail -f '${POSTGRES_LOG}'
  sudo tail -f '${FRONTEND_LOG}'
  sudo tail -f '${BACKEND_LOG}'

--- Pretty-print live Pino JSON from the host files ---

  sudo tail -f '${FRONTEND_LOG}' | jq -r '.log' | npx --yes pino-pretty
  sudo tail -f '${BACKEND_LOG}'  | jq -r '.log' | npx --yes pino-pretty

--- Shell aliases (add to ~/.bashrc) ---

  alias logs-postgres="sudo tail -f '${POSTGRES_LOG}'"
  alias logs-frontend="sudo tail -f '${FRONTEND_LOG}' | jq -r '.log' | npx --yes pino-pretty"
  alias logs-backend="sudo tail -f '${BACKEND_LOG}' | jq -r '.log' | npx --yes pino-pretty"

--- Portable alternative (Docker API unwraps stdout/stderr; no sudo on the files) ---

  alias logs-postgres='docker logs -f ${POSTGRES_CONTAINER}'
  alias logs-frontend='docker logs -f ${FRONTEND_CONTAINER} | npx --yes pino-pretty'
  alias logs-backend='docker logs -f ${BACKEND_CONTAINER} | npx --yes pino-pretty'

One-shot dumps:

  docker logs ${POSTGRES_CONTAINER}
  docker logs ${FRONTEND_CONTAINER} | npx --yes pino-pretty
  docker logs ${BACKEND_CONTAINER}  | npx --yes pino-pretty

EOF
