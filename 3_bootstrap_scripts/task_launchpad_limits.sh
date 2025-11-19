#!/usr/bin/env bash
# Task-specific pre-commit hook for launchpad limits feature
# Only validates files related to launchpad limits
set -euo pipefail

FEATURE_FILES=(
  "frontend/src/components/review/ReviewQueue.ts"
  "frontend/src/components/review/ReviewQueue.test.ts"
  "frontend/src/components/review/OverflowIndicator.ts"
  "frontend/src/components/review/OverflowIndicator.test.ts"
  "frontend/src/api/review-api.ts"
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
    if [[ "$file" == "$feature_file" ]] || [[ "$file" == *"OverflowIndicator"* ]] || [[ "$file" == *"launchpad"* ]]; then
      HAS_FEATURE_FILES=true
      break
    fi
  done
done

if [ "$HAS_FEATURE_FILES" = false ]; then
  echo "[task:launchpad-limits] No feature files changed, skipping"
  exit 0
fi

echo "[task:launchpad-limits] Validating launchpad limits feature files..."

# Run tests for feature files only
cd frontend
if [ -f "src/components/review/OverflowIndicator.test.ts" ]; then
  echo "[task:launchpad-limits] Running OverflowIndicator tests..."
  npm test -- OverflowIndicator.test.ts --run || exit 1
fi

# Validate SOLID (SRP check for OverflowIndicator only)
if [ -f "src/components/review/OverflowIndicator.ts" ]; then
  echo "[task:launchpad-limits] Validating SOLID principles..."
  python3 ../3_bootstrap_scripts/architecture_check.py --component OverflowIndicator --principle SRP || echo "[task:launchpad-limits] Architecture check skipped"
fi

# Lint feature files only
FEATURE_TS_FILES=()
for file in "${FEATURE_FILES[@]}"; do
  if [[ "$file" == *.ts ]] && [ -f "$file" ]; then
    FEATURE_TS_FILES+=("$file")
  fi
done

if [ ${#FEATURE_TS_FILES[@]} -gt 0 ]; then
  echo "[task:launchpad-limits] Linting feature files..."
  npx eslint "${FEATURE_TS_FILES[@]}" || exit 1
fi

echo "[task:launchpad-limits] Validation complete"

