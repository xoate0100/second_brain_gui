# Runtime Configuration Solution

## Problem Summary

Vite's build-time environment variable embedding was unreliable:
- API key not consistently embedded
- Wrong URL (`host.docker.internal:8000`) appearing despite correct build args
- Browser cache issues
- Volume mount conflicts

## New Approach: Runtime Configuration

Instead of relying on Vite's build-time embedding, we now use a **runtime configuration file** that:
- ✅ Loads before the app initializes
- ✅ Can be updated without rebuilding
- ✅ Works reliably across all scenarios
- ✅ Easy to debug and verify

## Implementation

### 1. Runtime Config File (`frontend/public/config.js`)

```javascript
window.__APP_CONFIG__ = {
  apiBaseUrl: 'http://localhost:8080',
  apiKey: 'sb_test_RZbK4LCvhQm1kHMBPDXlT7BvNMIncEiH:read:notes,write:notes,read:review,write:review',
  jwtToken: null
};
```

### 2. HTML Loads Config First (`frontend/index.html`)

```html
<head>
  <!-- Runtime configuration - loaded before app initialization -->
  <script src="/config.js"></script>
</head>
```

### 3. App Reads Runtime Config (`frontend/src/index.ts`)

```typescript
// Priority: window.__APP_CONFIG__ > import.meta.env > defaults
const runtimeConfig = window.__APP_CONFIG__;
const apiBaseUrl = runtimeConfig?.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const apiKey = runtimeConfig?.apiKey || import.meta.env.VITE_API_KEY || '';
```

## Benefits

1. **Reliable**: No build-time embedding issues
2. **Debuggable**: Can check `window.__APP_CONFIG__` in browser console
3. **Updatable**: Can modify config.js without rebuilding
4. **Fallback**: Still supports Vite env vars and defaults
5. **Clear Priority**: Runtime config > Vite env > defaults

## Verification

### Check Config File
```bash
curl http://localhost:3000/config.js
# Should show the config object
```

### Check in Browser Console
```javascript
// Should show the config
console.log(window.__APP_CONFIG__);
// Should show:
// {
//   apiBaseUrl: 'http://localhost:8080',
//   apiKey: 'sb_test_...',
//   jwtToken: null
// }
```

### Check App Initialization
Open browser console - should see:
```
[Config] Using runtime config from config.js
✅ API key loaded: sb_test_RZbK4LCvhQm1k...
✅ API Base URL: http://localhost:8080
```

## Current Status

✅ Runtime config file created  
✅ HTML updated to load config.js  
✅ App code updated to use runtime config  
✅ Container rebuilt and running  
✅ Config file accessible at `/config.js`

## Next Steps

1. **Hard refresh browser** (Ctrl+Shift+R) to clear cache
2. **Open http://localhost:3000**
3. **Check browser console** for config messages
4. **Verify** `window.__APP_CONFIG__` exists
5. **Test API calls** - should now work correctly

## Troubleshooting

### If config.js not loading:
```bash
# Check file exists in container
docker exec review-gui-frontend ls -la /usr/share/nginx/html/config.js

# Check nginx serves it
curl http://localhost:3000/config.js
```

### If API key still not set:
```javascript
// In browser console, check:
console.log(window.__APP_CONFIG__);
// Should show the config object with apiKey
```

### If wrong URL still appears:
```javascript
// In browser console:
console.log(window.__APP_CONFIG__.apiBaseUrl);
// Should be: http://localhost:8080
```
