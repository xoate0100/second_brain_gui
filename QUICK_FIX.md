# Quick Fix for "Failed to fetch" Error

## The Problem

The frontend is now correctly configured to use `localhost:8080`, but the backend requires an API key for authentication.

## Solution: Set the API Key

### Option 1: Set API Key in Environment Variable (Recommended)

```powershell
# Windows PowerShell
$env:API_KEY="your-api-key-here"
docker-compose up -d --build frontend
```

### Option 2: Set in docker-compose.yml

Edit `docker-compose.yml` and set the API key:

```yaml
environment:
  - VITE_API_KEY=your-api-key-here  # Add your actual API key here
```

Then rebuild:
```bash
docker-compose up -d --build frontend
```

### Option 3: Create .env file (for local development)

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_KEY=your-api-key-here
```

## Verify It's Working

1. **Check the browser console** (F12) - should see API calls being made
2. **Check Network tab** - look for requests to `http://localhost:8080/api/v1/review/queue`
3. **Verify API key is sent** - in Network tab, check Request Headers for `X-API-Key`

## If You Still Get Errors

1. **Check backend is running**: `curl http://localhost:8080/api/v1/review/queue`
2. **Test with API key**: `curl -H "X-API-Key: your-key" http://localhost:8080/api/v1/review/queue`
3. **Check browser console** for specific error messages
4. **Check CORS** - backend should allow `http://localhost:3000` (already configured ✅)

## Current Status

✅ Frontend rebuilt with `localhost:8080`  
✅ CORS configured correctly  
⚠️ **API Key needs to be set** - this is likely the remaining issue
