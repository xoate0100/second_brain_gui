# Review GUI Frontend MVP Requirements

**Version:** 1.0  
**Date:** January 31, 2025  
**Status:** AUTHORITATIVE SPECIFICATION  
**Purpose:** Complete specification for frontend HTML GUI interface for maintenance and pruning operations, designed to integrate with Review GUI Backend API

---

## Table of Contents

1. [Frontend Overview & Architecture](#1-frontend-overview--architecture)
2. [API Integration Specification](#2-api-integration-specification)
3. [Component Architecture (SOLID)](#3-component-architecture-solid)
4. [Core Features Specification](#4-core-features-specification)
5. [UI/UX Requirements](#5-uiux-requirements)
6. [State Management](#6-state-management)
7. [Error Handling & Validation](#7-error-handling--validation)
8. [Testing Requirements (TDD)](#8-testing-requirements-tdd)
9. [Scalability & Extensibility](#9-scalability--extensibility)
10. [Deployment & Containerization](#10-deployment--containerization)

---

## 1. Frontend Overview & Architecture

### 1.1 Purpose and Goals

**Primary Purpose:**
Provide a lightweight, browser-based GUI interface for reviewing, pruning, and maintaining notes in the Second Brain vault. The frontend communicates exclusively with the backend API and provides an intuitive interface for bulk operations and smart suggestions.

**Key Goals:**
- Review queue management with filtering and pagination
- Note detail viewing and editing
- Status updates with validation
- Batch operations for efficiency
- Smart suggestions for pruning decisions
- Progress tracking and statistics
- Responsive design for desktop and tablet

**Non-Goals (MVP):**
- Direct file system access (all operations via API)
- Real-time collaboration
- Offline mode (requires API connection)
- Mobile app (web-only for MVP)

### 1.2 Technology Stack

**Core Technologies:**
- **Language**: TypeScript (strict mode, ES2020+)
- **Framework**: Vanilla TypeScript/JavaScript (no framework dependencies for MVP)
- **Build Tool**: Vite (fast, lightweight)
- **Styling**: CSS3 with CSS Variables (no CSS framework)
- **HTTP Client**: Fetch API with typed wrappers
- **Testing**: Vitest (unit), Playwright (E2E)
- **Container**: Docker (separate container from backend)

**Dependencies (Minimal):**
- No UI frameworks (keep bundle size small)
- No state management libraries (custom lightweight solution)
- Date-fns (lightweight date formatting)
- UUID library (for client-side idempotency keys)

### 1.3 File Structure and Organization

```
review-gui-frontend/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── index.ts                    # Entry point
│   ├── api/
│   │   ├── client.ts               # API client base
│   │   ├── review-api.ts          # Review endpoints
│   │   ├── notes-api.ts            # Notes endpoints
│   │   ├── types.ts                # API request/response types
│   │   └── errors.ts               # Error handling
│   ├── components/
│   │   ├── base/                   # Base components (SOLID)
│   │   │   ├── Component.ts        # Base component class
│   │   │   ├── ApiComponent.ts    # API-aware component
│   │   │   └── ValidatedComponent.ts # Form validation base
│   │   ├── review/
│   │   │   ├── ReviewQueue.ts      # Review queue list
│   │   │   ├── ReviewItem.ts       # Individual review item
│   │   │   ├── ReviewFilters.ts    # Filter controls
│   │   │   └── ReviewPagination.ts  # Pagination controls
│   │   ├── notes/
│   │   │   ├── NoteDetail.ts       # Note detail view
│   │   │   ├── NoteEditor.ts       # Note metadata editor
│   │   │   └── StatusUpdater.ts    # Status update form
│   │   ├── batch/
│   │   │   ├── BatchSelector.ts    # Multi-select component
│   │   │   ├── BatchActions.ts     # Batch action buttons
│   │   │   └── BatchResults.ts     # Batch operation results
│   │   ├── suggestions/
│   │   │   ├── SuggestionList.ts   # Suggestions display
│   │   │   └── SuggestionAction.ts # Individual suggestion
│   │   └── common/
│   │       ├── LoadingSpinner.ts  # Loading indicator
│   │       ├── ErrorMessage.ts     # Error display
│   │       ├── Modal.ts            # Modal dialog
│   │       └── Toast.ts            # Toast notifications
│   ├── services/
│   │   ├── state-manager.ts        # Application state
│   │   ├── auth-service.ts         # Authentication
│   │   └── validation-service.ts   # Form validation
│   ├── utils/
│   │   ├── date-utils.ts           # Date formatting
│   │   ├── format-utils.ts         # Text formatting
│   │   └── dom-utils.ts            # DOM helpers
│   ├── styles/
│   │   ├── variables.css           # CSS variables
│   │   ├── base.css                # Base styles
│   │   ├── components.css          # Component styles
│   │   └── layout.css              # Layout styles
│   └── types/
│       ├── review.ts               # Review domain types
│       ├── note.ts                 # Note domain types
│       └── app.ts                  # Application types
├── tests/
│   ├── unit/
│   │   ├── api/
│   │   ├── components/
│   │   └── services/
│   ├── integration/
│   │   └── api-integration.test.ts
│   └── e2e/
│       └── review-workflow.test.ts
└── README.md
```

---

## 2. API Integration Specification

### 2.1 Backend API Endpoints (MUST MATCH EXACTLY)

All frontend API calls MUST match the backend specification exactly:

#### 2.1.1 Review Queue Endpoint
```typescript
GET /api/v1/review/queue
Query Parameters:
  - stage?: "unreviewed" | "in_progress" | "complete"
  - venture?: "SWS" | "CRL" | "ERA" | "SAE" | "Personal"
  - domain?: string
  - limit?: number (default: 50, max: 100)
  - offset?: number (default: 0)
  - sort_by?: "momentum_score" | "created" | "age_days"
  - order?: "asc" | "desc" (default: "desc")

Response:
{
  "success": true,
  "data": {
    "items": ReviewItem[],
    "pagination": {
      "page": number,
      "page_size": number,
      "total_items": number,
      "total_pages": number,
      "has_next": boolean,
      "has_previous": boolean
    }
  },
  "metadata": {
    "request_id": string,
    "timestamp": string,
    "processing_time_ms": number
  }
}
```

#### 2.1.2 Note Detail Endpoint
```typescript
GET /api/v1/notes/{note_id}

Response:
{
  "success": true,
  "data": {
    "note_id": string,
    "file_path": string,
    "frontmatter": {
      "id": string,
      "title": string,
      "status": string,
      "venture": string,
      "domain": string,
      "tags": string[],
      "ai_summary": string,
      "momentum_score": number,
      "age_days": number,
      "aging_stage": string,
      // ... all other frontmatter fields
    },
    "body": string,
    "created_at": string,
    "updated_at": string
  },
  "metadata": { ... }
}
```

#### 2.1.3 Status Update Endpoint
```typescript
PUT /api/v1/notes/{note_id}/status

Request Body:
{
  "status": "inbox" | "ready" | "in-progress" | "paused" | "done",
  "review_notes"?: string,
  "follow_up_date"?: string (ISO format)
}

Response:
{
  "success": true,
  "data": {
    "note_id": string,
    "status": string,
    "previous_status": string,
    "momentum_delta": number,
    "updated_at": string
  },
  "metadata": { ... }
}
```

#### 2.1.4 Note Update Endpoint
```typescript
PUT /api/v1/notes/{note_id}

Request Body:
{
  "venture"?: string,
  "domain"?: string,
  "tags"?: string[],
  "first_action"?: string,
  "effort_estimate_min"?: number,
  // ... other updatable fields
}

Response:
{
  "success": true,
  "data": {
    "note_id": string,
    "updated_fields": string[],
    "updated_at": string
  },
  "metadata": { ... }
}
```

#### 2.1.5 Batch Update Endpoint
```typescript
POST /api/v1/notes/batch-update

Request Body:
{
  "note_ids": string[],
  "updates": {
    "status"?: string,
    "venture"?: string,
    "domain"?: string,
    // ... other fields
  }
}

Response:
{
  "success": true,
  "data": {
    "total": number,
    "succeeded": number,
    "failed": number,
    "results": Array<{
      "note_id": string,
      "success": boolean,
      "error"?: string
    }>
  },
  "metadata": { ... }
}
```

#### 2.1.6 Smart Suggestions Endpoint
```typescript
GET /api/v1/review/suggestions

Query Parameters:
  - limit?: number (default: 10)
  - venture?: string
  - domain?: string

Response:
{
  "success": true,
  "data": {
    "suggestions": Array<{
      "note_id": string,
      "suggested_action": "archive" | "mark_done" | "fix_classification" | "update_status",
      "confidence": number (0-1),
      "reason": string,
      "note_summary": string
    }>
  },
  "metadata": { ... }
}
```

### 2.2 Authentication

**API Key Authentication:**
- All requests MUST include `X-API-Key` header
- API key stored in environment variable or user configuration
- Frontend MUST handle 401 responses and prompt for API key

**JWT Authentication (Optional):**
- If JWT token provided, use `Authorization: Bearer <token>` header
- Frontend MUST handle token expiration (401) and refresh if supported

### 2.3 Error Response Handling

All error responses follow this format:
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      // Additional context
    },
    "trace_id": "optional-trace-id"
  }
}
```

**Error Codes to Handle:**
- `VALIDATION_ERROR` (400)
- `AUTHENTICATION_ERROR` (401)
- `AUTHORIZATION_ERROR` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)
- `SERVICE_UNAVAILABLE` (503)

### 2.4 Request/Response Standards

**Request Headers:**
```typescript
{
  "Content-Type": "application/json",
  "X-API-Key": string,
  "X-Request-ID"?: string (optional, for idempotency)
}
```

**Response Headers:**
- `X-Request-ID`: Echoed from request or generated by server
- `X-Processing-Time`: Processing time in milliseconds

---

## 3. Component Architecture (SOLID)

### 3.1 Single Responsibility Principle (SRP)

Each component has ONE responsibility:

```typescript
// ✅ GOOD: Single responsibility
class ReviewQueue {
  // ONLY responsible for displaying review queue
  render(items: ReviewItem[]): HTMLElement
  updatePagination(pagination: Pagination): void
}

class ReviewFilters {
  // ONLY responsible for filter controls
  renderFilters(): HTMLElement
  getFilterValues(): FilterValues
}

// ❌ BAD: Multiple responsibilities
class ReviewQueueWithFilters {
  // Violates SRP - does both queue display AND filtering
}
```

### 3.2 Open/Closed Principle (OCP)

Components are open for extension, closed for modification:

```typescript
// Base component class
abstract class Component {
  protected element: HTMLElement;

  abstract render(): HTMLElement;
  abstract update(data: unknown): void;
}

// Extendable without modifying base
class ReviewItem extends Component {
  render(): HTMLElement {
    // Specific implementation
  }
}

class NoteDetail extends Component {
  render(): HTMLElement {
    // Different implementation, same interface
  }
}
```

### 3.3 Liskov Substitution Principle (LSP)

Subtypes must be substitutable for base types:

```typescript
interface ApiClient {
  get<T>(url: string): Promise<ApiResponse<T>>;
  post<T>(url: string, data: unknown): Promise<ApiResponse<T>>;
}

class ReviewApiClient implements ApiClient {
  // Can be substituted anywhere ApiClient is expected
  get<T>(url: string): Promise<ApiResponse<T>> { ... }
  post<T>(url: string, data: unknown): Promise<ApiResponse<T>> { ... }
}
```

### 3.4 Interface Segregation Principle (ISP)

Clients depend only on interfaces they use:

```typescript
// ✅ GOOD: Specific interfaces
interface Filterable {
  applyFilters(filters: FilterValues): void;
}

interface Paginatable {
  goToPage(page: number): void;
}

// Components implement only what they need
class ReviewQueue implements Filterable, Paginatable {
  applyFilters(filters: FilterValues): void { ... }
  goToPage(page: number): void { ... }
}

// ❌ BAD: Fat interface
interface Everything {
  filter(): void;
  paginate(): void;
  sort(): void;
  export(): void;
  // Components forced to implement all
}
```

### 3.5 Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

```typescript
// ✅ GOOD: Depend on interface
class ReviewQueue {
  constructor(private apiClient: ApiClient) {}
  // Uses ApiClient interface, not concrete implementation
}

// ❌ BAD: Depend on concrete class
class ReviewQueue {
  constructor(private apiClient: ReviewApiClient) {}
  // Tightly coupled to specific implementation
}
```

### 3.6 Component Structure

```typescript
// Base component class
abstract class Component {
  protected element: HTMLElement;
  protected state: Record<string, unknown>;

  constructor(container: HTMLElement) {
    this.element = container;
    this.state = {};
  }

  abstract render(): HTMLElement;
  abstract update(data: unknown): void;

  protected emit(event: string, data: unknown): void {
    this.element.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  destroy(): void {
    this.element.remove();
  }
}

// API-aware component base
abstract class ApiComponent extends Component {
  constructor(
    container: HTMLElement,
    protected apiClient: ApiClient
  ) {
    super(container);
  }

  protected async handleApiError(error: ApiError): void {
    // Centralized error handling
  }
}
```

---

## 4. Core Features Specification

### 4.1 Review Queue View

**Requirements:**
- Display paginated list of items needing review
- Show: title, venture, domain, status, age_days, momentum_score
- Filter by: stage, venture, domain
- Sort by: momentum_score, created, age_days
- Pagination controls (prev/next, page numbers)
- Click item to view details
- Select multiple items for batch operations

**UI Components:**
- `ReviewQueue` - Main list component
- `ReviewFilters` - Filter controls
- `ReviewPagination` - Pagination controls
- `ReviewItem` - Individual item row

### 4.2 Note Detail View

**Requirements:**
- Display full note content (frontmatter + body)
- Show all metadata fields
- Edit metadata fields (venture, domain, tags, etc.)
- Update status with validation
- Show status transition history
- Display momentum score changes
- Save changes via API

**UI Components:**
- `NoteDetail` - Main detail view
- `NoteEditor` - Metadata editor form
- `StatusUpdater` - Status update form

### 4.3 Status Update Workflow

**Requirements:**
- Validate status transitions (use backend validation)
- Show transition requirements (e.g., "ready" requires first_action)
- Display momentum score impact
- Handle follow-up dates for "done" status
- Show success/error feedback

**Validation Rules (MUST match backend):**
- `inbox → ready`: Requires first_action, effort_estimate_min
- `ready → in-progress`: No additional requirements
- `in-progress → paused`: Requires resume_hint
- `paused → in-progress`: No additional requirements
- `* → done`: Sets completion_date, updates momentum

### 4.4 Batch Operations

**Requirements:**
- Select multiple items from review queue
- Apply batch actions: update status, update metadata, archive
- Show progress during batch operation
- Display results (success/failure per item)
- Handle partial failures gracefully

**UI Components:**
- `BatchSelector` - Multi-select checkbox component
- `BatchActions` - Action buttons (Update Status, Archive, etc.)
- `BatchResults` - Results display modal

### 4.5 Smart Suggestions

**Requirements:**
- Fetch suggestions from API
- Display suggested actions per item
- Show confidence scores
- One-click apply suggestions
- Batch apply multiple suggestions

**UI Components:**
- `SuggestionList` - List of suggestions
- `SuggestionAction` - Individual suggestion with apply button

### 4.6 Progress Tracking

**Requirements:**
- Show items reviewed today
- Display total items remaining
- Calculate completion percentage
- Estimate time to complete
- Show statistics by venture/domain

**UI Components:**
- `ProgressDashboard` - Statistics display
- `ProgressBar` - Visual progress indicator

---

## 5. UI/UX Requirements

### 5.1 Design Principles

- **Minimalist**: Clean, uncluttered interface
- **Efficient**: Minimize clicks for common actions
- **Responsive**: Works on desktop (1920x1080) and tablet (1024x768)
- **Accessible**: WCAG 2.1 AA compliance
- **Fast**: Perceived performance < 200ms

### 5.2 Color Scheme

```css
:root {
  --color-primary: #2563eb;      /* Blue for actions */
  --color-success: #10b981;      /* Green for success */
  --color-warning: #f59e0b;      /* Orange for warnings */
  --color-error: #ef4444;        /* Red for errors */
  --color-text: #1f2937;         /* Dark gray for text */
  --color-text-light: #6b7280;   /* Light gray for secondary text */
  --color-bg: #ffffff;            /* White background */
  --color-bg-alt: #f9fafb;       /* Light gray background */
  --color-border: #e5e7eb;       /* Light gray border */
}
```

### 5.3 Typography

- **Font Family**: System fonts (San Francisco, Segoe UI, Roboto)
- **Font Sizes**: 12px (small), 14px (body), 16px (heading), 20px (title)
- **Line Height**: 1.5 for body, 1.2 for headings

### 5.4 Layout

- **Header**: Fixed top bar with title and user info
- **Sidebar**: Filters (collapsible on mobile)
- **Main Content**: Review queue or note detail
- **Footer**: Progress statistics

### 5.5 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Stack layout, hide sidebar */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Sidebar collapsible */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full layout */
}
```

---

## 6. State Management

### 6.1 Application State

Lightweight state management without external libraries:

```typescript
class StateManager {
  private state: AppState;
  private listeners: Map<string, Set<() => void>>;

  constructor(initialState: AppState) {
    this.state = initialState;
    this.listeners = new Map();
  }

  getState(): AppState {
    return { ...this.state }; // Immutable copy
  }

  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callbacks => {
      callbacks.forEach(callback => callback());
    });
  }
}
```

### 6.2 State Structure

```typescript
interface AppState {
  review: {
    items: ReviewItem[];
    filters: FilterValues;
    pagination: Pagination;
    selectedItems: string[];
    loading: boolean;
    error: ApiError | null;
  };
  note: {
    currentNote: NoteDetail | null;
    loading: boolean;
    error: ApiError | null;
  };
  suggestions: {
    items: Suggestion[];
    loading: boolean;
    error: ApiError | null;
  };
  progress: {
    reviewedToday: number;
    totalRemaining: number;
    completionPercentage: number;
  };
}
```

---

## 7. Error Handling & Validation

### 7.1 API Error Handling

```typescript
class ApiErrorHandler {
  static handle(error: ApiError): void {
    switch (error.code) {
      case 'AUTHENTICATION_ERROR':
        this.handleAuthError(error);
        break;
      case 'VALIDATION_ERROR':
        this.handleValidationError(error);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        this.handleRateLimit(error);
        break;
      default:
        this.handleGenericError(error);
    }
  }

  private static handleAuthError(error: ApiError): void {
    // Redirect to login or show API key prompt
  }

  private static handleValidationError(error: ApiError): void {
    // Show field-specific error messages
  }

  private static handleRateLimit(error: ApiError): void {
    // Show retry-after message
  }

  private static handleGenericError(error: ApiError): void {
    // Show generic error toast
  }
}
```

### 7.2 Form Validation

```typescript
class ValidationService {
  static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    data: StatusUpdateData
  ): ValidationResult {
    const rules = StatusTransitionRules[currentStatus]?.[newStatus];
    if (!rules) {
      return { valid: false, error: 'Invalid transition' };
    }

    for (const rule of rules) {
      const result = rule.validate(data);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }
}
```

---

## 8. Testing Requirements (TDD)

### 8.1 TDD Process (MANDATORY)

**Red-Green-Refactor-Document Cycle:**

1. **RED**: Write failing test first
2. **GREEN**: Implement minimal code to pass
3. **REFACTOR**: Improve code quality
4. **DOCUMENT**: Update documentation

### 8.2 Test Structure

```typescript
// tests/unit/api/review-api.test.ts
describe('ReviewApiClient', () => {
  describe('getReviewQueue', () => {
    it('should fetch review queue with default parameters', async () => {
      // RED: Write failing test
      const client = new ReviewApiClient(mockApiClient);
      const result = await client.getReviewQueue();

      expect(result.items).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it('should apply filters when provided', async () => {
      // Test filtering
    });

    it('should handle API errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### 8.3 Test Coverage Requirements

- **Unit Tests**: 100% coverage for all components and services
- **Integration Tests**: 100% coverage for API integration
- **E2E Tests**: Critical user workflows (review queue, status update, batch operations)

### 8.4 Testing Tools

- **Vitest**: Unit and integration tests
- **Playwright**: E2E tests
- **MSW (Mock Service Worker)**: API mocking for tests

---

## 9. Scalability & Extensibility

### 9.1 Future Feature Extensibility

**Architecture must support:**
- Additional review stages
- New filter types
- Custom batch operations
- Export functionality
- Advanced search
- Keyboard shortcuts
- Dark mode

**Design Patterns:**
- Plugin architecture for new features
- Event-driven communication between components
- Strategy pattern for different operation types

### 9.2 Performance Optimization

- **Lazy Loading**: Load components on demand
- **Virtual Scrolling**: For large review queues
- **Debouncing**: For filter inputs
- **Caching**: API responses where appropriate
- **Code Splitting**: Separate bundles for different views

### 9.3 Code Organization

- **Feature-based structure**: Group by feature, not by type
- **Barrel exports**: Clean import paths
- **Type safety**: Strict TypeScript configuration
- **Documentation**: JSDoc for all public APIs

---

## 10. Deployment & Containerization

### 10.1 Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 10.2 Environment Configuration

```typescript
// src/config.ts
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  apiKey: import.meta.env.VITE_API_KEY || '',
  enableDevTools: import.meta.env.DEV,
};
```

### 10.3 CORS Configuration

Backend MUST be configured to allow frontend origin:
- Development: `http://localhost:5173` (Vite default)
- Production: Configured domain

---

## 11. Integration Checklist

### 11.1 Backend API Compatibility

- [ ] All 6 endpoints implemented and tested
- [ ] Request/response formats match exactly
- [ ] Error codes handled correctly
- [ ] Authentication working
- [ ] CORS configured

### 11.2 Frontend Implementation

- [ ] All components implemented with SOLID principles
- [ ] 100% test coverage achieved
- [ ] TDD process followed
- [ ] API integration complete
- [ ] Error handling comprehensive
- [ ] Responsive design verified

### 11.3 Quality Gates

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No console errors
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

---

## 12. Development Workflow

### 12.1 Git Strategy

- **Branch Naming**: `feature/frontend/[feature-name]`
- **Commit Messages**: Conventional commits (`feat:`, `fix:`, `refactor:`)
- **Pull Requests**: Required before merge to `main`

### 12.2 Pre-Commit Hooks

- TypeScript type checking
- Linting (ESLint)
- Unit tests
- Code formatting (Prettier)

### 12.3 CI/CD Pipeline

- Run tests on every push
- Build Docker image on merge to `main`
- Deploy to staging environment
- Manual approval for production

---

## 13. Documentation Requirements

### 13.1 Code Documentation

- JSDoc comments for all public functions
- Type definitions for all interfaces
- README with setup instructions
- API integration guide

### 13.2 User Documentation

- Feature overview
- User guide for review workflow
- Troubleshooting guide

---

**Last Updated:** January 31, 2025  
**Version:** 1.0  
**Status:** AUTHORITATIVE SPECIFICATION

**Note:** This document MUST be kept in sync with the backend API specification. Any changes to backend endpoints require corresponding frontend updates.
