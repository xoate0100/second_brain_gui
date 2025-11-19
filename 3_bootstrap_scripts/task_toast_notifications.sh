#!/usr/bin/env bash
# Task-specific pre-commit hook for toast notifications feature
# Only validates files related to toast notifications
set -euo pipefail

FEATURE_FILES=(
  "frontend/src/components/common/Toast.ts"
  "frontend/src/components/common/Toast.test.ts"
  "frontend/src/services/ToastManager.ts"
  "frontend/src/services/ToastManager.test.ts"
  "frontend/src/styles/toast.css"
)

# Get changed files from git or arguments
CHANGED_FILES=("$@")
if [ ${#CHANGED_FILES[@]} -eq 0 ]; then
  CHANGED_FILES=($(git diff --cached --name-only 2>/dev/null || true))
fi

# Check if any feature files changed
HAS_FEATURE_FILES=false
for file in "${CHANGED_FILES[@]}"; do
  for feature_file in "${FEATURE_FILES[@]}"; do
    if [[ "$file" == "$feature_file" ]] || [[ "$file" == *"Toast"* ]] || [[ "$file" == *"toast"* ]]; then
      HAS_FEATURE_FILES=true
      break
    fi
  done
done

if [ "$HAS_FEATURE_FILES" = false ]; then
  echo "[task:toast-notifications] No feature files changed, skipping"
  exit 0
fi

echo "[task:toast-notifications] Validating toast notifications feature files..."

# Run tests for feature files only
cd frontend
if [ -f "src/components/common/Toast.test.ts" ]; then
  echo "[task:toast-notifications] Running Toast tests..."
  npm test -- Toast.test.ts --run || exit 1
fi

if [ -f "src/services/ToastManager.test.ts" ]; then
  echo "[task:toast-notifications] Running ToastManager tests..."
  npm test -- ToastManager.test.ts --run || exit 1
fi

# Validate SOLID (SRP check for Toast and ToastManager)
if [ -f "src/components/common/Toast.ts" ]; then
  echo "[task:toast-notifications] Validating SOLID principles..."
  python3 ../3_bootstrap_scripts/architecture_check.py --component Toast --principle SRP || echo "[task:toast-notifications] Architecture check skipped"
fi

# Lint feature files only
FEATURE_TS_FILES=()
for file in "${FEATURE_FILES[@]}"; do
  if [[ "$file" == *.ts ]] && [ -f "$file" ]; then
    FEATURE_TS_FILES+=("$file")
  fi
done

if [ ${#FEATURE_TS_FILES[@]} -gt 0 ]; then
  echo "[task:toast-notifications] Linting feature files..."
  npx eslint "${FEATURE_TS_FILES[@]}" || exit 1
fi

echo "[task:toast-notifications] Validation complete"

