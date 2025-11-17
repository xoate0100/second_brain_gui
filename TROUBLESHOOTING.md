# Troubleshooting Guide

## Common Issues and Solutions

### Error: "Failed to fetch" or "Error loading review queue"

#### Issue 1: API URL Configuration
**Problem**: Frontend was built with `host.docker.internal:8080` which browsers can't resolve.

**Solution**: ✅ **FIXED** - Frontend now uses `localhost:8080` since the browser runs on the host.

#### Issue 2: Missing API Key
**Problem**: Backend requires authentication via `X-API-Key` header.

**Solution**: Set the API key in environment variables:
```bash
# For Docker
export API_KEY=your-api-key-here
docker-compose up -d --build frontend

# Or in docker-compose.yml, set:
# environment:
#   - VITE_API_KEY=${API_KEY:-your-default-key}
```

#### Issue 3: CORS Errors
**Status**: ✅ **CONFIGURED** - Backend allows requests from `http://localhost:3000`

If you see CORS errors, verify:
- Backend CORS settings allow `http://localhost:3000`
- Backend CORS settings allow `http://localhost:5173` (for local dev)

#### Issue 4: Backend Not Running
**Check**: Verify backend is accessible:
```bash
curl http://localhost:8080/api/v1/review/queue
```

Expected: Authentication error (means backend is running)
If connection refused: Backend is not running

### Testing the Connection

1. **Test backend directly**:
   ```bash
   curl http://localhost:8080/api/v1/review/queue
   ```

2. **Test from browser console** (on localhost:3000):
   ```javascript
   fetch('http://localhost:8080/api/v1/review/queue', {
     headers: { 'X-API-Key': 'your-api-key' }
   })
   ```

3. **Check browser network tab**:
   - Open DevTools → Network tab
   - Look for requests to `/api/v1/review/queue`
   - Check the request URL, headers, and response

### Current Configuration

- **Frontend URL**: http://localhost:3000
- **Backend API URL**: http://localhost:8080
- **API Key**: Set via `VITE_API_KEY` environment variable
- **CORS**: Configured to allow `http://localhost:3000`

### Next Steps if Still Having Issues

1. **Check browser console** for specific error messages
2. **Check network tab** to see the actual request being made
3. **Verify API key** is set correctly
4. **Test backend directly** with curl to confirm it's working
5. **Check backend logs** in SecondBrain project for any errors
