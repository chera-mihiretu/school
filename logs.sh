#!/usr/bin/env bash
# Follow one service log stream. Pino services go through pino-pretty.
# Usage: ./logs.sh frontend|backend|postgres
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT}"

# shellcheck source=docker-access.sh
source "${ROOT}/docker-access.sh"

service="${1:-}"

case "${service}" in
  frontend | frontend-service)
    container="frontend-service"
    ;;
  backend | backend-service)
    container="backend-service"
    ;;
  postgres | postgres-service)
    container="postgres-service"
    ;;
  *)
    echo "Usage: ./logs.sh frontend|backend|postgres" >&2
    echo "  ./logs.sh frontend" >&2
    echo "  ./logs.sh backend" >&2
    echo "  ./logs.sh postgres" >&2
    exit 1
    ;;
esac

echo "==> ${container} (existing lines, then follow; Ctrl+C to stop)"

if [[ "${container}" == "postgres-service" ]]; then
  docker logs --tail 100 -f "${container}"
  exit 0
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "${NVM_DIR}/nvm.sh"
fi

# Windows npx.cmd inherits \\wsl.localhost\... and hangs CMD.EXE.
PATH="$(printf '%s' "${PATH}" | awk -v RS=: -v ORS=: '$0 !~ /^\/mnt\/c\// {print}' | sed 's/:$//')"
export PATH

npx_bin="$(command -v npx || true)"
if [[ -z "${npx_bin}" || "${npx_bin}" == /mnt/c/* ]]; then
  echo "Linux npx not found. Install Node in this WSL distro (nvm), then re-run." >&2
  exit 1
fi

docker logs --tail 100 -f "${container}" | "${npx_bin}" --yes pino-pretty
