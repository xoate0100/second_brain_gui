#!/usr/bin/env bash
# E2E validation using Playwright
# NOTE: E2E tests are skipped in pre-commit hooks due to performance (require dev server)
# Run manually with: cd frontend && npm run test:e2e
set -euo pipefail

# Skip E2E tests in pre-commit (too slow - require dev server startup)
# E2E tests should be run in CI/CD pipeline or manually
echo "[e2e] E2E tests skipped in pre-commit (run manually: npm run test:e2e)"
echo "[e2e] E2E tests should be run in CI/CD pipeline for full validation"
exit 0

# Original implementation (commented out for performance):
# if [ ! -d "frontend" ]; then
#   exit 0
# fi
# 
# if [ ! -f "frontend/package.json" ]; then
#   exit 0
# fi
# 
# # Check if Playwright is configured
# if ! grep -q "playwright" frontend/package.json && ! grep -q "@playwright" frontend/package.json; then
#   echo "[e2e] Playwright not configured, skipping E2E tests"
#   exit 0
# fi
# 
# cd frontend
# 
# # Install dependencies if needed
# if [ ! -d "node_modules" ]; then
#   npm ci --silent 2>/dev/null || echo "[e2e] Warning: Could not install dependencies"
# fi
# 
# # Run E2E tests
# if npm run test:e2e 2>/dev/null || npx playwright test 2>/dev/null; then
#   echo "[e2e] E2E tests passed"
#   exit 0
# else
#   # Check if error is "No tests found" (expected during initial setup)
#   if npx playwright test 2>&1 | grep -q "No tests found"; then
#     echo "[e2e] No E2E tests found (expected during initial setup)"
#     exit 0
#   fi
#   echo "[e2e] E2E tests failed"
#   exit 1
# fi
