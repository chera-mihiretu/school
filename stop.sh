#!/usr/bin/env bash
# Stop the school cluster (frontend, backend, and postgres).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

# shellcheck source=docker-access.sh
source "${ROOT}/docker-access.sh"

echo "==> Stopping frontend-service, backend-service, and postgres-service"
docker compose stop frontend backend postgres

docker compose ps -a
