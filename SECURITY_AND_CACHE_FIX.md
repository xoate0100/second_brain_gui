# Security & Browser Cache Fix

## Security Status

### ⚠️ Current Approach: NOT SECURE FOR PRODUCTION

**The API key in `config.js` is publicly visible** - anyone can access `http://localhost:3000/config.js` and see your API key.

### ✅ Acceptable for Development/Localhost

For **development on localhost only**, this is acceptable because:
- Only accessible on your local machine
- Not exposed to the internet
- Easy to debug

### 🔒 Security Measures Implemented

1. ✅ Added `frontend/public/config.js` to `.gitignore` - won't be committed
2. ✅ Created `config.js.example` as a template
3. ✅ Added security warnings in config.js file
4. ✅ Documented security concerns

### 📋 For Production (Future)

**DO NOT use this approach in production.** Instead:
- Use backend proxy (frontend → your backend → API with key)
- Use OAuth/JWT tokens (user authenticates, gets short-lived tokens)
- Never expose API keys to client-side code

## Browser Cache Issue

The wrong URL (`http://host.docker.internal:8000`) is still appearing because **your browser is using cached JavaScript**.

### Solution: Clear Browser Cache

**Option 1: Hard Refresh (Recommended)**
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Safari**: `Cmd + Shift + R`

**Option 2: Clear Cache Completely**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option 3: Disable Cache (Development)**
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while testing

**Option 4: Incognito/Private Window**
- Open http://localhost:3000 in incognito/private mode
- This uses a fresh cache

## Verification Steps

After clearing cache:

1. **Open http://localhost:3000**
2. **Open DevTools Console (F12)**
3. **Check for these messages**:
   ```
   [Config] Using runtime config from config.js
   ✅ API key loaded: sb_test_RZbK4LCvhQm1k...
   ✅ API Base URL: http://localhost:8080
   ```

4. **Verify config object**:
   ```javascript
   console.log(window.__APP_CONFIG__);
   // Should show: { apiBaseUrl: 'http://localhost:8080', apiKey: '...', ... }
   ```

5. **Check Network tab**:
   - Look for requests to `/api/v1/review/queue`
   - Should go to: `http://localhost:8080/api/v1/review/queue`
   - Should NOT go to: `http://host.docker.internal:8000/api/v1/review/queue`
   - Should include header: `Authorization: Bearer sb_test_...`

## Current Container Status

✅ Container running and healthy  
✅ config.js file accessible at `/config.js`  
✅ HTML includes config.js script tag  
✅ Built files don't contain `host.docker.internal:8000`  
✅ API key and URL configured correctly  

**The issue is browser cache - you need to clear it!**

## Quick Fix Command

If you want to verify the container is serving the right files:

```bash
# Check config.js
curl http://localhost:3000/config.js

# Check HTML includes config
curl http://localhost:3000/ | grep config.js

# Verify no wrong URL in built files
docker exec review-gui-frontend grep -r "host.docker.internal:8000" /usr/share/nginx/html/assets/ || echo "✅ No wrong URL found"
```

## Summary

1. **Security**: Current approach is OK for development, NOT for production
2. **Cache**: Browser is using old cached JavaScript - clear it!
3. **Config**: Runtime config is working correctly in container
4. **Next Step**: Hard refresh browser (Ctrl+Shift+R)
