# Toast Notifications Implementation

## Overview

This document describes the implementation of the toast notification system in the Review GUI frontend.

## Feature Description

The Toast Notification System provides user feedback for actions throughout the application. Toasts appear temporarily to confirm successful actions, display errors, or provide informational messages.

## Implementation Details

### Component: Toast

**Location:** `frontend/src/components/common/Toast.ts`

**Responsibilities:**
- Display toast message with type styling
- Handle auto-dismiss after duration
- Provide manual dismiss button

**SOLID Principles:**
- **SRP:** Single responsibility - toast display only
- **OCP:** Extensible for additional toast types

**Key Methods:**
- `render()`: Creates toast UI with message and close button
- `dismiss()`: Removes toast and emits dismiss event
- `startAutoDismiss()`: Sets timer for automatic dismissal

### Service: ToastManager

**Location:** `frontend/src/services/ToastManager.ts`

**Responsibilities:**
- Create and display toast notifications globally
- Manage toast stacking and positioning
- Limit maximum number of toasts
- Provide convenience methods for different toast types

**SOLID Principles:**
- **SRP:** Single responsibility - toast lifecycle management
- **Singleton pattern** for global access

**Key Methods:**
- `show(message, type, duration)`: Display a toast
- `success(message, duration)`: Display success toast
- `error(message, duration)`: Display error toast
- `warning(message, duration)`: Display warning toast
- `info(message, duration)`: Display info toast
- `clear()`: Remove all toasts
- `setMaxToasts(max)`: Set maximum number of visible toasts

### Integration

ToastManager is integrated into action components:
- **NoteBodyEditor**: Shows success/error toasts when saving
- **StatusUpdater**: Shows success/error toasts when updating status
- **NoteEditor**: Shows success/error toasts when updating metadata
- **BatchActions**: Shows success/warning toasts for batch operations

## Toast Types

- **success**: Green background, for successful actions
- **error**: Red background, for errors
- **warning**: Yellow background, for warnings
- **info**: Blue background, for informational messages

## Styling

**Location:** `frontend/src/styles/toast.css`

- Fixed positioning (top-right)
- Slide-in animation
- Responsive design (full-width on mobile)
- Accessible (ARIA labels, keyboard navigation)

## Usage

```typescript
import { ToastManager } from './services/ToastManager';

// Show success toast
ToastManager.getInstance().success('Operation completed successfully');

// Show error toast
ToastManager.getInstance().error('Failed to save changes');

// Show warning toast
ToastManager.getInstance().warning('Some items failed to update');

// Show info toast
ToastManager.getInstance().info('Processing your request...');

// Custom duration (in milliseconds)
ToastManager.getInstance().success('Quick message', 2000);
```

## Testing

**Unit Tests:**
- `frontend/src/components/common/Toast.test.ts`
- `frontend/src/services/ToastManager.test.ts`

**E2E Tests:** `frontend/e2e/toast-notifications.spec.ts`
- Tests toast display on actions
- Tests auto-dismiss behavior
- Tests manual dismissal
- Tests error toast display

## Future Enhancements

Potential improvements:
1. Toast actions (e.g., "Undo" button)
2. Progress toasts for long-running operations
3. Toast queue management for better UX
4. Custom toast positions (bottom-left, top-left, etc.)
5. Toast grouping for similar messages

## Related Documentation

- [Frontend Enhancement Plan](./FRONTEND_ENHANCEMENT_PLAN.md)

