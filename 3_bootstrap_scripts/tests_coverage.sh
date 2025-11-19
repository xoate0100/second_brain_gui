#!/usr/bin/env bash
set -euo pipefail
STATUS=0

# EARLY EXIT: If only documentation/config files changed, skip tests entirely
# This is a fast path for common commits
CHANGED_FILES=("$@")
if [ ${#CHANGED_FILES[@]} -eq 0 ]; then
  CHANGED_FILES=($(git diff --cached --name-only 2>/dev/null || true))
fi

# Fast path: Check if any code files changed
HAS_CODE_FILES=false
for file in "${CHANGED_FILES[@]}"; do
  # Skip non-code files
  if [[ "$file" =~ \.(md|yml|yaml|json|txt|sh|lock|log|svg|example|backup|gitkeep)$ ]] || \
     [[ "$file" =~ ^(docs/|\.git/|node_modules/|\.next/|dist/|build/|debug_logs/|root/|apps/) ]] || \
     [[ "$file" =~ (Dockerfile|nginx\.conf|docker-compose\.yml|\.pre-commit-config\.yaml)$ ]]; then
    continue
  fi
  # Check if it's a code file
  if [[ "$file" =~ \.(ts|tsx|js|jsx|py)$ ]] || [[ "$file" =~ (test_|_test\.|\.test\.|\.spec\.) ]]; then
    HAS_CODE_FILES=true
    break
  fi
done

# If no code files, exit immediately
if [ "$HAS_CODE_FILES" = false ]; then
  echo "[tests] No code files changed, skipping tests"
  exit 0
fi

# Load feature flags to get component-specific thresholds
load_thresholds() {
  if [ -f "0_phase0_bootstrap/feature_flags.yml" ]; then
    python3 <<EOF
import yaml, sys
try:
    with open("0_phase0_bootstrap/feature_flags.yml") as f:
        flags = yaml.safe_load(f)
    components = flags.get("components", {})
    gates = flags.get("gates", {})

    backend_threshold = components.get("backend", {}).get("coverage_threshold", 100)
    print(f"BACKEND_THRESHOLD={backend_threshold}")

    frontend_threshold = components.get("frontend", {}).get("coverage_threshold", 95)
    print(f"FRONTEND_THRESHOLD={frontend_threshold}")

    shared_threshold = components.get("shared", {}).get("coverage_threshold", 90)
    print(f"SHARED_THRESHOLD={shared_threshold}")

    BLOCK_ON_COVERAGE = gates.get("block_on_coverage_drop", true)
    print(f"BLOCK_ON_COVERAGE={str(BLOCK_ON_COVERAGE).lower()}")
except Exception as e:
    print("BACKEND_THRESHOLD=100", file=sys.stderr)
    print("FRONTEND_THRESHOLD=95")
    print("SHARED_THRESHOLD=90")
    print("BLOCK_ON_COVERAGE=true")
EOF
  else
    echo "BACKEND_THRESHOLD=100"
    echo "FRONTEND_THRESHOLD=95"
    echo "SHARED_THRESHOLD=90"
    echo "BLOCK_ON_COVERAGE=true"
  fi
}

eval $(load_thresholds)

# Determine which components need testing
NEED_BACKEND_TESTS=false
NEED_FRONTEND_TESTS=false
NEED_SHARED_TESTS=false

# Collect test files and source files for each component
BACKEND_TEST_FILES=()
BACKEND_SOURCE_FILES=()
FRONTEND_TEST_FILES=()
FRONTEND_SOURCE_FILES=()
SHARED_TEST_FILES=()
SHARED_SOURCE_FILES=()

# Analyze changed files - ONLY code files
for file in "${CHANGED_FILES[@]}"; do
  # Skip non-code files
  if [[ "$file" =~ \.(md|yml|yaml|json|txt|sh|lock|log|svg|example|backup|gitkeep)$ ]] || \
     [[ "$file" =~ ^(docs/|\.git/|node_modules/|\.next/|dist/|build/|debug_logs/|root/|apps/) ]]; then
    continue
  fi

  # Backend files
  if [[ "$file" =~ ^backend/ ]] && [[ "$file" =~ \.(py)$ ]]; then
    NEED_BACKEND_TESTS=true
    if [[ "$file" =~ (test_|_test\.py)$ ]]; then
      BACKEND_TEST_FILES+=("$file")
    else
      BACKEND_SOURCE_FILES+=("$file")
    fi
  fi

  # Frontend files - EXCLUDE E2E tests (they're Playwright, not vitest)
  if [[ "$file" =~ ^frontend/ ]] && [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]] && \
     [[ ! "$file" =~ ^frontend/e2e/ ]] && [[ ! "$file" =~ \.spec\.ts$ ]]; then
    NEED_FRONTEND_TESTS=true
    if [[ "$file" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
      FRONTEND_TEST_FILES+=("$file")
    else
      FRONTEND_SOURCE_FILES+=("$file")
    fi
  fi

  # Shared files
  if [[ "$file" =~ ^shared/ ]] && [[ "$file" =~ \.(ts|tsx|js|jsx|py)$ ]]; then
    NEED_SHARED_TESTS=true
    if [[ "$file" =~ (test_|_test\.py|\.(test|spec)\.(ts|tsx|js|jsx))$ ]]; then
      SHARED_TEST_FILES+=("$file")
    else
      SHARED_SOURCE_FILES+=("$file")
    fi
  fi
done

# Backend (pytest) - only if backend files changed
if [ "$NEED_BACKEND_TESTS" = true ] && [ -d "backend" ]; then
  echo "[tests] Backend: ${#BACKEND_TEST_FILES[@]} test files, ${#BACKEND_SOURCE_FILES[@]} source files"

  # Build pytest arguments - NO COVERAGE for speed
  PYTEST_ARGS=(-q --tb=short)

  # If we have specific test files, run only those
  if [ ${#BACKEND_TEST_FILES[@]} -gt 0 ]; then
    EXISTING_TESTS=()
    for test_file in "${BACKEND_TEST_FILES[@]}"; do
      if [ -f "$test_file" ]; then
        EXISTING_TESTS+=("$test_file")
      fi
    done

    if [ ${#EXISTING_TESTS[@]} -gt 0 ]; then
      PYTEST_ARGS+=("${EXISTING_TESTS[@]}")
    fi
  fi

  # If we have source files but no test files, try to find test files
  if [ ${#BACKEND_SOURCE_FILES[@]} -gt 0 ] && [ ${#EXISTING_TESTS[@]} -eq 0 ]; then
    # Skip - TDD guardrail will catch missing tests
    echo "[tests] Backend: No test files found for source changes (TDD guardrail will enforce)"
    NEED_BACKEND_TESTS=false
  fi

  if [ "$NEED_BACKEND_TESTS" = true ] && [ ${#PYTEST_ARGS[@]} -gt 2 ]; then
    if pytest "${PYTEST_ARGS[@]}" 2>/dev/null; then
      echo "[tests] Backend tests passed"
    else
      echo "[tests] Backend tests failed"
      STATUS=1
    fi
  fi
fi

# Frontend (vitest) - only if frontend files changed
if [ "$NEED_FRONTEND_TESTS" = true ] && [ -f "frontend/package.json" ]; then
  echo "[tests] Frontend: ${#FRONTEND_TEST_FILES[@]} test files, ${#FRONTEND_SOURCE_FILES[@]} source files"

  cd frontend

  # CRITICAL: Only install if package.json or package-lock.json actually changed
  # AND node_modules doesn't exist
  NEED_INSTALL=false
  PACKAGE_CHANGED=false

  for file in "${CHANGED_FILES[@]}"; do
    if [[ "$file" =~ frontend/package\.json$ ]] || [[ "$file" =~ frontend/package-lock\.json$ ]]; then
      PACKAGE_CHANGED=true
      break
    fi
  done

  if [ ! -d "node_modules" ]; then
    NEED_INSTALL=true
  elif [ "$PACKAGE_CHANGED" = true ]; then
    # Only install if package files actually changed
    NEED_INSTALL=true
  fi

  if [ "$NEED_INSTALL" = true ]; then
    echo "[tests] Installing frontend dependencies (package.json changed or node_modules missing)..."
    npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1 || true
  fi

  # Collect specific test files to run
  SPECIFIC_TEST_FILES=()

  # Add test files that were directly changed
  for file in "${FRONTEND_TEST_FILES[@]}"; do
    file=$(echo "$file" | sed 's|^frontend/||')
    if [ -f "$file" ]; then
      SPECIFIC_TEST_FILES+=("$file")
    fi
  done

  # Find test files for changed source files
  for source_file in "${FRONTEND_SOURCE_FILES[@]}"; do
    source_file=$(echo "$source_file" | sed 's|^frontend/||')
    base_name=$(basename "$source_file" | sed 's/\.[^.]*$//')
    dir=$(dirname "$source_file")

    # Check common test file patterns
    test_patterns=(
      "${dir}/${base_name}.test.ts"
      "${dir}/${base_name}.test.tsx"
      "${dir}/${base_name}.spec.ts"
      "${dir}/${base_name}.spec.tsx"
    )

    for test_pattern in "${test_patterns[@]}"; do
      if [ -f "$test_pattern" ]; then
        if [[ ! " ${SPECIFIC_TEST_FILES[@]} " =~ " ${test_pattern} " ]]; then
          SPECIFIC_TEST_FILES+=("$test_pattern")
        fi
        break
      fi
    done
  done

  # Run specific test files if found
  if [ ${#SPECIFIC_TEST_FILES[@]} -gt 0 ]; then
    echo "[tests] Running ${#SPECIFIC_TEST_FILES[@]} frontend test file(s)"
    # Use vitest with specific files - NO COVERAGE, NO WATCH
    if npx vitest run --reporter=dot "${SPECIFIC_TEST_FILES[@]}" 2>/dev/null; then
      echo "[tests] Frontend tests passed"
    else
      echo "[tests] Frontend tests failed"
      STATUS=1
    fi
  else
    # No test files found - TDD guardrail will catch this
    echo "[tests] Frontend: No test files found for source changes (TDD guardrail will enforce)"
  fi

  cd ..
fi

# Shared tests
if [ "$NEED_SHARED_TESTS" = true ] && [ -d "shared" ]; then
  echo "[tests] Shared: ${#SHARED_TEST_FILES[@]} test files, ${#SHARED_SOURCE_FILES[@]} source files"
  # Placeholder - implement based on shared test setup
fi

# If no relevant files changed, we already exited early
exit $STATUS
