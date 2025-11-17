# Development Setup - Separate Frontend & Backend

## Overview

The frontend and backend are developed in **separate projects**:
- **Frontend**: This project (`second_brain_gui`)
- **Backend**: Separate "SecondBrain" project

Both can run independently using Docker containers.

## Port Configuration

| Service | Port | Access URL |
|---------|------|------------|
| Frontend | 3000 | http://localhost:3000 |
| Backend API (Python) | 8080 | http://localhost:8080 (from SecondBrain project) |

## Frontend Setup

### Starting the Frontend

```bash
# Build and start the frontend container
docker-compose up -d --build frontend

# View logs
docker-compose logs -f frontend

# Stop the frontend
docker-compose stop frontend
```

### Development Mode (Local)

For local development without Docker:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server will run on `http://localhost:5173` and proxy API requests to the backend.

### Backend Connection

The frontend is configured to connect to the Python backend API running on the host machine:
- **Docker container**: Uses `host.docker.internal:8080` to access the host's localhost
- **Local dev**: Uses `http://localhost:8080` (default)

### Configuring Backend URL

#### For Docker Builds

Set the `VITE_API_BASE_URL` environment variable before building:

```bash
# Windows PowerShell
$env:VITE_API_BASE_URL="http://host.docker.internal:8000"
docker-compose up -d --build frontend

# Or set in docker-compose.yml build args (already configured)
```

#### For Local Development

Create `frontend/.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_KEY=your-api-key-here
VITE_JWT_TOKEN=optional-jwt-token
```

## Backend Setup (SecondBrain Project)

The Python backend API should be running in the separate "SecondBrain" project on port 8080.

### Verifying Backend Connection

1. Ensure the Python backend is running: `http://localhost:8080`
2. Check backend health endpoint (if available): `http://localhost:8080/health`
3. Test API endpoint: `http://localhost:8080/api/v1/review/queue`
4. Frontend will connect automatically when both are running

## Docker Network Configuration

The frontend container uses `host.docker.internal` to access services running on the host machine (Windows/Mac Docker Desktop). This allows the frontend container to connect to the Python backend API running on localhost:8080.

### For Linux Docker

If running on Linux, you may need to:
1. Use `--network host` mode, or
2. Use the host's actual IP address instead of `host.docker.internal`

## Development Workflow

### Option 1: Both in Docker (Recommended for Production-like Testing)

1. Start backend in SecondBrain project
2. Start frontend: `docker-compose up -d frontend`
3. Access frontend at http://localhost:3000

### Option 2: Frontend Local, Backend Docker

1. Start backend in SecondBrain project (Docker or local)
2. Start frontend locally: `cd frontend && npm run dev`
3. Access frontend at http://localhost:5173
4. Vite proxy will forward API calls to backend

### Option 3: Both Local

1. Start backend locally in SecondBrain project
2. Start frontend locally: `cd frontend && npm run dev`
3. Access frontend at http://localhost:5173

## Troubleshooting

### Frontend can't connect to backend

1. **Check backend is running**: `curl http://localhost:8080/health` (or check in browser)
2. **Check port conflicts**: Ensure port 8080 is available for Python backend
3. **Docker networking**: If using Docker, verify `host.docker.internal` works:
   ```bash
   docker exec review-gui-frontend wget -O- http://host.docker.internal:8080/health
   ```

### CORS Errors

If you see CORS errors, ensure the backend is configured to allow requests from:
- `http://localhost:3000` (Docker frontend)
- `http://localhost:5173` (Local dev frontend)

### Rebuilding Frontend

If you change environment variables or need to rebuild:

```bash
docker-compose up -d --build frontend
```

## Current Status

✅ Frontend container is running on port 3000
✅ Configured to connect to Python backend API on port 8080
✅ No backend dependency in docker-compose.yml
✅ Can develop frontend and backend independently

## Important Notes

- **Backend is Python API**: The backend is the Python container (`sb_python`) running on port 8080
- **Port 8080**: This is the correct port for the backend API endpoints
- **Separate Projects**: Frontend (this project) and Backend (SecondBrain project) can be developed independently
