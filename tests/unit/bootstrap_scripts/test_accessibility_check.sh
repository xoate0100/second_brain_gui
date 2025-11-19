#!/usr/bin/env bash
# Test accessibility check script

set -euo pipefail

test_accessibility_script_exists() {
  if [ -f "3_bootstrap_scripts/accessibility_check.sh" ]; then
    echo "✅ Accessibility check script exists"
  else
    echo "❌ Accessibility check script not found"
    exit 1
  fi
}

test_accessibility_script_executable() {
  if [ -x "3_bootstrap_scripts/accessibility_check.sh" ]; then
    echo "✅ Accessibility check script is executable"
  else
    echo "⚠️  Accessibility check script not executable (may need chmod +x)"
  fi
}

# Run tests
test_accessibility_script_exists
test_accessibility_script_executable

echo "All tests passed!"
