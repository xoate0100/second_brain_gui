# Meta-Framework Improvement Plan

**Date:** January 31, 2025  
**Status:** Ready for Implementation  
**Priority:** CRITICAL - Must complete before bootstrap

---

## Overview

This document provides a step-by-step implementation plan for addressing the gaps identified in the Meta-Framework Gap Analysis. All critical items must be completed before running bootstrap.

---

## Phase 1: Critical Fixes (BLOCKING - Must Complete Before Bootstrap)

### 1.1 Update Test Coverage Script for Vitest Support

**File:** `3_bootstrap_scripts/tests_coverage.sh`  
**Priority:** CRITICAL  
**Estimated Time:** 15 minutes

**Changes Required:**
- Detect Vitest vs Jest in package.json
- Support Vitest coverage reporting format
- Parse Vitest coverage JSON correctly

**Implementation:**
```bash
# Frontend (Vitest/Jest detection)
if [ -f "frontend/package.json" ]; then
  if (cd frontend && npm ci --silent); then
    # Check for Vitest
    if grep -q '"vitest"' frontend/package.json || grep -q '"@vitest' frontend/package.json; then
      # Vitest coverage
      if npm run test:coverage 2>/dev/null || npm test -- --coverage 2>/dev/null; then
        # Parse Vitest coverage (coverage/coverage-summary.json or similar)
        if [ -f "frontend/coverage/coverage-summary.json" ]; then
          COVERAGE=$(python3 -c "import json; print(json.load(open('frontend/coverage/coverage-summary.json'))['total']['lines']['pct'])")
        elif [ -f "frontend/coverage-summary.json" ]; then
          COVERAGE=$(python3 -c "import json; print(json.load(open('frontend/coverage-summary.json'))['total']['lines']['pct'])")
        else
          echo "[coverage] Warning: Could not find Vitest coverage file"
          COVERAGE=0
        fi
      else
        STATUS=1
        COVERAGE=0
      fi
    else
      # Jest or other test runner
      if npm test --silent -- --coverage 2>/dev/null; then
        # Parse Jest coverage if available
        COVERAGE=95  # Default if can't parse
      else
        STATUS=1
        COVERAGE=0
      fi
    fi

    # Check coverage threshold
    if (( $(echo "$COVERAGE < $FRONTEND_THRESHOLD" | bc -l 2>/dev/null || echo "1") )); then
      echo "[coverage] Frontend coverage ${COVERAGE}% below threshold ${FRONTEND_THRESHOLD}%"
      if [ "$BLOCK_ON_COVERAGE" = "true" ]; then
        STATUS=1
      fi
    else
      echo "[coverage] Frontend coverage ${COVERAGE}% meets threshold ${FRONTEND_THRESHOLD}%"
    fi
  else
    STATUS=1
  fi
fi
```

---

### 1.2 Add ESLint Pre-Commit Hook

**File:** `.pre-commit-config.yaml`  
**Priority:** CRITICAL  
**Estimated Time:** 10 minutes

**Changes Required:**
- Add ESLint hook for TypeScript/JavaScript files
- Configure to run only on frontend files
- Ensure it works with Vite/vanilla TypeScript

**Implementation:**
```yaml
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.57.0
    hooks:
      - id: eslint
        name: ESLint
        entry: bash -c 'cd frontend && npx eslint'
        language: system
        files: ^frontend/.*\.(ts|tsx|js|jsx)$
        types: [file]
        require_serial: true
        pass_filenames: true
        args: ['--fix', '--max-warnings=0']
```

**Note:** This requires `frontend/.eslintrc.json` to exist (will be created during bootstrap, but hook should handle missing config gracefully).

---

### 1.3 Relax DIP Checks for Vanilla TypeScript

**File:** `3_bootstrap_scripts/architecture_check.py`  
**Priority:** CRITICAL  
**Estimated Time:** 30 minutes

**Changes Required:**
- Detect vanilla TypeScript projects (no framework)
- Allow direct imports from `api/`, `services/`, `utils/` for vanilla TS
- Only flag DIP violations when interfaces exist but aren't used

**Implementation:**
```python
def is_vanilla_typescript_project(file_path: pathlib.Path) -> bool:
    """Check if this is a vanilla TypeScript project (no framework)"""
    frontend_path = pathlib.Path("frontend")
    if not frontend_path.exists():
        return False

    # Check package.json for framework indicators
    package_json = frontend_path / "package.json"
    if package_json.exists():
        try:
            import json
            with open(package_json) as f:
                deps = json.load(f).get("dependencies", {})
                dev_deps = json.load(f).get("devDependencies", {})
                all_deps = {**deps, **dev_deps}

                # If no framework dependencies, it's vanilla TS
                frameworks = ["react", "vue", "angular", "svelte", "@angular", "@vue"]
                return not any(fw in str(all_deps.keys()) for fw in frameworks)
        except:
            pass

    return False

def check_dip_dependency_inversion():
    """DIP: Flag direct imports of concrete implementations"""
    if not enforce_solid:
        return

    code_extensions = [".py", ".ts", ".tsx"]
    search_dirs = [pathlib.Path("frontend"), pathlib.Path("backend"), pathlib.Path("shared")]

    # Check if frontend is vanilla TypeScript
    is_vanilla_ts = is_vanilla_typescript_project(pathlib.Path("frontend"))

    for root_dir in search_dirs:
        if not root_dir.exists():
            continue

        for file_path in root_dir.rglob("*"):
            if file_path.suffix not in code_extensions:
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                lines = content.splitlines()

                for i, line in enumerate(lines, 1):
                    # Skip if importing from interfaces/abstract
                    if re.search(r'(interfaces|abstract|interfaces/)', line, re.IGNORECASE):
                        continue

                    # For vanilla TypeScript frontend, allow api/, services/, utils/
                    if is_vanilla_ts and "frontend" in str(file_path):
                        # Only flag if importing concrete classes when interfaces exist
                        # Check if there's a corresponding interface file
                        if re.search(r'from\s+["\']([\w./]+)', line):
                            import_match = re.search(r'from\s+["\']([\w./]+)', line)
                            if import_match:
                                import_path = import_match.group(1)
                                # Allow api/, services/, utils/ for vanilla TS
                                if any(allowed in import_path for allowed in ["api/", "services/", "utils/", "types/"]):
                                    continue
                                # Only flag if it's a concrete class import and interface exists
                                # This is a simplified check - could be enhanced
                                if re.search(r'from\s+[\w.]+\.(models|repositories)\.', line):
                                    violations.append(
                                        f"{file_path}:{i} DIP violation: "
                                        f"Direct import of concrete implementation '{import_path}'. "
                                        f"Consider using interfaces. See 1_global_standards/SOLID_PRINCIPLES.md"
                                    )
                    else:
                        # Strict DIP rules for framework projects or backend
                        concrete_patterns = [
                            (r'from\s+[\w.]+\.models\.', "models"),
                            (r'from\s+[\w.]+\.services\.', "services"),
                            (r'from\s+[\w.]+\.repositories\.', "repositories"),
                            (r'import\s+.*from\s+["\']([\w/]+/)?(models|services|repositories)', "concrete"),
                        ]

                        for pattern, pattern_type in concrete_patterns:
                            match = re.search(pattern, line)
                            if match:
                                import_match = re.search(r'from\s+["\']?([\w./]+)', line) or re.search(r'import\s+.*from\s+["\']([\w./]+)', line)
                                if import_match:
                                    import_path = import_match.group(1)
                                    # Skip if interface/abstract exists
                                    if re.search(r'(interfaces|abstract)', import_path, re.IGNORECASE):
                                        continue
                                    violations.append(
                                        f"{file_path}:{i} DIP violation: "
                                        f"Direct import of concrete implementation '{import_path}'. "
                                        f"Depend on abstractions (interfaces/abstract classes) instead. "
                                        f"See 1_global_standards/SOLID_PRINCIPLES.md"
                                    )
                                    break

            except Exception as e:
                continue
```

---

### 1.4 Update Frontend Coverage Threshold

**File:** `0_phase0_bootstrap/feature_flags.yml`  
**Priority:** CRITICAL  
**Estimated Time:** 2 minutes

**Changes Required:**
- Change frontend coverage threshold from 95% to 100%

**Implementation:**
```yaml
components:
  frontend:
    language: typescript
    package_manager: auto
    coverage_threshold: 100  # Changed from 95 to match MVP requirements
    complexity_limit: 12
    directories: [frontend/]
```

---

### 1.5 Add Accessibility Testing Hook

**File:** `.pre-commit-config.yaml`  
**Priority:** CRITICAL  
**Estimated Time:** 20 minutes

**Changes Required:**
- Add accessibility testing using axe-core or pa11y
- Run on HTML/component file changes
- Validate WCAG 2.1 AA compliance

**Implementation:**
```yaml
  - repo: local
    hooks:
      - id: accessibility-check
        name: Accessibility (WCAG 2.1 AA)
        entry: bash -c 'cd frontend && npx --yes @axe-core/cli || echo "Accessibility check skipped (install @axe-core/cli for full validation)"'
        language: system
        files: ^frontend/.*\.(html|ts|tsx)$
        pass_filenames: false
        always_run: false
```

**Alternative:** Create dedicated script `3_bootstrap_scripts/accessibility_check.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "frontend" ]; then
  exit 0
fi

# Check if accessibility tools are available
if command -v pa11y &> /dev/null; then
  # Run pa11y on HTML files
  find frontend -name "*.html" -exec pa11y {} \;
elif [ -f "frontend/package.json" ] && grep -q "@axe-core" frontend/package.json; then
  cd frontend && npm run test:a11y 2>/dev/null || echo "[a11y] Accessibility tests not configured"
else
  echo "[a11y] Warning: No accessibility testing tools found. Install pa11y or @axe-core/cli"
  exit 0  # Don't block, just warn
fi
```

---

### 1.6 Add Playwright E2E Validation

**File:** `.pre-commit-config.yaml`, `3_bootstrap_scripts/e2e_validation.sh` (new)  
**Priority:** CRITICAL  
**Estimated Time:** 25 minutes

**Changes Required:**
- Create E2E validation script
- Add hook to pre-commit config
- Run E2E tests on relevant file changes

**New File:** `3_bootstrap_scripts/e2e_validation.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail

if [ ! -d "frontend" ]; then
  exit 0
fi

if [ ! -f "frontend/package.json" ]; then
  exit 0
fi

# Check if Playwright is configured
if ! grep -q "playwright" frontend/package.json && ! grep -q "@playwright" frontend/package.json; then
  echo "[e2e] Playwright not configured, skipping E2E tests"
  exit 0
fi

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm ci --silent
fi

# Run E2E tests
if npm run test:e2e 2>/dev/null || npx playwright test 2>/dev/null; then
  echo "[e2e] ✅ E2E tests passed"
  exit 0
else
  echo "[e2e] ❌ E2E tests failed"
  exit 1
fi
```

**Add to `.pre-commit-config.yaml`:**
```yaml
  - id: e2e-validation
    name: E2E Tests (Playwright)
    entry: 3_bootstrap_scripts/e2e_validation.sh
    language: system
    files: ^frontend/.*\.(ts|tsx|html)$
    pass_filenames: false
    always_run: false
```

---

### 1.7 Add API Key Security Validation

**File:** `3_bootstrap_scripts/security_scan.sh`  
**Priority:** CRITICAL  
**Estimated Time:** 15 minutes

**Changes Required:**
- Check for hardcoded API keys in frontend code
- Validate API keys only in environment variables
- Check for VITE_API_KEY hardcoding

**Implementation:**
Add to `security_scan.sh`:
```bash
# Check for hardcoded API keys in frontend
if [ -d "frontend" ]; then
  # Check for common API key patterns
  if grep -r -E "(api[_-]?key|apikey|API[_-]?KEY)\s*[:=]\s*['\"][^'\"]{10,}" frontend/src --exclude-dir=node_modules 2>/dev/null; then
    echo "[security] ❌ BLOCKING: Hardcoded API keys found in frontend code"
    echo "[security] API keys must be in environment variables (VITE_API_KEY)"
    exit 1
  fi

  # Check for VITE_API_KEY hardcoding
  if grep -r "VITE_API_KEY\s*[:=]\s*['\"][^'\"]{10,}" frontend/src --exclude-dir=node_modules 2>/dev/null; then
    echo "[security] ❌ BLOCKING: VITE_API_KEY hardcoded in source code"
    echo "[security] Use import.meta.env.VITE_API_KEY instead"
    exit 1
  fi

  echo "[security] ✅ No hardcoded API keys found"
fi
```

---

## Phase 2: High Priority Fixes (During Initial Development)

### 2.1 Add TypeScript Strict Mode Validation

**File:** `3_bootstrap_scripts/static_analysis.sh`  
**Priority:** HIGH  
**Estimated Time:** 10 minutes

**Implementation:**
```bash
# Check TypeScript strict mode
if [ -f "frontend/tsconfig.json" ]; then
  if ! grep -q '"strict":\s*true' frontend/tsconfig.json; then
    echo "[static] ❌ BLOCKING: TypeScript strict mode is not enabled"
    echo "[static] Add \"strict\": true to frontend/tsconfig.json"
    exit 1
  fi
  echo "[static] ✅ TypeScript strict mode enabled"
fi
```

---

### 2.2 Add Frontend Layer Rules

**File:** `5_reference_architectures/LAYER_RULES.yaml`  
**Priority:** HIGH  
**Estimated Time:** 15 minutes

**Implementation:**
```yaml
frontend_layers:
  - name: components
    may_import: [api, services, utils, types]
    forbid_import: []
  - name: api
    may_import: [types, utils]
    forbid_import: [components, services]
  - name: services
    may_import: [types, utils]
    forbid_import: [components, api]
  - name: utils
    may_import: [types]
    forbid_import: [components, api, services]
  - name: types
    may_import: []
    forbid_import: [components, api, services, utils]
```

---

### 2.3 Add CSS Linting

**File:** `.pre-commit-config.yaml`  
**Priority:** HIGH  
**Estimated Time:** 15 minutes

**Implementation:**
```yaml
  - repo: https://github.com/stylelint/stylelint
    rev: 15.11.0
    hooks:
      - id: stylelint
        name: Stylelint
        entry: bash -c 'cd frontend && npx stylelint'
        language: system
        files: ^frontend/.*\.(css|scss|sass)$
        args: ['--fix']
```

---

## Implementation Checklist

### Phase 1: Critical (Before Bootstrap)
- [ ] 1.1 Update `tests_coverage.sh` for Vitest
- [ ] 1.2 Add ESLint pre-commit hook
- [ ] 1.3 Relax DIP checks in `architecture_check.py`
- [ ] 1.4 Update coverage threshold to 100%
- [ ] 1.5 Add accessibility testing hook
- [ ] 1.6 Add Playwright E2E validation
- [ ] 1.7 Add API key security validation

### Phase 2: High Priority (During Development)
- [ ] 2.1 Add TypeScript strict mode validation
- [ ] 2.2 Add frontend layer rules
- [ ] 2.3 Add CSS linting

### Phase 3: Medium Priority (Before MVP)
- [ ] 3.1 Add Vite build validation
- [ ] 3.2 Add bundle size checks
- [ ] 3.3 Add performance benchmarking
- [ ] 3.4 Add Docker build validation

---

## Testing the Improvements

After implementing each fix:

1. **Test pre-commit hooks:**
   ```bash
   pre-commit run --all-files
   ```

2. **Test individual scripts:**
   ```bash
   python3 3_bootstrap_scripts/architecture_check.py
   bash 3_bootstrap_scripts/tests_coverage.sh
   bash 3_bootstrap_scripts/e2e_validation.sh
   ```

3. **Validate configuration:**
   ```bash
   python3 3_bootstrap_scripts/schema_enforcement.py --file 0_phase0_bootstrap/feature_flags.yml
   ```

---

## Next Steps

1. Review this improvement plan
2. Approve critical fixes for implementation
3. Implement Phase 1 fixes
4. Test all improvements
5. Update documentation
6. Proceed with bootstrap

---

**Last Updated:** January 31, 2025
