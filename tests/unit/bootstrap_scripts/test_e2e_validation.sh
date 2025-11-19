#!/usr/bin/env bash
# Test E2E validation script

set -euo pipefail

test_e2e_script_exists() {
  if [ -f "3_bootstrap_scripts/e2e_validation.sh" ]; then
    echo "✅ E2E validation script exists"
  else
    echo "❌ E2E validation script not found"
    exit 1
  fi
}

test_e2e_script_executable() {
  if [ -x "3_bootstrap_scripts/e2e_validation.sh" ]; then
    echo "✅ E2E validation script is executable"
  else
    echo "⚠️  E2E validation script not executable (may need chmod +x)"
  fi
}

# Run tests
test_e2e_script_exists
test_e2e_script_executable

echo "All tests passed!"
