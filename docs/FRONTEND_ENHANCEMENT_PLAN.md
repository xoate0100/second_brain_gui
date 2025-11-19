# Frontend GUI Enhancement Plan

## Executive Summary

**Date:** November 17, 2025
**Status:** APPROVED FOR IMPLEMENTATION
**Based On:** VOC/CTQ Analysis (`docs/VOC_CTQ_ANALYSIS.md`)

This document provides a detailed implementation plan to enhance the Review GUI Frontend with critical missing features, following TDD, SOLID principles, and our meta-framework standards.

---

## 1. Current State Summary

### 1.1 What Works
- ✅ Review queue display with filtering and pagination
- ✅ Note detail view (read-only)
- ✅ Metadata editing via form
- ✅ Status updates with validation
- ✅ Batch operations
- ✅ Review workflow fields

### 1.2 Critical Gaps Identified
- ❌ **Cannot edit note body/content** (read-only `<pre>` tag)
- ❌ **No inline editing** (must click buttons to open forms)
- ❌ **No visual feedback** (no toast notifications)
- ❌ **No markdown rendering** (plain text display)
- ❌ **Cannot create new notes**
- ❌ **Cannot delete notes**
- ❌ **No keyboard shortcuts**
- ❌ **No search functionality**

### 1.3 ADHD-Specific Gaps (MVP Critical)
- ❌ **No anti-overwhelm limits** (unlimited items in queue causes decision paralysis)
- ❌ **first_action not visible in queue** (must open note to see start cue)
- ❌ **resume_hint not visible in queue** (must open note to see continuation cue)
- ❌ **No quick status transitions** (must open form to change status)
- ❌ **No momentum visualization** (momentum scores hidden, no progress feedback)
- ❌ **No energy mode filtering** (cannot match tasks to current energy level)
- ❌ **No effort estimate filtering** (cannot find quick wins)
- ❌ **No quick review workflow** (must open note to mark as reviewed)
- ❌ **No context need indicators** (cannot prioritize low-context tasks)

---

## 2. Enhancement Phases

### Phase 1: Critical Features (MUST HAVE) - 4-6 weeks

#### Feature 1.1: Markdown Rendering for Note Body
**Priority:** CRITICAL
**Effort:** Medium (2 weeks)
**Dependencies:** Markdown parser library

**User Story:**
> As a user, I want to see note content rendered as markdown so I can read formatted text, code blocks, and links properly.

**Acceptance Criteria:**
- Note body displays rendered markdown (not plain text)
- Supports common markdown features (headers, lists, code blocks, links, tables)
- Code blocks have syntax highlighting
- Styling matches design system
- Performance: renders in < 100ms for typical notes

**Technical Approach:**
1. **Library Selection:** Use `marked` (lightweight) or `markdown-it` (extensible)
2. **Component:** Create `MarkdownRenderer` component
3. **Integration:** Update `NoteDetail` to use `MarkdownRenderer` instead of `<pre>`
4. **Styling:** Add CSS for markdown elements

**Implementation Steps:**

**Step 1: Install Dependencies (TDD)**
```bash
npm install marked
npm install --save-dev @types/marked
```

**Step 2: Write Tests First (RED)**
```typescript
// frontend/src/components/common/MarkdownRenderer.test.ts
describe('MarkdownRenderer', () => {
  it('should render markdown text as HTML', () => {
    // Test basic markdown rendering
  });

  it('should handle code blocks with syntax highlighting', () => {
    // Test code block rendering
  });

  it('should escape HTML in markdown', () => {
    // Test XSS prevention
  });

  it('should handle empty or null content', () => {
    // Test edge cases
  });
});
```

**Step 3: Implement Component (GREEN)**
```typescript
// frontend/src/components/common/MarkdownRenderer.ts
import { marked } from 'marked';
import { Component } from '../base/Component';

export class MarkdownRenderer extends Component {
  render(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'markdown-renderer';
    // Implementation
    return container;
  }

  update(content: string): void {
    // Update rendered content
  }
}
```

**Step 4: Integrate into NoteDetail (REFACTOR)**
- Update `NoteDetail.ts` to use `MarkdownRenderer`
- Replace `<pre>` tag with `MarkdownRenderer` component
- Test integration

**Step 5: Add Styling**
- Create `markdown-renderer.css`
- Style headers, lists, code blocks, tables
- Ensure accessibility

**Files to Create/Modify:**
- ✅ `frontend/src/components/common/MarkdownRenderer.ts` (new)
- ✅ `frontend/src/components/common/MarkdownRenderer.test.ts` (new)
- ✅ `frontend/src/styles/markdown.css` (new)
- ✅ `frontend/src/components/notes/NoteDetail.ts` (modify)
- ✅ `frontend/package.json` (add dependency)

**SOLID Principles:**
- **SRP:** `MarkdownRenderer` only responsible for markdown rendering
- **OCP:** Extensible for additional markdown features
- **DIP:** Depends on `marked` library interface

---

#### Feature 1.2: Rich Text/Markdown Editor for Note Body
**Priority:** CRITICAL
**Effort:** High (3 weeks)
**Dependencies:** CodeMirror or Monaco Editor

**User Story:**
> As a user, I want to edit note body content directly in the GUI so I can fix typos, update content, and add formatting without leaving the application.

**Acceptance Criteria:**
- Click note body to enter edit mode
- Markdown editor with syntax highlighting
- Live preview (split view optional)
- Save/Cancel buttons
- Keyboard shortcuts (Ctrl+S to save, Esc to cancel)
- Changes persist to backend
- Visual indicator when editing

**Technical Approach:**
1. **Library Selection:** CodeMirror 6 (lightweight, extensible)
2. **Component:** Create `NoteBodyEditor` component
3. **Integration:** Add to `NoteDetail` component
4. **API:** Use existing `PUT /api/v1/notes/{note_id}` endpoint (add body field)

**Implementation Steps:**

**Step 1: Install Dependencies**
```bash
npm install @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/theme-one-dark
```

**Step 2: Write Tests First (TDD)**
```typescript
// frontend/src/components/notes/NoteBodyEditor.test.ts
describe('NoteBodyEditor', () => {
  it('should render editor when in edit mode', () => {
    // Test editor rendering
  });

  it('should save changes when save button clicked', () => {
    // Test save functionality
  });

  it('should cancel editing when cancel button clicked', () => {
    // Test cancel functionality
  });

  it('should save on Ctrl+S keyboard shortcut', () => {
    // Test keyboard shortcut
  });

  it('should cancel on Esc keyboard shortcut', () => {
    // Test keyboard shortcut
  });

  it('should emit save event with updated content', () => {
    // Test event emission
  });
});
```

**Step 3: Implement Component**
```typescript
// frontend/src/components/notes/NoteBodyEditor.ts
import { EditorView, basicSetup } from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { ValidatedComponent } from '../base/ValidatedComponent';
import { NotesApiClient } from '../../api/notes-api';

export class NoteBodyEditor extends ValidatedComponent {
  private editor: EditorView | null = null;
  private isEditing = false;

  render(): HTMLElement {
    // Implementation
  }

  enterEditMode(): void {
    // Switch to edit mode
  }

  exitEditMode(): void {
    // Exit edit mode
  }

  async save(): Promise<void> {
    // Save changes to backend
  }

  cancel(): void {
    // Cancel editing
  }
}
```

**Step 4: Update API Types**
```typescript
// frontend/src/api/types.ts
export interface NoteUpdateRequest {
  // ... existing fields
  body?: string; // Add body field
}
```

**Step 5: Integrate into NoteDetail**
- Add "Edit Body" button
- Replace read-only display with `NoteBodyEditor` when editing
- Handle save/cancel events

**Files to Create/Modify:**
- ✅ `frontend/src/components/notes/NoteBodyEditor.ts` (new)
- ✅ `frontend/src/components/notes/NoteBodyEditor.test.ts` (new)
- ✅ `frontend/src/api/types.ts` (modify - add body field)
- ✅ `frontend/src/components/notes/NoteDetail.ts` (modify)
- ✅ `frontend/src/styles/note-body-editor.css` (new)

**SOLID Principles:**
- **SRP:** `NoteBodyEditor` only handles body editing
- **OCP:** Extensible for additional editor features
- **DIP:** Depends on `NotesApiClient` interface

---

#### Feature 1.3: Toast Notification System
**Priority:** CRITICAL
**Effort:** Low (1 week)
**Dependencies:** None

**User Story:**
> As a user, I want visual feedback when I perform actions so I know if my actions succeeded or failed.

**Acceptance Criteria:**
- Toast notifications appear for all actions (save, update, delete, etc.)
- Success (green), Error (red), Warning (yellow), Info (blue) types
- Auto-dismiss after 3-5 seconds
- Stack multiple toasts vertically
- Accessible (ARIA labels, keyboard dismiss)

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/common/Toast.test.ts
describe('Toast', () => {
  it('should render toast with message', () => {
    // Test rendering
  });

  it('should auto-dismiss after timeout', () => {
    // Test auto-dismiss
  });

  it('should stack multiple toasts', () => {
    // Test stacking
  });

  it('should support different types (success, error, warning, info)', () => {
    // Test types
  });
});

// frontend/src/services/ToastManager.test.ts
describe('ToastManager', () => {
  it('should show toast when called', () => {
    // Test show method
  });

  it('should remove toast when dismissed', () => {
    // Test dismiss
  });
});
```

**Step 2: Implement Components**
```typescript
// frontend/src/components/common/Toast.ts
export class Toast extends Component {
  constructor(
    container: HTMLElement,
    private message: string,
    private type: 'success' | 'error' | 'warning' | 'info'
  ) {
    super(container);
  }

  render(): HTMLElement {
    // Implementation
  }

  dismiss(): void {
    // Remove toast
  }
}

// frontend/src/services/ToastManager.ts
export class ToastManager {
  private static toasts: Toast[] = [];
  private static container: HTMLElement | null = null;

  static show(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    // Show toast
  }

  static success(message: string): void {
    this.show(message, 'success');
  }

  static error(message: string): void {
    this.show(message, 'error');
  }

  // ... warning, info methods
}
```

**Step 3: Integrate into Components**
- Update `NoteEditor` to show toast on save
- Update `StatusUpdater` to show toast on update
- Update `NoteBodyEditor` to show toast on save
- Update `BatchActions` to show toast on batch operations

**Files to Create/Modify:**
- ✅ `frontend/src/components/common/Toast.ts` (new)
- ✅ `frontend/src/components/common/Toast.test.ts` (new)
- ✅ `frontend/src/services/ToastManager.ts` (new)
- ✅ `frontend/src/services/ToastManager.test.ts` (new)
- ✅ `frontend/src/styles/toast.css` (new)
- ✅ All action components (modify to use ToastManager)

**SOLID Principles:**
- **SRP:** `Toast` displays notification, `ToastManager` manages lifecycle
- **OCP:** Extensible for additional toast types
- **DIP:** Components depend on `ToastManager` interface

---

#### Feature 1.4: Inline Editing for Metadata
**Priority:** CRITICAL
**Effort:** Medium (2 weeks)
**Dependencies:** None

**User Story:**
> As a user, I want to edit metadata fields inline without opening a form so I can quickly update fields with fewer clicks.

**Acceptance Criteria:**
- Click text field to enter edit mode
- Inline input appears
- Auto-save on blur or Enter key
- Visual indicator when editing
- Cancel on Esc key
- Validation feedback

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/common/InlineEditor.test.ts
describe('InlineEditor', () => {
  it('should render display value when not editing', () => {
    // Test display mode
  });

  it('should show input when clicked', () => {
    // Test edit mode
  });

  it('should save on blur', () => {
    // Test auto-save
  });

  it('should save on Enter key', () => {
    // Test Enter key
  });

  it('should cancel on Esc key', () => {
    // Test Esc key
  });

  it('should emit save event with new value', () => {
    // Test event emission
  });
});
```

**Step 2: Implement Component**
```typescript
// frontend/src/components/common/InlineEditor.ts
export class InlineEditor extends Component {
  private isEditing = false;
  private value: string;

  constructor(
    container: HTMLElement,
    private initialValue: string,
    private onSave: (value: string) => void | Promise<void>
  ) {
    super(container);
    this.value = initialValue;
  }

  render(): HTMLElement {
    // Implementation
  }

  enterEditMode(): void {
    // Switch to edit mode
  }

  exitEditMode(): void {
    // Exit edit mode
  }

  async save(): Promise<void> {
    // Save and call onSave callback
  }

  cancel(): void {
    // Cancel and revert value
  }
}
```

**Step 3: Integrate into NoteDetail**
- Replace static metadata display with `InlineEditor` components
- Handle save events
- Update backend via API

**Files to Create/Modify:**
- ✅ `frontend/src/components/common/InlineEditor.ts` (new)
- ✅ `frontend/src/components/common/InlineEditor.test.ts` (new)
- ✅ `frontend/src/components/notes/NoteDetail.ts` (modify)
- ✅ `frontend/src/styles/inline-editor.css` (new)

**SOLID Principles:**
- **SRP:** `InlineEditor` only handles inline editing
- **OCP:** Extensible for different field types
- **DIP:** Uses callback for save action

---

#### Feature 1.5: Launchpad View with Anti-Overwhelm Limits (ADHD CRITICAL)
**Priority:** CRITICAL (ADHD MVP)
**Effort:** Medium (2 weeks)
**Dependencies:** Review queue API enhancement

**User Story:**
> As an ADHD user, I want to see a limited number of actionable items in my launchpad so I don't get overwhelmed by too many choices and can quickly identify what to start next.

**Acceptance Criteria:**
- Launchpad shows maximum 20 items for "All-Venture" view
- Venture-specific launchpads show maximum 8 items per venture
- Overflow items are suppressed (not deleted), accessible via "Show All" toggle
- Visual indicator shows "+X more items available" when limits are active
- Default view shows only `status=ready` items
- Anti-overwhelm limits are configurable per user (power users can disable)

**Technical Approach:**
1. **API Enhancement:** Add `limit` parameter to review queue API
2. **Component:** Enhance `ReviewQueue` to enforce limits
3. **UI:** Add overflow indicator and "Show All" toggle
4. **Configuration:** Add user preference for limit override

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/review/ReviewQueue.test.ts
describe('ReviewQueue - Anti-Overwhelm Limits', () => {
  it('should limit items to 20 in all-venture view', () => {
    // Test limit enforcement
  });

  it('should limit items to 8 in venture-specific view', () => {
    // Test venture limit
  });

  it('should show overflow indicator when items exceed limit', () => {
    // Test overflow indicator
  });

  it('should allow "Show All" toggle to override limits', () => {
    // Test limit override
  });
});
```

**Step 2: Enhance Review Queue API Integration**
- Update `ReviewQueue` component to pass `limit` parameter
- Default: 20 for all-venture, 8 for venture-specific
- Add overflow count calculation

**Step 3: Implement UI Components**
- Add overflow indicator badge
- Add "Show All" / "Show Limited" toggle
- Add visual indicator when limits are active

**Files to Create/Modify:**
- ✅ `frontend/src/components/review/ReviewQueue.ts` (modify - add limits)
- ✅ `frontend/src/components/review/OverflowIndicator.ts` (new)
- ✅ `frontend/src/api/review-api.ts` (modify - add limit parameter)
- ✅ `frontend/src/styles/review-queue.css` (modify - add overflow styles)

**SOLID Principles:**
- **SRP:** `OverflowIndicator` only handles overflow display
- **OCP:** Limits configurable without modifying core component
- **DIP:** Depends on API interface, not implementation

---

#### Feature 1.6: Visible first_action and resume_hint in Queue (ADHD CRITICAL)
**Priority:** CRITICAL (ADHD MVP)
**Effort:** Medium (2 weeks)
**Dependencies:** Review queue API returns first_action/resume_hint

**User Story:**
> As an ADHD user, I want to see the first action and resume hints directly in the queue list so I can quickly identify what to start without opening each note.

**Acceptance Criteria:**
- `first_action` displayed in queue for `status=ready` items
- `resume_hint` displayed in queue for `status=paused` or `in-progress` items
- Text truncated to 160 characters with ellipsis
- Visual highlighting (bold or colored) for visibility
- Color-coded by status (ready = green, paused = yellow, in-progress = blue)
- Click to expand full text if truncated

**Technical Approach:**
1. **API:** Ensure review queue API includes `first_action` and `resume_hint` fields
2. **Component:** Enhance `ReviewQueueItem` to display these fields
3. **Styling:** Add visual indicators and truncation

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/review/ReviewQueueItem.test.ts
describe('ReviewQueueItem - first_action/resume_hint', () => {
  it('should display first_action for ready items', () => {
    // Test first_action display
  });

  it('should display resume_hint for paused items', () => {
    // Test resume_hint display
  });

  it('should truncate text to 160 characters', () => {
    // Test truncation
  });

  it('should highlight first_action/resume_hint visually', () => {
    // Test visual highlighting
  });
});
```

**Step 2: Enhance ReviewQueueItem Component**
- Add `first_action` display for `status=ready`
- Add `resume_hint` display for `status=paused` or `in-progress`
- Implement truncation and expand functionality
- Add color coding

**Step 3: Add Styling**
- Create CSS for first_action/resume_hint display
- Add color coding (green/yellow/blue)
- Add truncation styles

**Files to Create/Modify:**
- ✅ `frontend/src/components/review/ReviewQueueItem.ts` (modify)
- ✅ `frontend/src/components/review/ReviewQueueItem.test.ts` (modify)
- ✅ `frontend/src/styles/review-queue-item.css` (modify)

**SOLID Principles:**
- **SRP:** Display logic separated from data fetching
- **OCP:** Extensible for additional field displays
- **DIP:** Depends on API data structure, not implementation

---

#### Feature 1.7: Quick Status Transitions (ADHD CRITICAL)
**Priority:** CRITICAL (ADHD MVP)
**Effort:** Medium (2 weeks)
**Dependencies:** Status update API

**User Story:**
> As an ADHD user, I want to quickly change note status with one click so I can maintain momentum without friction.

**Acceptance Criteria:**
- "Start" button for `ready` items → transitions to `in-progress`
- "Complete" button for `in-progress` items → transitions to `done`
- "Pause" button for `in-progress` items → transitions to `paused` (prompts for resume_hint)
- Status changes visible immediately (optimistic updates)
- Toast notification confirms status change
- Momentum score increments visible immediately

**Technical Approach:**
1. **Component:** Add status transition buttons to `ReviewQueueItem`
2. **API:** Use existing status update endpoint
3. **UI:** Optimistic updates with rollback on error

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/review/StatusTransitionButtons.test.ts
describe('StatusTransitionButtons', () => {
  it('should show "Start" button for ready items', () => {
    // Test button display
  });

  it('should transition ready → in-progress on "Start" click', () => {
    // Test transition
  });

  it('should show "Complete" button for in-progress items', () => {
    // Test button display
  });

  it('should prompt for resume_hint when pausing', () => {
    // Test pause workflow
  });
});
```

**Step 2: Implement Component**
- Create `StatusTransitionButtons` component
- Add buttons based on current status
- Implement optimistic updates
- Add error handling with rollback

**Step 3: Integrate into ReviewQueueItem**
- Add status transition buttons to queue item
- Handle status change events
- Update UI immediately

**Files to Create/Modify:**
- ✅ `frontend/src/components/review/StatusTransitionButtons.ts` (new)
- ✅ `frontend/src/components/review/StatusTransitionButtons.test.ts` (new)
- ✅ `frontend/src/components/review/ReviewQueueItem.ts` (modify)
- ✅ `frontend/src/styles/status-transitions.css` (new)

**SOLID Principles:**
- **SRP:** `StatusTransitionButtons` only handles status transitions
- **OCP:** Extensible for additional transition types
- **DIP:** Depends on status update API interface

---

#### Feature 1.8: Momentum Score Visualization (ADHD CRITICAL)
**Priority:** CRITICAL (ADHD MVP)
**Effort:** Low (1 week)
**Dependencies:** Momentum score in API response

**User Story:**
> As an ADHD user, I want to see my momentum scores and progress visually so I get dopamine feedback that reinforces my engagement.

**Acceptance Criteria:**
- Momentum score displayed in queue (e.g., "Momentum: +5")
- Visual indicator (progress bar, badge, or icon)
- Color-coded by momentum level (low = gray, medium = yellow, high = green)
- Momentum increments visible immediately on status change
- Weekly momentum summary available

**Technical Approach:**
1. **Component:** Create `MomentumIndicator` component
2. **Styling:** Add visual indicators and color coding
3. **Integration:** Add to `ReviewQueueItem` and summary views

**Implementation Steps:**

**Step 1: Write Tests First (TDD)**
```typescript
// frontend/src/components/common/MomentumIndicator.test.ts
describe('MomentumIndicator', () => {
  it('should display momentum score', () => {
    // Test display
  });

  it('should color-code by momentum level', () => {
    // Test color coding
  });

  it('should show visual progress indicator', () => {
    // Test progress bar
  });
});
```

**Step 2: Implement Component**
- Create `MomentumIndicator` component
- Add color coding logic (low/medium/high thresholds)
- Add progress bar or badge display

**Step 3: Integrate**
- Add to `ReviewQueueItem`
- Add to queue summary header
- Update on status changes

**Files to Create/Modify:**
- ✅ `frontend/src/components/common/MomentumIndicator.ts` (new)
- ✅ `frontend/src/components/common/MomentumIndicator.test.ts` (new)
- ✅ `frontend/src/styles/momentum-indicator.css` (new)
- ✅ `frontend/src/components/review/ReviewQueueItem.ts` (modify)

**SOLID Principles:**
- **SRP:** `MomentumIndicator` only handles momentum display
- **OCP:** Extensible for different visualization types
- **DIP:** Depends on momentum score data structure

---

### Phase 2: Important Features (SHOULD HAVE) - 3-4 weeks

#### Feature 2.1: Energy Mode and Effort Estimate Filtering (ADHD IMPORTANT)
**Priority:** IMPORTANT (ADHD MVP)
**Effort:** Medium (2 weeks)
**Dependencies:** Filter API support

**User Story:**
> As an ADHD user, I want to filter tasks by energy mode and effort estimate so I can match tasks to my current capacity and find quick wins.

**Acceptance Criteria:**
- Filter by `energy_mode`: calm, creative, grunt, people
- Filter by `effort_estimate_min`: 5-15 min, 15-30 min, 30-60 min, 60+ min
- Quick filter buttons in queue header
- Visual indicators for each energy mode (icons or colors)
- Sort by effort estimate (quick wins first)

**Implementation:**
- Add filter controls to `ReviewQueue` header
- Update API calls with filter parameters
- Add visual indicators for energy modes
- Implement sorting by effort estimate

**Files:**
- ✅ `frontend/src/components/review/ReviewQueue.ts` (modify - add filters)
- ✅ `frontend/src/components/review/EnergyModeFilter.ts` (new)
- ✅ `frontend/src/components/review/EffortEstimateFilter.ts` (new)

---

#### Feature 2.2: Quick Review Workflow (ADHD IMPORTANT)
**Priority:** IMPORTANT (ADHD MVP)
**Effort:** Medium (2 weeks)
**Dependencies:** Review workflow API

**User Story:**
> As an ADHD user, I want to quickly mark notes as reviewed without opening them so I can maintain review compliance with minimal friction.

**Acceptance Criteria:**
- "Mark as Reviewed" button for selected items (without opening)
- "Mark All Visible as Reviewed" for quick bulk operations
- "Flag for Review" to add items back to review queue
- Review stage indicators (unreviewed, in_progress, complete)
- Quick stage transitions

**Implementation:**
- Add batch review operations to `ReviewQueue`
- Add review stage indicators to `ReviewQueueItem`
- Implement quick review API calls
- Add confirmation for bulk operations

**Files:**
- ✅ `frontend/src/components/review/QuickReviewActions.ts` (new)
- ✅ `frontend/src/components/review/ReviewQueue.ts` (modify)
- ✅ `frontend/src/api/review-api.ts` (modify - add review methods)

---

#### Feature 2.3: Create New Notes
**Priority:** IMPORTANT
**Effort:** Medium (2 weeks)

**User Story:**
> As a user, I want to create new notes from the GUI so I can add notes without leaving the application.

**Implementation:**
- Add "New Note" button to review queue
- Create `NoteCreator` component with form
- Template support (optional)
- Save to backend via POST endpoint

**Files:**
- ✅ `frontend/src/components/notes/NoteCreator.ts` (new)
- ✅ `frontend/src/components/notes/NoteCreator.test.ts` (new)
- ✅ `frontend/src/components/review/ReviewQueue.ts` (modify - add button)

---

#### Feature 2.2: Delete Notes
**Priority:** IMPORTANT
**Effort:** Low (1 week)

**User Story:**
> As a user, I want to delete notes so I can remove notes that are no longer needed.

**Implementation:**
- Add delete button to `NoteDetail`
- Confirmation modal
- Soft delete (archive) option
- Remove from queue after delete

**Files:**
- ✅ `frontend/src/components/common/ConfirmationModal.ts` (new)
- ✅ `frontend/src/components/notes/NoteDetail.ts` (modify)

---

#### Feature 2.3: Keyboard Shortcuts
**Priority:** IMPORTANT
**Effort:** Medium (2 weeks)

**User Story:**
> As a power user, I want keyboard shortcuts so I can work more efficiently without using the mouse.

**Shortcuts:**
- `Ctrl+S`: Save current changes
- `Esc`: Cancel/Close current dialog
- `Ctrl+N`: New note
- `Ctrl+F`: Focus search
- `Ctrl+/`: Show keyboard shortcuts help
- Arrow keys: Navigate queue items
- `Enter`: Open selected note

**Implementation:**
- Create `KeyboardShortcutManager` service
- Register shortcuts globally
- Help modal component
- Update components to use shortcuts

**Files:**
- ✅ `frontend/src/services/KeyboardShortcutManager.ts` (new)
- ✅ `frontend/src/components/common/ShortcutHelp.ts` (new)

---

#### Feature 2.4: Search Functionality
**Priority:** IMPORTANT
**Effort:** High (3 weeks)

**User Story:**
> As a user, I want to search for notes so I can quickly find specific notes without scrolling through the queue.

**Implementation:**
- Search bar in header
- Full-text search API endpoint (backend required)
- Search results component
- Highlighting of matches

**Files:**
- ✅ `frontend/src/components/common/SearchBar.ts` (new)
- ✅ `frontend/src/components/common/SearchResults.ts` (new)
- ✅ `frontend/src/api/notes-api.ts` (modify - add search method)

---

## 3. Implementation Guidelines

### 3.1 TDD Process (MANDATORY)

**For Each Feature:**
1. **RED:** Write failing tests first
2. **GREEN:** Implement minimal code to pass
3. **REFACTOR:** Improve code quality
4. **DOCUMENT:** Update documentation

**Test Coverage Requirements:**
- Unit tests: 100% coverage for new components
- Integration tests: API integration points
- E2E tests: Critical user workflows

### 3.2 SOLID Principles

**Single Responsibility Principle (SRP):**
- Each component has ONE responsibility
- Separate concerns (display, editing, API calls)

**Open/Closed Principle (OCP):**
- Components open for extension, closed for modification
- Use composition over inheritance

**Liskov Substitution Principle (LSP):**
- Subtypes must be substitutable for base types
- Interfaces define contracts

**Interface Segregation Principle (ISP):**
- Clients depend only on interfaces they use
- Small, focused interfaces

**Dependency Inversion Principle (DIP):**
- Depend on abstractions, not concretions
- Use dependency injection

### 3.3 Git Strategy

**Branch Naming:**
- `feature/frontend/markdown-rendering`
- `feature/frontend/note-body-editor`
- `feature/frontend/toast-notifications`
- `feature/frontend/inline-editing`

**Commit Frequency:**
- Commit after each test passes (RED → GREEN)
- Commit after refactoring
- Commit after documentation updates

**Commit Messages:**
- `feat(frontend): add markdown rendering for note body`
- `test(frontend): add tests for MarkdownRenderer component`
- `refactor(frontend): extract markdown styles to separate file`
- `docs(frontend): update VOC analysis with markdown rendering`

### 3.4 Documentation Updates

**For Each Feature:**
1. Update `README.md` if needed
2. Update component JSDoc comments
3. Update API documentation if endpoints change
4. Update user guide if workflow changes

---

## 4. Testing Strategy

### 4.1 Unit Tests
- **Coverage:** 100% for all new components
- **Framework:** Vitest
- **Location:** `frontend/src/**/*.test.ts`

### 4.2 Integration Tests
- **Coverage:** API integration points
- **Framework:** Vitest with MSW (Mock Service Worker)
- **Location:** `frontend/src/api/**/*.test.ts`

### 4.3 E2E Tests
- **Coverage:** Critical user workflows
- **Framework:** Playwright
- **Location:** `frontend/e2e/**/*.spec.ts`

**E2E Test Scenarios:**
1. User edits note body and saves
2. User edits metadata inline
3. User creates new note
4. User deletes note
5. User uses keyboard shortcuts
6. User searches for notes

---

## 5. Success Criteria

### 5.1 Phase 1 Completion Criteria
- ✅ Markdown rendering works for all note bodies
- ✅ Note body editor allows editing and saving
- ✅ Toast notifications appear for all actions
- ✅ Inline editing works for metadata fields
- ✅ **Launchpad limits enforced (max 20 items, max 8 per venture)**
- ✅ **first_action and resume_hint visible in queue**
- ✅ **Quick status transitions work (one-click)**
- ✅ **Momentum score visualization displays correctly**
- ✅ All tests passing (100% coverage)
- ✅ No console errors
- ✅ Documentation updated
- ✅ **ADHD MVP alignment verified**

### 5.2 Phase 2 Completion Criteria
- ✅ Users can create new notes
- ✅ Users can delete notes
- ✅ Keyboard shortcuts work as specified
- ✅ Search functionality works
- ✅ **Energy mode and effort estimate filtering works**
- ✅ **Quick review workflow implemented**
- ✅ **Context need indicators displayed**
- ✅ All tests passing
- ✅ Documentation updated
- ✅ **ADHD MVP features validated**

---

## 6. Risk Mitigation

### 6.1 Technical Risks
- **Markdown library conflicts:** Use well-maintained library, test thoroughly
- **Editor performance:** Lazy load editor, optimize rendering
- **Browser compatibility:** Test on major browsers

### 6.2 User Experience Risks
- **Learning curve:** Provide tutorials, help modals
- **Feature overload:** Progressive disclosure, feature flags

---

## 7. Timeline

### Phase 1: Critical Features (6-8 weeks) - ADHD MVP Focus
- **Week 1-2:** Markdown rendering + Launchpad limits
- **Week 3-4:** Visible first_action/resume_hint + Quick status transitions
- **Week 5-6:** Note body editor + Momentum visualization
- **Week 7:** Toast notifications + Inline editing
- **Week 8:** Integration testing and ADHD MVP validation

### Phase 2: Important Features (4-5 weeks) - ADHD Supportive
- **Week 9-10:** Energy mode/effort filtering + Quick review workflow
- **Week 11:** Create/Delete notes
- **Week 12:** Keyboard shortcuts
- **Week 13:** Search functionality

---

## 8. Next Steps

1. **Review and approve this plan**
2. **Set up feature branches**
3. **Begin Phase 1 implementation**
4. **Weekly progress reviews**
5. **User testing after Phase 1**

---

## 9. ADHD MVP Alignment & Scalability

### 9.1 ADHD MVP Compatibility

**Verified Compatibility:**
- ✅ **Anti-Overwhelm Limits:** Aligns with MVP requirement (max 20 items, max 8 per venture)
- ✅ **First Action Visibility:** Supports MVP first_action field (≤160 chars, visible in queue)
- ✅ **Resume Hint Visibility:** Supports MVP resume_hint field (≤160 chars, visible in queue)
- ✅ **Status Transitions:** Supports MVP status workflow (inbox → ready → in-progress → paused → done)
- ✅ **Momentum Scoring:** Supports MVP momentum_score tracking and visualization
- ✅ **Energy Modes:** Supports MVP energy_mode field (calm, creative, grunt, people)
- ✅ **Effort Estimates:** Supports MVP effort_estimate_min field (5-120 min)
- ✅ **Context Need:** Supports MVP context_need field (low, medium, high)

**MVP Integration Points:**
- Review queue API returns all MVP-required fields
- Status transitions update momentum scores (backend responsibility)
- First action and resume hint generation (backend responsibility)
- Daily primers and weekly momentum reports (backend responsibility, frontend displays)

### 9.2 Scalability Considerations

**Performance at Scale:**
- **Virtual Scrolling:** Plan for 1000+ items (Phase 3)
- **Lazy Loading:** Load note details on-demand
- **Caching:** Cache queue results and note details
- **Incremental Updates:** Update queue incrementally after edits

**Data Growth:**
- **Archive Strategy:** Auto-archive old notes (backend)
- **Search Indexing:** Full-text search for 10,000+ notes (Phase 3)
- **Backup Strategy:** Automated daily backups (backend)

**Multi-Venture Scalability:**
- **Dynamic Ventures:** Support adding ventures without code changes (Phase 3)
- **Venture Templates:** Template-based note creation (Phase 3)
- **Venture Analytics:** Per-venture momentum tracking (Phase 3)

### 9.3 Adoption & Integration Features

**Onboarding:**
- **First-Time User Tour:** Guide users through ADHD-specific features
- **Feature Discovery:** Progressive disclosure of advanced features
- **Help Modals:** Context-sensitive help for ADHD features

**Integration:**
- **Keyboard Shortcuts:** Reduce cognitive load for power users
- **Batch Operations:** Support common ADHD workflows (mark multiple as ready, update energy modes)
- **Export Functionality:** Export queue for external analysis (Phase 3)

**Engagement:**
- **Momentum Feedback:** Visual progress indicators reinforce engagement
- **Status Transition Celebrations:** Visual feedback on task completion
- **Weekly Momentum Reports:** Display weekly momentum summaries (backend provides, frontend displays)

---

**Document Status:** ENHANCED FOR ADHD MVP ALIGNMENT
**Owner:** Frontend Team Lead
**Review Date:** Weekly during implementation
**MVP Alignment:** ✅ Compatible with SecondBrain ADHD-focused MVP requirements
**Scalability:** ✅ Designed for growth from 100s to 10,000s of notes

