# Review GUI Frontend MVP

**Version:** 1.0.0  
**Status:** MVP Development  
**Purpose:** Browser-based GUI interface for reviewing, pruning, and maintaining notes in the Second Brain vault

---

## Quick Start

### Development

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Docker

```bash
# Build and run with docker-compose
docker-compose up --build

# Access frontend at http://localhost:3000
# Access backend at http://localhost:8000
```

### Environment Variables

Copy `frontend/.env.example` to `frontend/.env` and configure:

- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:8000)
- `VITE_API_KEY`: API key for authentication
- `VITE_JWT_TOKEN`: Optional JWT token for authentication

---

## Technology Stack

- **Language**: TypeScript (strict mode, ES2020+)
- **Build Tool**: Vite
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Vanilla CSS with CSS Variables
- **Architecture**: Vanilla TypeScript (no framework dependencies)

---

## Project Structure

```
frontend/
├── src/
│   ├── api/          # API client and types
│   ├── components/   # UI components
│   ├── services/     # State management
│   ├── styles/       # CSS files
│   └── types/        # TypeScript types
├── e2e/              # E2E tests (Playwright)
├── dist/             # Production build output
└── package.json
```

---

## Features

- ✅ Review queue management with filtering and pagination
- ✅ Note detail viewing and editing
- ✅ Status updates with validation
- ✅ Batch operations for efficiency
- ✅ Smart suggestions for pruning decisions
- ✅ Responsive design (desktop & tablet)
- ✅ WCAG 2.1 AA accessibility compliance

---

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:coverage
```

---

## Docker Deployment

### Build Image
```bash
cd frontend
docker build -t review-gui-frontend:latest .
```

### Run Container
```bash
docker run -p 3000:80 \
  -e VITE_API_BASE_URL=http://backend:8000 \
  -e VITE_API_KEY=your-api-key \
  review-gui-frontend:latest
```

### Docker Compose
```bash
docker-compose up -d
```

---

## Development Guidelines

- **TDD**: Write tests first (Red-Green-Refactor)
- **SOLID**: Follow SOLID principles
- **Commits**: Use conventional commits with plan tags
- **Documentation**: Keep docs in sync with code changes

---

## License

See LICENSE file for details.
