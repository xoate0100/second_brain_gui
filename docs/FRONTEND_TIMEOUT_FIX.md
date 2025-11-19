# Frontend Timeout and Error Handling Fix

## Issue
Browser shows `ERR_SOCKET_NOT_CONNECTED` when trying to connect to backend API. Backend requests hang indefinitely due to datetime serialization errors.

## Root Cause
1. **Backend Issue:** Backend has `TypeError: Object of type datetime is not JSON serializable` - cannot serialize datetime objects in API responses
2. **Frontend Issue:** No timeout on fetch requests, causing indefinite hanging
3. **Error Handling:** Generic error messages don't help diagnose connection issues

## Frontend Fixes Applied

### 1. Added 30-Second Timeout ✅
```typescript
// In frontend/src/api/client.ts
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

const response = await fetch(fullUrl, {
  ...options,
  signal: controller.signal,
});
```

**Benefits:**
- Prevents indefinite hanging
- Shows timeout error after 30 seconds
- Allows user to retry or see clear error message

### 2. Improved Error Handling ✅
```typescript
// Map specific error types to user-friendly messages
if (error.message.includes('Failed to fetch') || error.message.includes('ERR_SOCKET_NOT_CONNECTED')) {
  errorCode = 'CONNECTION_ERROR';
  errorMessage = 'Cannot connect to backend API. Please verify the backend is running on http://localhost:8080';
}
```

**Error Codes Added:**
- `TIMEOUT` - Request timed out after 30 seconds
- `CONNECTION_ERROR` - Cannot connect to backend (ERR_SOCKET_NOT_CONNECTED)
- `NETWORK_ERROR` - Network request failed
- `FETCH_ERROR` - Failed to make request

### 3. Better Error Messages ✅
- Clear, actionable error messages
- Specific guidance on what to check
- Original error preserved in details

## Testing

### Unit Tests
✅ All 12 tests passing in `frontend/src/api/client.test.ts`

### Manual Testing
1. **Test timeout:**
   - Stop backend: `docker stop sb_python`
   - Open http://localhost:3000
   - Should see timeout error after 30 seconds

2. **Test connection error:**
   - Backend running but not responding
   - Should see `CONNECTION_ERROR` with helpful message

3. **Test normal operation:**
   - Backend fixed and responding
   - Should work normally with timeout as safety net

## Backend Fix Required

The backend needs to fix datetime serialization:

**Error in Backend Logs:**
```
TypeError: Object of type datetime is not JSON serializable
```

**Fix Required:**
- Convert datetime objects to ISO format strings before JSON serialization
- Use Pydantic models with datetime serialization
- Or use custom JSON encoder

See `docs/BACKEND_DATETIME_SERIALIZATION_ISSUE.md` for details.

## Current Status

- ✅ **Frontend:** Timeout added (30 seconds)
- ✅ **Frontend:** Better error handling
- ✅ **Frontend:** Clear error messages
- ✅ **Frontend:** Tests passing
- ❌ **Backend:** DateTime serialization error (needs fix)
- ⏳ **Waiting:** Backend fix to resolve connection issues

## Next Steps

1. **Backend Developer:** Fix datetime serialization
2. **Test:** Verify API works after backend fix
3. **Verify:** Review queue loads successfully
4. **Monitor:** Check for any remaining connection issues

## Files Modified

- `frontend/src/api/client.ts` - Added timeout and improved error handling
- `docs/BACKEND_DATETIME_SERIALIZATION_ISSUE.md` - Backend issue documentation
- `docs/API_CONNECTION_TROUBLESHOOTING.md` - Troubleshooting guide


