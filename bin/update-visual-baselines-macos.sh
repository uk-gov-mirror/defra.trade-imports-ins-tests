#!/bin/sh
# Regenerate @visual baselines on macOS (chromium-darwin snapshots).
# Playwright runs on the host against the workspace docker-compose stack on localhost.
#
# Usage: ./bin/update-visual-baselines-macos.sh [Playwright arguments]
# Example (origin-of-import only):
#   ./bin/update-visual-baselines-macos.sh tests/animals/e2e/visual/origin-of-import.visual.spec.ts
#
# Prerequisites:
#   - Docker Desktop running locally (unset DOCKER_HOST if it points at a remote host).
#   - Workspace stack up with the frontend branch you are baselining against, e.g.:
#       env -u DOCKER_HOST ~/git/defra/trade-imports-workspace/scripts/stack/run-stack.sh \
#         -b feat/EUDPA-635-accessible-autocomplete
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -n "${DOCKER_HOST:-}" ]; then
  echo "warning: DOCKER_HOST is set (${DOCKER_HOST}); local Docker Desktop may be ignored." >&2
  echo "  For macOS baselines, run: unset DOCKER_HOST" >&2
fi

cd "$REPO_ROOT"
sh ./bin/assert-stack.sh
npm run test:visual:update:macos -- "$@"
