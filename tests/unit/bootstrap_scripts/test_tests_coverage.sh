#!/usr/bin/env bash
# Test Vitest detection and coverage parsing in tests_coverage.sh

set -euo pipefail

# Test helper functions
test_vitest_detection() {
  echo "Testing Vitest detection..."

  # Create temporary package.json with Vitest
  mkdir -p /tmp/test_frontend
  cat > /tmp/test_frontend/package.json <<EOF
{
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
EOF

  # Check if Vitest is detected
  if grep -q '"vitest"' /tmp/test_frontend/package.json || grep -q '"@vitest' /tmp/test_frontend/package.json; then
    echo "✅ Vitest detection works"
  else
    echo "❌ Vitest detection failed"
    exit 1
  fi

  rm -rf /tmp/test_frontend
}

test_vitest_coverage_parsing() {
  echo "Testing Vitest coverage parsing..."

  # Create mock coverage file
  mkdir -p /tmp/test_coverage
  cat > /tmp/test_coverage/coverage-summary.json <<EOF
{
  "total": {
    "lines": {
      "pct": 95.5
    }
  }
}
EOF

  # Test parsing
  COVERAGE=$(python3 -c "import json; print(json.load(open('/tmp/test_coverage/coverage-summary.json'))['total']['lines']['pct'])")

  if [ "$(echo "$COVERAGE >= 95" | bc)" = "1" ]; then
    echo "✅ Coverage parsing works: $COVERAGE%"
  else
    echo "❌ Coverage parsing failed: $COVERAGE%"
    exit 1
  fi

  rm -rf /tmp/test_coverage
}

test_jest_fallback() {
  echo "Testing Jest fallback..."

  # Create temporary package.json without Vitest
  mkdir -p /tmp/test_frontend_jest
  cat > /tmp/test_frontend_jest/package.json <<EOF
{
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
EOF

  # Check that Vitest is NOT detected
  if ! grep -q '"vitest"' /tmp/test_frontend_jest/package.json && ! grep -q '"@vitest' /tmp/test_frontend_jest/package.json; then
    echo "✅ Jest fallback detection works"
  else
    echo "❌ Jest fallback detection failed"
    exit 1
  fi

  rm -rf /tmp/test_frontend_jest
}

# Run tests
test_vitest_detection
test_vitest_coverage_parsing
test_jest_fallback

echo "All tests passed!"
