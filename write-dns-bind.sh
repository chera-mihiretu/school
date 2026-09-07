#!/usr/bin/env bash
# Write the WSL eth0 bind so Windows can query CoreDNS without using
# Windows 127.0.0.1:53 (Internet Connection Sharing owns that port).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ETH_IP="$(ip -4 -o addr show eth0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 || true)"

if [[ -z "${ETH_IP}" ]]; then
  echo "No WSL eth0 IPv4 address; CoreDNS will stay on 127.0.0.1 only." >&2
  rm -f "${SCRIPT_DIR}/docker-compose.dns-bind.yml"
  rm -f /mnt/c/Users/Public/school-dns-ip.txt
  return 0 2>/dev/null || true
fi

cat > "${SCRIPT_DIR}/docker-compose.dns-bind.yml" <<EOF
services:
  dns:
    ports:
      - "${ETH_IP}:53:1053/udp"
      - "${ETH_IP}:53:1053/tcp"
EOF

if [[ -d /mnt/c/Users/Public ]]; then
  printf '%s\n' "${ETH_IP}" > /mnt/c/Users/Public/school-dns-ip.txt
fi

echo "Windows DNS target: ${ETH_IP}"
