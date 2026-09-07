# Sourced by deploy.sh and logs.sh. Re-execs the caller with the docker group
# when this shell was started before group membership was applied.
# Requires ROOT to be set.

if ! docker info >/dev/null 2>&1; then
  user_name="$(id -un)"
  in_docker_group=0
  if getent group docker | awk -F: '{print $4}' | tr ',' '\n' | grep -qx "${user_name}"; then
    in_docker_group=1
  fi

  wsl_bin="$(command -v wsl.exe || true)"
  if [[ -z "${wsl_bin}" && -x /mnt/c/Windows/System32/wsl.exe ]]; then
    wsl_bin="/mnt/c/Windows/System32/wsl.exe"
  fi
  if [[ "${in_docker_group}" -eq 1 && "${DEPLOY_DOCKER_REEXEC:-}" != "1" && -n "${wsl_bin}" ]]; then
    echo "==> Refreshing docker group via a new WSL login"
    quoted_args=""
    for arg in "$@"; do
      quoted_args+=" $(printf '%q' "${arg}")"
    done
    caller="$(readlink -f "$0")"
    # wsl.exe must not inherit a UNC cwd (\\wsl.localhost\...), or CMD.EXE hangs.
    cd "${HOME}"
    exec "${wsl_bin}" --cd "${HOME}" -e bash -lc "export DEPLOY_DOCKER_REEXEC=1; export NVM_DIR=\"\$HOME/.nvm\"; [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"; cd $(printf '%q' "${ROOT}"); exec $(printf '%q' "${caller}")${quoted_args}"
  fi

  echo "Docker is not reachable from this user (unix:///var/run/docker.sock)." >&2
  if [[ "${in_docker_group}" -eq 1 ]]; then
    echo "${user_name} is already in the docker group; this shell is stale." >&2
    echo "Open a new terminal, or run: wsl.exe --cd ~ -e bash" >&2
  else
    echo "Add the user to the docker group, then open a new terminal." >&2
  fi
  exit 1
fi
