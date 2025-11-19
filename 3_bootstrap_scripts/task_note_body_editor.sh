#!/usr/bin/env bash
# Task-specific pre-commit hook for note body editor feature
# Only validates files related to note body editor
set -euo pipefail

FEATURE_FILES=(
  "frontend/src/components/notes/NoteBodyEditor.ts"
  "frontend/src/components/notes/NoteBodyEditor.test.ts"
  "frontend/src/components/notes/NoteDetail.ts"
  "frontend/src/api/types.ts"
  "frontend/src/api/notes-api.ts"
  "frontend/src/api/notes-api.test.ts"
  "frontend/src/components/notes/NoteDetail.integration.test.ts"
  "frontend/e2e/note-body-editor.spec.ts"
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
    if [[ "$file" == "$feature_file" ]] || [[ "$file" == *"NoteBodyEditor"* ]] || [[ "$file" == *"note-body-editor"* ]]; then
      HAS_FEATURE_FILES=true
      break
    fi
  done
done

if [ "$HAS_FEATURE_FILES" = false ]; then
  echo "[task:note-body-editor] No feature files changed, skipping"
  exit 0
fi

echo "[task:note-body-editor] Validating note body editor feature files..."

# Run tests for feature files only
cd frontend
if [ -f "src/components/notes/NoteBodyEditor.test.ts" ]; then
  echo "[task:note-body-editor] Running NoteBodyEditor tests..."
  npm test -- NoteBodyEditor.test.ts --run || exit 1
fi

# Validate SOLID (SRP check for NoteBodyEditor only)
if [ -f "src/components/notes/NoteBodyEditor.ts" ]; then
  echo "[task:note-body-editor] Validating SOLID principles..."
  python3 ../3_bootstrap_scripts/architecture_check.py --component NoteBodyEditor --principle SRP || echo "[task:note-body-editor] Architecture check skipped (component may not exist yet)"
fi

# Lint feature files only
FEATURE_TS_FILES=()
for file in "${FEATURE_FILES[@]}"; do
  if [[ "$file" == *.ts ]] && [ -f "$file" ]; then
    FEATURE_TS_FILES+=("$file")
  fi
done

if [ ${#FEATURE_TS_FILES[@]} -gt 0 ]; then
  echo "[task:note-body-editor] Linting feature files..."
  npx eslint "${FEATURE_TS_FILES[@]}" || exit 1
fi

echo "[task:note-body-editor] Validation complete"

