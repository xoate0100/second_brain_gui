# Visible Action Hints Implementation

## Overview

This document describes the implementation of visible `first_action` and `resume_hint` fields in the review queue. This is a critical ADHD-friendly feature that reduces cognitive load by making action hints immediately visible.

## Feature Description

The Visible Action Hints feature displays `first_action` and `resume_hint` fields directly in the review queue, eliminating the need to open a note to see what to do next. This reduces decision paralysis and improves task resumption.

## Implementation Details

### API Types Update

**Location:** `frontend/src/api/types.ts`

Added to `ReviewItem` interface:
- `first_action?: string` - What to do first with this note
- `resume_hint?: string` - Where to resume if paused

### Component Update: ReviewItem

**Location:** `frontend/src/components/review/ReviewItem.ts`

The `ReviewItem` component now displays:
1. **First Action**: Shows `first_action` field when present
2. **Resume Hint**: Shows `resume_hint` field when present
3. **Action Hints Container**: Groups both hints in a visible section

**Display Logic:**
- Both fields are shown in `.review-item__action-hints` container
- Each hint has its own class (`.review-item__first-action`, `.review-item__resume-hint`)
- Hints appear between title and metadata for visibility

## User Experience

1. **Immediate Visibility**: Users see action hints without opening notes
2. **Reduced Cognitive Load**: No need to remember or guess what to do
3. **Faster Decision Making**: Clear next steps visible at a glance
4. **Better Task Resumption**: Resume hints help pick up where left off

## ADHD Benefits

- **Reduces Decision Paralysis**: Clear action hints eliminate "what do I do?" moments
- **Improves Task Resumption**: Resume hints help context switching
- **Decreases Cognitive Load**: Information visible without navigation
- **Faster Workflow**: Less clicking, more doing

## Testing

**Unit Tests:** `frontend/src/components/review/ReviewItem.test.ts`
- Tests rendering of `first_action`
- Tests rendering of `resume_hint`
- Tests rendering of both together

**E2E Tests:** `frontend/e2e/visible-action-hints.spec.ts`
- Tests `first_action` display in browser
- Tests `resume_hint` display in browser
- Tests both fields together

## Future Enhancements

Potential improvements:
1. Highlight hints based on status (e.g., resume_hint for paused items)
2. Quick edit inline for action hints
3. Visual indicators (icons) for different hint types
4. Keyboard shortcuts to jump to items with hints

## Related Documentation

- [Frontend Enhancement Plan](./FRONTEND_ENHANCEMENT_PLAN.md)
- [VOC/CTQ Analysis](./VOC_CTQ_ANALYSIS.md)

