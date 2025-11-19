# API Connection Troubleshooting

## Issue: `ERR_SOCKET_NOT_CONNECTED` in Browser

### Symptoms
- Browser shows `(failed)net::ERR_SOCKET_NOT_CONNECTED` for API requests
- Frontend cannot connect to backend API at `http://localhost:8080`
- curl connects but hangs (no response)

### Root Cause Analysis

#### 1. Backend is Running ✅
- Container `sb_python` is running and healthy
- Port 8080 is listening and accessible
- Network connectivity test succeeds

#### 2. Backend Has Errors ❌
Backend logs show critical errors:

**Error 1: DateTime Serialization Error**
```
TypeError: Object of type datetime is not JSON serializable
```
- Backend is trying to return datetime objects in JSON response
- Python's `json.dumps()` cannot serialize datetime objects
- This causes the response to fail, making requests hang

**Error 2: YAML Parsing Errors**
```
WARNING:src.core.review_workflow:Error reading Candidate-Evaluation-Summary-Setup-1.md:
while scanning a quoted scalar
found unexpected end of stream
```
- Backend is encountering malformed YAML in markdown files
- This may be causing processing delays or failures

### Why Browser Shows `ERR_SOCKET_NOT_CONNECTED`

The browser's fetch API is likely:
1. **Timing out** - Backend hangs due to serialization error
2. **Connection reset** - Backend crashes or closes connection
3. **CORS issue** - Though less likely given curl also hangs

### Verification Steps

#### Test 1: Check Backend Health
```powershell
# This should respond quickly
curl -m 5 http://localhost:8080/health
```

#### Test 2: Check Backend Logs
```powershell
docker logs sb_python --tail 50
```

#### Test 3: Test API Endpoint Directly
```powershell
curl -m 10 -v http://localhost:8080/api/v1/review/queue \
  -H "Authorization: Bearer sb_test_RZbK4LCvhQm1kHMBPDXlT7BvNMIncEiH:read:notes,write:notes,read:review,write:review"
```

### Backend Issues to Fix

#### Issue 1: DateTime Serialization
**Problem:** Backend returns datetime objects that can't be JSON serialized

**Solution (Backend):**
```python
# Need to convert datetime to string before JSON serialization
from datetime import datetime
import json

# Instead of:
return {"created_at": datetime.now()}

# Use:
return {"created_at": datetime.now().isoformat()}
# Or use a custom JSON encoder
```

#### Issue 2: YAML Parsing Errors
**Problem:** Malformed YAML in markdown files causing parsing failures

**Solution (Backend):**
- Add error handling for YAML parsing
- Skip or log problematic files
- Fix malformed YAML in source files

### Frontend Fetch Implementation

The frontend uses standard `fetch()` API:
```typescript
const response = await fetch(fullUrl, options);
```

**Current behavior:**
- No explicit timeout set
- Relies on browser default timeout (varies by browser)
- Error handling catches network errors

### Recommended Fixes

#### 1. Add Timeout to Frontend Fetch (Immediate)
Add timeout to prevent indefinite hanging:

```typescript
// In frontend/src/api/client.ts
private async request<T>(method: string, url: string, data?: unknown): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    // ... rest of implementation
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out after 30 seconds',
          details: {},
        },
      };
    }
    // ... existing error handling
  }
}
```

#### 2. Fix Backend DateTime Serialization (Required)
Backend needs to serialize datetime objects properly before returning JSON.

#### 3. Fix Backend YAML Parsing (Required)
Backend needs better error handling for malformed YAML files.

### Current Status

- ✅ Frontend container: Running
- ✅ Backend container: Running
- ✅ Network connectivity: Working
- ❌ Backend response: Failing (datetime serialization error)
- ❌ API requests: Hanging/timing out

### Next Steps

1. **Immediate:** Add timeout to frontend fetch to show proper error message
2. **Required:** Fix backend datetime serialization (backend developer)
3. **Required:** Fix backend YAML parsing errors (backend developer)
4. **Optional:** Add retry logic for transient failures

### Testing After Fixes

Once backend is fixed:
1. Test API endpoint with curl - should return JSON response
2. Test in browser - should see successful API calls
3. Verify review queue loads in UI
4. Test all review workflow features


