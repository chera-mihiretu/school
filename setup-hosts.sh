#!/usr/bin/env bash
# Map *.e-school.et to 127.0.0.1 with local CoreDNS (wildcard).
# Usage: ./setup-hosts.sh
# Campus slugs do not need a hosts line. Do not pass slugs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_HOST="${APP_HOST:-e-school.et}"
ROOT_HOST="${ROOT_HOST%%:*}"
MARK="# ${ROOT_HOST} (managed by setup-hosts.sh)"

if [[ "$#" -gt 0 ]]; then
  echo "Slugs are ignored. Local CoreDNS answers every *.${ROOT_HOST} name."
fi

# Static fallback only. Wildcards are not valid in hosts files.
LINE="127.0.0.1 ${ROOT_HOST} www.${ROOT_HOST} admin.${ROOT_HOST} app.${ROOT_HOST} ${MARK}"

upsert_hosts() {
  local file="$1"
  if [[ ! -f "${file}" ]]; then
    echo "Missing hosts file: ${file}" >&2
    return 1
  fi
  if [[ ! -w "${file}" ]]; then
    echo "Cannot write ${file} (need admin/sudo)." >&2
    echo "Add this line:" >&2
    echo "  ${LINE}" >&2
    return 1
  fi

  local tmp
  tmp="$(mktemp)"
  grep -v -F "${MARK}" "${file}" > "${tmp}"
  printf '%s\n' "${LINE}" >> "${tmp}"
  cat "${tmp}" > "${file}"
  rm -f "${tmp}"
  echo "Updated ${file}"
}

wsl_hosts="/etc/hosts"
win_hosts="/mnt/c/Windows/System32/drivers/etc/hosts"

if [[ -w "${wsl_hosts}" ]]; then
  upsert_hosts "${wsl_hosts}" || true
elif command -v sudo >/dev/null; then
  if sudo -n true 2>/dev/null; then
    tmp="$(mktemp)"
    sudo grep -v -F "${MARK}" "${wsl_hosts}" > "${tmp}"
    printf '%s\n' "${LINE}" | sudo tee -a "${tmp}" >/dev/null
    sudo cp "${tmp}" "${wsl_hosts}"
    rm -f "${tmp}"
    echo "Updated ${wsl_hosts}"
  else
    echo "WSL already needs sudo for ${wsl_hosts}. Chrome on Windows ignores this file."
  fi
fi

PS="/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
if [[ -x "${PS}" ]]; then
  echo "==> Browser wildcard (no admin): *.${ROOT_HOST} -> 127.0.0.1"
  cp "${SCRIPT_DIR}/setup-hosts-user.ps1" /mnt/c/Users/Public/school-setup-hosts-user.ps1
  "${PS}" -NoProfile -ExecutionPolicy Bypass -File 'C:\Users\Public\school-setup-hosts-user.ps1'
fi

echo "==> Approve the Windows UAC prompt to enable *.${ROOT_HOST} for every app (NRPT)"
if [[ -f "${SCRIPT_DIR}/setup-hosts.ps1" ]] && [[ -x "${PS}" ]]; then
  cp "${SCRIPT_DIR}/setup-hosts.ps1" /mnt/c/Users/Public/school-setup-hosts.ps1
  cp "${SCRIPT_DIR}/setup-hosts.bat" /mnt/c/Users/Public/school-setup-hosts.bat
  for d in /mnt/c/Users/*/Desktop /mnt/c/Users/Public/Desktop; do
    if [[ -d "${d}" ]]; then
      cp "${SCRIPT_DIR}/setup-hosts.bat" "${d}/Enable e-school wildcard DNS.bat" 2>/dev/null || true
    fi
  done
  # Avoid UNC cwd so cmd.exe can start. UAC must be approved on the Windows desktop.
  (cd /mnt/c/Users/Public && /mnt/c/Windows/System32/cmd.exe /c \
    "start /wait powershell.exe -NoProfile -ExecutionPolicy Bypass -Command Start-Process -FilePath 'C:\\Users\\Public\\school-setup-hosts.bat' -Verb RunAs -Wait")
  if [[ -f /mnt/c/Users/Public/school-setup-hosts.log ]]; then
    echo "==> Windows setup log"
    cat /mnt/c/Users/Public/school-setup-hosts.log
  else
    echo "UAC was not approved. System DNS still will not wildcard."
    echo "Use the Desktop shortcut 'e-school' for Chrome/Edge, or run"
    echo "  C:\\Users\\Public\\school-setup-hosts.bat as administrator."
  fi
fi

echo "==> Starting local wildcard DNS (*.${ROOT_HOST} -> 127.0.0.1)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/write-dns-bind.sh"
compose_files=(-f "${SCRIPT_DIR}/docker-compose.yml")
if [[ -f "${SCRIPT_DIR}/docker-compose.dns-bind.yml" ]]; then
  compose_files+=(-f "${SCRIPT_DIR}/docker-compose.dns-bind.yml")
fi
docker compose "${compose_files[@]}" up -d --force-recreate dns

echo
echo "Resolve these in the browser (every campus slug, no extra setup):"
echo "  http://${ROOT_HOST}:3000"
echo "  http://www.${ROOT_HOST}:3000"
echo "  http://admin.${ROOT_HOST}:3000"
echo "  http://app.${ROOT_HOST}:3000"
echo "  http://<slug>.${ROOT_HOST}:3000"
echo
echo "If a new campus does not open:"
echo "  - Open the Desktop shortcut 'e-school' (maps every *.${ROOT_HOST} in that browser)"
echo "  - Or run C:\\Users\\Public\\school-setup-hosts.bat as administrator (once)"
echo "  - Turn off Chrome Secure DNS if you are not using the shortcut"
