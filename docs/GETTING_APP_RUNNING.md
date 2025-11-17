# Getting the App Running on localhost:3000

## Current Status

We've just completed implementing review workflow features. The app needs to be rebuilt and restarted to include these changes.

## Steps to Get App Running

### 1. Check Docker Container Status
```powershell
docker ps --filter "name=review-gui-frontend"
```

### 2. Rebuild Docker Image (Required - New Code Changes)
Since we've made changes to:
- Type definitions (`frontend/src/api/types.ts`)
- Components (`ReviewItem.ts`, `StatusUpdater.ts`, `NoteEditor.ts`)
- E2E tests

We need to rebuild the Docker image:

```powershell
docker-compose build frontend
```

### 3. Restart Container
```powershell
docker-compose up -d frontend
```

### 4. Verify Container is Running
```powershell
docker ps --filter "name=review-gui-frontend" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 5. Check Container Logs (if issues)
```powershell
docker logs review-gui-frontend --tail 50
```

### 6. Verify App is Accessible
- Open browser: http://localhost:3000
- Check browser console for errors
- Verify API connection to backend at http://localhost:8080

## Prerequisites

### Backend API Must Be Running
- Backend should be running on `http://localhost:8080`
- API key configured: `sb_test_RZbK4LCvhQm1kHMBPDXlT7BvNMIncEiH:read:notes,write:notes,read:review,write:review`

### Docker Must Be Running
- Docker Desktop should be running
- Port 3000 should not be in use by another service

## Quick Start Command

Run all steps at once:
```powershell
docker-compose build frontend && docker-compose up -d frontend && docker ps --filter "name=review-gui-frontend"
```

## Troubleshooting

### Container Won't Start
1. Check if port 3000 is in use: `netstat -ano | findstr :3000`
2. Check Docker logs: `docker logs review-gui-frontend`
3. Verify Docker is running: `docker ps`

### App Loads But Shows Errors
1. Check browser console (F12)
2. Verify backend is accessible: `curl http://localhost:8080/api/v1/health` (if endpoint exists)
3. Check network tab for failed API calls

### Build Fails
1. Check for TypeScript errors: `cd frontend && npm run build`
2. Verify all dependencies: `cd frontend && npm ci`
3. Check Docker build logs: `docker-compose build frontend --no-cache`

## What's New in This Build

The latest build includes:
- ✅ Review workflow type definitions
- ✅ Review workflow UI in ReviewItem (indicators)
- ✅ Review workflow form fields in StatusUpdater
- ✅ Review workflow form fields in NoteEditor
- ✅ All review workflow tests passing
- ✅ E2E test for review workflow

## Next Steps After App is Running

1. Test review workflow features:
   - View review indicators in review queue
   - Update status with review workflow fields
   - Edit note metadata with review workflow fields
   - Test batch operations with review workflow

2. Verify all features work:
   - Review queue loads
   - Filters work
   - Status updates work
   - Note editing works
   - Navigation works




