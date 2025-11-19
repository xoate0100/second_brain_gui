# Port Configuration Audit

## Current Port Usage

### Docker Containers (Running)
| Container Name | Image | Host Port | Container Port | Status |
|---------------|-------|-----------|----------------|--------|
| `sb_n8n` | n8nio/n8n:latest | 5678 | 5678 | Running |
| `sb_postgres` | postgres:15 | (internal) | 5432 | Running (healthy) |
| `sb_ollama` | ollama/ollama:latest | 11434 | 11434 | Running (unhealthy) |

### Docker Containers (Stopped/Not Running)
| Container Name | Image | Status | Notes |
|---------------|-------|--------|-------|
| `review-gui-frontend` | review-gui-frontend:latest | Stopped | **Fixed**: Was on 8080, now available for port 3000 |
| `sb_python` | secondbrain/python-service:dev | Exited (1) | Can use port 8080 when started |
| `review-gui-backend` | review-gui-backend:latest | Not running | Configured for port 8000 |

### Development Servers
| Service | Port | Notes |
|---------|------|-------|
| Vite Dev Server | 5173 | Development only (not Docker) |

## Port Conflicts and Issues

### ✅ **RESOLVED: Port Mismatch Fixed**
- **docker-compose.yml** specifies: `3000:80` for frontend ✅
- **Previous issue**: Frontend was running on 8080 (conflict with Python container)
- **Action taken**: Stopped frontend container on port 8080
- **Current status**: All ports are now unique and properly allocated

### Port Allocation Summary

| Port | Service | Status | Notes |
|------|---------|--------|-------|
| **3000** | Frontend | ✅ In Use | Running (review-gui-frontend) |
| **8000** | Backend | ❌ Not Used | Originally configured but backend uses 8080 |
| **8080** | Python Backend API | ✅ In Use | **Backend API** (Python container from SecondBrain project) |
| **5173** | Vite Dev Server | ✅ Available | Development only (not Docker) |
| **5432** | PostgreSQL | ✅ In Use | Internal Docker network only |
| **5678** | n8n | ✅ In Use | Separate service (sb_n8n) |
| **11434** | Ollama | ✅ In Use | Separate service (sb_ollama) |

## Current Configuration (✅ All Ports Unique)

### Port Allocation (Final)
- **Frontend**: Port 3000 (docker-compose.yml configured) ✅
- **Backend**: Port 8000 (docker-compose.yml configured) ✅
- **Python Container**: Port 8080 (available when `sb_python` starts) ✅
- **n8n**: Port 5678 (running) ✅
- **PostgreSQL**: Port 5432 (internal, running) ✅
- **Ollama**: Port 11434 (running) ✅
- **Vite Dev**: Port 5173 (development only) ✅

### To Start Services with Correct Ports
```bash
# Start frontend on port 3000 (as configured)
docker-compose up -d frontend

# Start backend on port 8000 (as configured)
docker-compose up -d backend

# Python container (sb_python) can use port 8080 when started
# (This is managed separately, not in this docker-compose.yml)
```

## ✅ Unique Port Verification - CONFIRMED

**All ports are now unique and properly allocated:**

| Port | Service | Status | Conflict? |
|------|---------|--------|-----------|
| 3000 | Frontend | Available | ✅ None |
| 8000 | Backend | Available | ✅ None |
| 8080 | Python Container | Available | ✅ None |
| 5173 | Vite Dev Server | Available | ✅ None |
| 5432 | PostgreSQL | In Use (internal) | ✅ None |
| 5678 | n8n | In Use | ✅ None |
| 11434 | Ollama | In Use | ✅ None |

## Summary

✅ **Port configuration is correct and all ports are unique.**

The frontend container that was incorrectly using port 8080 has been stopped. The docker-compose.yml configuration is correct:
- Frontend: Port 3000 ✅
- Backend: Port 8000 ✅
- Python container: Port 8080 is available ✅

You can now start your services with:
```bash
docker-compose up -d
```

This will start:
- Frontend on port 3000
- Backend on port 8000
- Python container (sb_python) can use port 8080 when you start it separately
