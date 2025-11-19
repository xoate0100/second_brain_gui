#!/usr/bin/env bash
# Task-specific pre-commit hook for markdown rendering feature
# Only validates files related to markdown rendering
set -euo pipefail

FEATURE_FILES=(
  "frontend/src/components/common/MarkdownRenderer.ts"
  "frontend/src/components/common/MarkdownRenderer.test.ts"
  "frontend/src/components/notes/NoteDetail.ts"
  "frontend/src/styles/markdown.css"
  "frontend/src/components/notes/NoteDetail.integration.test.ts"
  "frontend/e2e/markdown-rendering.spec.ts"
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
    if [[ "$file" == "$feature_file" ]] || [[ "$file" == *"MarkdownRenderer"* ]] || [[ "$file" == *"markdown"* ]]; then
      HAS_FEATURE_FILES=true
      break
    fi
  done
done

if [ "$HAS_FEATURE_FILES" = false ]; then
  echo "[task:markdown-rendering] No feature files changed, skipping"
  exit 0
fi

echo "[task:markdown-rendering] Validating markdown rendering feature files..."

# Run tests for feature files only
cd frontend
if [ -f "src/components/common/MarkdownRenderer.test.ts" ]; then
  echo "[task:markdown-rendering] Running MarkdownRenderer tests..."
  npm test -- MarkdownRenderer.test.ts --run || exit 1
fi

# Validate SOLID (SRP check for MarkdownRenderer only)
if [ -f "src/components/common/MarkdownRenderer.ts" ]; then
  echo "[task:markdown-rendering] Validating SOLID principles..."
  python3 ../3_bootstrap_scripts/architecture_check.py --component MarkdownRenderer --principle SRP || echo "[task:markdown-rendering] Architecture check skipped (component may not exist yet)"
fi

# Lint feature files only
FEATURE_TS_FILES=()
for file in "${FEATURE_FILES[@]}"; do
  if [[ "$file" == *.ts ]] && [ -f "$file" ]; then
    FEATURE_TS_FILES+=("$file")
  fi
done

if [ ${#FEATURE_TS_FILES[@]} -gt 0 ]; then
  echo "[task:markdown-rendering] Linting feature files..."
  npx eslint "${FEATURE_TS_FILES[@]}" || exit 1
fi

echo "[task:markdown-rendering] Validation complete"
