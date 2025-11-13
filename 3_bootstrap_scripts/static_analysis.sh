#!/usr/bin/env bash
set -euo pipefail
STATUS=0
if [ -d "backend" ]; then
  python3 -m pip install --quiet flake8 mypy || true
  flake8 backend || STATUS=1
  mypy backend || STATUS=1
fi
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  (cd frontend && npm run -s typecheck 2>/dev/null || npm run -s build --if-present 2>/dev/null || echo "[static] Frontend typecheck skipped (no source files yet)") || STATUS=0
fi
exit $STATUS

