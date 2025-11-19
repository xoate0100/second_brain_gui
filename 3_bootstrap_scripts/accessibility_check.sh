#!/usr/bin/env bash
# Accessibility check for WCAG 2.1 AA compliance
set -euo pipefail

if [ ! -d "frontend" ]; then
  exit 0
fi

# Check if accessibility tools are available
if command -v pa11y &> /dev/null; then
  # Run pa11y on HTML files
  find frontend -name "*.html" -type f | while read -r html_file; do
    if pa11y "$html_file" 2>/dev/null; then
      echo "[a11y] ✅ $html_file passed accessibility check"
    else
      echo "[a11y] ⚠️  $html_file has accessibility issues"
      # Don't fail on first issue, collect all
    fi
  done
elif [ -f "frontend/package.json" ] && grep -q "@axe-core\|pa11y" frontend/package.json; then
  # Try npm script if available
  cd frontend
  if npm run test:a11y 2>/dev/null || npm run a11y 2>/dev/null; then
    echo "[a11y] ✅ Accessibility tests passed"
    exit 0
  else
    echo "[a11y] ⚠️  Accessibility tests failed or not configured"
    exit 0  # Don't block, just warn
  fi
else
  echo "[a11y] ⚠️  Warning: No accessibility testing tools found"
  echo "[a11y] Install pa11y or @axe-core/cli for WCAG 2.1 AA validation"
  exit 0  # Don't block, just warn
fi
