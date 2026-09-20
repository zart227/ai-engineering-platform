#!/usr/bin/env bash
# Wrapper so you can run ./relocate-projects.sh from this folder.
set -euo pipefail
cd "$(dirname "$0")"
exec python3 ./relocate-projects.py "$@"
