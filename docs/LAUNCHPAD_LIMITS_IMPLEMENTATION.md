# Launchpad Limits Implementation

## Overview

This document describes the implementation of launchpad anti-overwhelm limits in the Review GUI frontend. This is a critical ADHD-friendly feature that prevents decision paralysis by limiting the number of visible items.

## Feature Description

The Launchpad Limits feature enforces maximum item counts in the review queue to prevent cognitive overload:
- **All Ventures View**: Maximum 20 items
- **Per-Venture View**: Maximum 8 items per venture
- **Show All Toggle**: Users can override limits to see all items

## Implementation Details

### Component: OverflowIndicator

**Location:** `frontend/src/components/review/OverflowIndicator.ts`

**Responsibilities:**
- Display count of hidden items
- Provide "Show All" button
- Emit event when "Show All" is clicked

**SOLID Principles:**
- **SRP:** Single responsibility - overflow indication only

### Integration: ReviewQueue Component

**Location:** `frontend/src/components/review/ReviewQueue.ts`

The `ReviewQueue` component enforces limits:

1. **Limit Application**: `applyLaunchpadLimits()` method slices items array
2. **API Integration**: Adds `limit` parameter to API requests
3. **Overflow Display**: Shows `OverflowIndicator` when items are hidden
4. **Show All Toggle**: `showAllItems` flag overrides limits

**Limit Logic:**
- If `showAllItems` is true: Show all items
- If `venture` filter is set: Max 8 items
- Otherwise: Max 20 items

### API Integration

**Location:** `frontend/src/api/types.ts`

Added `show_all?: boolean` to `ReviewQueueParams` to allow overriding limits via API.

## User Experience

1. **Default View**: User sees limited items (20 all-venture, 8 per-venture)
2. **Overflow Indicator**: Shows count of hidden items and "Show All" button
3. **Show All**: User clicks "Show All" to see all items
4. **Persistent State**: Show all state persists until page reload

## Testing

**Unit Tests:** `frontend/src/components/review/OverflowIndicator.test.ts`
- Tests rendering with count
- Tests "Show All" button click
- Tests event emission

**E2E Tests:** `frontend/e2e/launchpad-limits.spec.ts`
- Tests 20-item limit for all ventures
- Tests 8-item limit per venture
- Tests "Show All" functionality

## ADHD Benefits

- **Reduces Decision Paralysis**: Fewer items = easier choices
- **Prevents Overwhelm**: Limits prevent cognitive overload
- **User Control**: "Show All" gives users control when needed
- **Clear Feedback**: Overflow indicator shows what's hidden

## Future Enhancements

Potential improvements:
1. User-configurable limits (settings)
2. Per-venture limit customization
3. Remember user preference (localStorage)
4. Smart prioritization within limits

## Related Documentation

- [Frontend Enhancement Plan](./FRONTEND_ENHANCEMENT_PLAN.md)
- [VOC/CTQ Analysis](./VOC_CTQ_ANALYSIS.md)

