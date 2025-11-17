# Test Optimization - Incremental Test Execution

## Problem Statement

The pre-commit hook for tests and coverage was running ALL tests for the entire codebase on every commit, regardless of which files were changed. This caused:
- **Slow commit times** (minutes instead of seconds)
- **Unnecessary test execution** for unchanged code
- **Poor developer experience** during rapid iteration

## Solution

The test coverage hook has been optimized to:
1. **Only run tests for changed files** - Analyzes staged files and runs corresponding tests
2. **Map source files to test files** - Automatically finds test files for changed source code
3. **Skip dependency installation** - Only runs `npm ci` if `package.json` changed or `node_modules` missing
4. **Component-aware testing** - Only tests backend/frontend/shared if files in those components changed

## Implementation Details

### Pre-commit Configuration

The hook now receives changed filenames:
```yaml
- id: tests-and-coverage
  name: Tests & Coverage
  entry: 3_bootstrap_scripts/tests_coverage.sh
  language: system
  pass_filenames: true  # ← Receives list of changed files
  require_serial: true # ← Ensures tests run sequentially
```

### Test File Discovery

The script automatically finds test files using common patterns:

**TypeScript/JavaScript:**
- `src/components/Button.ts` → `src/components/Button.test.ts`
- `src/api/client.ts` → `src/api/client.spec.ts`
- `src/services/state.ts` → `tests/services/state.test.ts`

**Python:**
- `backend/models/user.py` → `backend/tests/test_user.py`
- `backend/services/auth.py` → `backend/tests/auth_test.py`

### Smart Test Execution

1. **File Analysis**: Analyzes changed files to determine:
   - Which components need testing (backend/frontend/shared)
   - Which test files correspond to changed source files
   - Whether dependencies need installation

2. **Selective Execution**:
   - **Backend**: Runs pytest only for changed modules or their test files
   - **Frontend**: Uses vitest's pattern matching to run tests for changed files
   - **Shared**: Runs tests only if shared code changed

3. **Dependency Optimization**:
   - Skips `npm ci` if:
     - `node_modules` exists AND
     - `package.json` and `package-lock.json` haven't changed
   - Only installs when necessary

### Example Scenarios

#### Scenario 1: Single File Change
```bash
# Changed: frontend/src/components/Button.ts
# Result: Only runs Button.test.ts (if exists) or tests in components directory
```

#### Scenario 2: Multiple Files, Same Component
```bash
# Changed:
#   - frontend/src/api/client.ts
#   - frontend/src/api/types.ts
# Result: Runs all tests in frontend/src/api/ directory
```

#### Scenario 3: Test File Only
```bash
# Changed: frontend/src/components/Button.test.ts
# Result: Only runs Button.test.ts
```

#### Scenario 4: Config File Change
```bash
# Changed: frontend/package.json
# Result:
#   - Installs dependencies (npm ci)
#   - Runs all frontend tests (config change might affect everything)
```

#### Scenario 5: Documentation Only
```bash
# Changed: docs/README.md
# Result: Skips tests entirely (no code files changed)
```

## Performance Improvements

### Before Optimization
- **Time**: 2-5 minutes per commit
- **Tests Run**: All tests (1000+)
- **Coverage**: Always calculated (slow)
- **Dependencies**: Always reinstalled

### After Optimization (v1)
- **Time**: 5-30 seconds per commit (typical)
- **Tests Run**: Only relevant tests (10-50)
- **Coverage**: Still calculated (slower than needed)
- **Dependencies**: Installed only when needed

### After Optimization (v2 - Current)
- **Time**: 2-10 seconds per commit (typical)
- **Tests Run**: Only specific test files (1-10)
- **Coverage**: **SKIPPED** for incremental runs (major speedup)
- **Dependencies**: Installed only when needed
- **Test Discovery**: Precise file matching, no glob patterns

### Speedup Factors
- **30-150x faster** for typical commits (single file changes)
- **10-30x faster** for multi-file changes
- **Instant** for documentation/config-only changes
- **Coverage runs**: Moved to CI/CD or manual `npm run test:coverage`

## Edge Cases Handled

1. **No Test File Found**: Runs tests in the same directory or parent test directory
2. **Test File Changed**: Runs that specific test file
3. **Package.json Changed**: Runs all tests (config changes might affect everything)
4. **No Code Files Changed**: Skips tests entirely
5. **New Files**: Attempts to find corresponding test files, falls back to directory tests

## Configuration

Test behavior can be configured in `0_phase0_bootstrap/feature_flags.yml`:

```yaml
components:
  frontend:
    coverage_threshold: 95
  backend:
    coverage_threshold: 100
  shared:
    coverage_threshold: 90

gates:
  block_on_coverage_drop: true
```

## Best Practices

1. **Keep test files close to source files** - Makes discovery faster
2. **Use standard naming conventions** - `.test.ts`, `_test.py`, etc.
3. **Group related tests** - Tests in same directory run together
4. **Update tests with code** - TDD ensures tests exist for new code

## Troubleshooting

### Tests Not Running
- Check that changed files match code file patterns (`.ts`, `.py`, etc.)
- Verify test files follow naming conventions
- Check hook output for skipped reasons

### Wrong Tests Running
- Review file patterns in script
- Check if test file discovery logic needs adjustment
- Verify `pass_filenames: true` in pre-commit config

### Still Too Slow
- Check if dependencies are being reinstalled unnecessarily
- Verify test file discovery isn't scanning too many directories
- Consider further optimization for your specific codebase structure

## Future Enhancements

Potential improvements:
1. **Test dependency graph** - Only run tests affected by changed code
2. **Parallel test execution** - Run backend and frontend tests in parallel
3. **Test result caching** - Skip tests if code and dependencies unchanged
4. **Incremental coverage** - Calculate coverage only for changed files

## Related Documentation

- `1_global_standards/TEST_STRATEGY_TDD.md` - TDD methodology
- `0_phase0_bootstrap/AI_SANDBOX_RULES.md` - TDD requirements
- `.pre-commit-config.yaml` - Full hook configuration
