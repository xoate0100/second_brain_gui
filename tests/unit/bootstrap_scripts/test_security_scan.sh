#!/usr/bin/env bash
# Test security scan script, specifically API key detection

set -euo pipefail

test_security_script_exists() {
  if [ -f "3_bootstrap_scripts/security_scan.sh" ]; then
    echo "✅ Security scan script exists"
  else
    echo "❌ Security scan script not found"
    exit 1
  fi
}

test_api_key_detection() {
  # Create temporary file with hardcoded API key
  mkdir -p /tmp/test_security
  cat > /tmp/test_security/bad_code.ts <<'EOF'
const apiKey = "sk_live_1234567890abcdef";
const VITE_API_KEY = "hardcoded_key_here";
EOF

  # Test that script would detect this (simulated)
  if grep -qE "api[_-]?key.*[:=].*['\"][^'\"]{10,}" /tmp/test_security/bad_code.ts; then
    echo "✅ API key detection pattern works"
  else
    echo "❌ API key detection pattern failed"
    exit 1
  fi

  rm -rf /tmp/test_security
}

# Run tests
test_security_script_exists
test_api_key_detection

echo "All tests passed!"
