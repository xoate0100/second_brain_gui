#!/usr/bin/env bash
# Task-specific pre-commit hook for inline editing feature
# Only validates files related to inline editing
set -euo pipefail

FEATURE_FILES=(
  "frontend/src/components/common/InlineEditor.ts"
  "frontend/src/components/common/InlineEditor.test.ts"
  "frontend/src/components/notes/NoteDetail.ts"
  "frontend/src/styles/inline-editor.css"
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
    if [[ "$file" == "$feature_file" ]] || [[ "$file" == *"InlineEditor"* ]] || [[ "$file" == *"inline-editor"* ]]; then
      HAS_FEATURE_FILES=true
      break
    fi
  done
done

if [ "$HAS_FEATURE_FILES" = false ]; then
  echo "[task:inline-editing] No feature files changed, skipping"
  exit 0
fi

echo "[task:inline-editing] Validating inline editing feature files..."

# Run tests for feature files only
cd frontend
if [ -f "src/components/common/InlineEditor.test.ts" ]; then
  echo "[task:inline-editing] Running InlineEditor tests..."
  npm test -- InlineEditor.test.ts --run || exit 1
fi

# Validate SOLID (SRP check for InlineEditor only)
if [ -f "src/components/common/InlineEditor.ts" ]; then
  echo "[task:inline-editing] Validating SOLID principles..."
  python3 ../3_bootstrap_scripts/architecture_check.py --component InlineEditor --principle SRP || echo "[task:inline-editing] Architecture check skipped"
fi

# Lint feature files only
FEATURE_TS_FILES=()
for file in "${FEATURE_FILES[@]}"; do
  if [[ "$file" == *.ts ]] && [ -f "$file" ]; then
    FEATURE_TS_FILES+=("$file")
  fi
done

if [ ${#FEATURE_TS_FILES[@]} -gt 0 ]; then
  echo "[task:inline-editing] Linting feature files..."
  npx eslint "${FEATURE_TS_FILES[@]}" || exit 1
fi

echo "[task:inline-editing] Validation complete"

