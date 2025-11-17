# Environment Variable Analysis - CTQ & Gap Analysis

## Critical to Quality (CTQ) Requirements

### CTQ1: API Key Must Be Embedded at Build Time
- **Requirement**: API key must be available in built JavaScript bundle
- **Current State**: ❌ API key is NOT embedded (warning shows in browser)
- **Impact**: High - Authentication fails, API calls fail

### CTQ2: Correct API URL Must Be Embedded
- **Requirement**: API URL must be `http://localhost:8080` (not host.docker.internal:8000)
- **Current State**: ❌ Wrong URL embedded (`http://host.docker.internal:8000`)
- **Impact**: High - API calls go to wrong endpoint

### CTQ3: Environment Variables Must Persist in Container
- **Requirement**: Built files must contain correct values regardless of runtime env
- **Current State**: ⚠️ Runtime env vars exist but don't affect built files
- **Impact**: Medium - Confusion, but not blocking

## Root Cause Analysis

### Gap 1: Vite Environment Variable Handling
**Expected**: Environment variables embedded at build time
**Actual**: Variables may not be available during build
**Root Cause**:
- Vite only embeds `VITE_*` variables available when `npm run build` runs
- Docker build args must be converted to ENV before build step
- Environment variables in docker-compose.yml `environment:` section are RUNTIME only (useless for Vite)

### Gap 2: Environment Variable Override
**Expected**: docker-compose.yml defaults should be used
**Actual**: Shell environment variables override docker-compose defaults
**Root Cause**:
- `${VITE_API_BASE_URL:-http://localhost:8080}` uses shell env if set
- User's shell has `VITE_API_BASE_URL=http://host.docker.internal:8000` set
- This overrides the docker-compose default

### Gap 3: Build vs Runtime Confusion
**Expected**: Clear separation between build-time and runtime config
**Actual**: Runtime env vars in docker-compose.yml don't affect Vite builds
**Root Cause**:
- Vite embeds env vars at BUILD time (when `npm run build` runs)
- Runtime env vars in container are irrelevant for Vite
- Documentation doesn't clearly explain this

## Current State Analysis

### Build-Time Configuration (What Vite Sees)
```
ARG VITE_API_BASE_URL=http://localhost:8080  # Dockerfile default
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL      # Converted to ENV
ARG VITE_API_KEY                              # From docker-compose build args
ENV VITE_API_KEY=$VITE_API_KEY                # Converted to ENV
```

**Problem**: If shell has `VITE_API_BASE_URL` set, docker-compose uses that instead of default.

### Runtime Configuration (What Container Has)
```
VITE_API_BASE_URL=http://host.docker.internal:8000  # Wrong, but irrelevant
VITE_API_KEY=sb_test_...                            # Correct, but irrelevant
```

**Problem**: These are runtime-only, Vite already embedded values at build time.

### Built JavaScript (What Browser Sees)
```javascript
const apiBaseUrl = "http://host.docker.internal:8000"  // ❌ WRONG
const apiKey = ""                                       // ❌ EMPTY
```

**Problem**: Wrong URL and empty API key embedded in bundle.

## Comprehensive Fix Strategy

### Fix 1: Remove Environment Variable Override
- Remove `${VITE_API_BASE_URL:-...}` pattern
- Use hardcoded defaults in docker-compose.yml
- Ensure no shell env vars interfere

### Fix 2: Ensure Build Args Are Properly Passed
- Verify ARG → ENV conversion in Dockerfile
- Add validation during build
- Ensure Vite sees the variables

### Fix 3: Add Build Verification
- Check built files contain correct values
- Fail build if values are wrong
- Add debugging output

### Fix 4: Clean Environment
- Remove conflicting shell env vars
- Use explicit values in docker-compose.yml
- Document the correct approach

## Implementation Plan

1. ✅ Update docker-compose.yml to use explicit values (no env var substitution)
2. ✅ Update Dockerfile to ensure proper ARG → ENV conversion
3. ✅ Add build verification step
4. ✅ Clean build and verify embedded values
5. ✅ Document the correct approach
