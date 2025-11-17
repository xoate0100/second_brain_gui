# Frontend Review Workflow Integration Guide

## Overview

This document details the new review workflow functionality available in the Second Brain API. The review workflow allows the frontend to manage note review states, track which fields need review, and add review-specific comments.

## New Review Workflow Fields

The following fields have been added to note update endpoints:

### Review Stage (`review_stage`)
- **Type**: String (enum)
- **Values**: `"unreviewed"`, `"in_progress"`, `"complete"`
- **Description**: Tracks the current stage of the review process
- **Default**: `"unreviewed"` (when `needs_review` is true)

### Needs Review Flag (`needs_review`)
- **Type**: Boolean
- **Description**: Indicates whether the note requires review
- **Default**: `true` (for notes flagged for review)

### Review Fields (`review_fields`)
- **Type**: Array of strings
- **Description**: List of field names that require review (e.g., `["venture", "tags", "title"]`)
- **Example**: `["venture", "domain", "tags"]`

### Review Notes (`review_notes`)
- **Type**: String
- **Description**: Review-specific notes or comments
- **Example**: `"Updated venture classification after review"`

## API Endpoints

### 1. Update Note Metadata (PUT /api/v1/notes/{note_id})

Update note metadata including review workflow fields.

**Endpoint**: `PUT /api/v1/notes/{note_id}`

**Request Example**:
```json
{
  "venture": "CRL",
  "domain": "ops",
  "tags": ["tag1", "tag2"],
  "review_stage": "in_progress",
  "needs_review": true,
  "review_fields": ["venture", "tags"],
  "review_notes": "Reviewing venture classification and tag accuracy"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "note_id": "20250101-1200-test-note",
    "venture": "CRL",
    "domain": "ops",
    "tags": ["tag1", "tag2"],
    "review_stage": "in_progress",
    "needs_review": true,
    "review_fields": ["venture", "tags"],
    "review_notes": "Reviewing venture classification and tag accuracy",
    "last_touch": "2025-01-31T12:00:00Z"
  }
}
```

### 2. Update Note Status (PUT /api/v1/notes/{note_id}/status)

Update note status and optionally review workflow fields.

**Endpoint**: `PUT /api/v1/notes/{note_id}/status`

**Request Example**:
```json
{
  "status": "in-progress",
  "review_stage": "in_progress",
  "review_notes": "Marking as in-progress for review"
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "note_id": "20250101-1200-test-note",
    "status": "in-progress",
    "review_stage": "in_progress",
    "review_notes": "Marking as in-progress for review",
    "momentum_score": 20
  }
}
```

### 3. Batch Update Notes (POST /api/v1/notes/batch-update)

Update multiple notes including review workflow fields.

**Endpoint**: `POST /api/v1/notes/batch-update`

**Request Example**:
```json
{
  "updates": [
    {
      "note_id": "20250101-1200-test-note",
      "review_stage": "complete",
      "needs_review": false,
      "review_notes": "Review completed"
    },
    {
      "note_id": "20250101-1300-another-note",
      "review_stage": "in_progress",
      "review_fields": ["venture", "tags"]
    }
  ]
}
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "note_id": "20250101-1200-test-note",
        "success": true
      },
      {
        "note_id": "20250101-1300-another-note",
        "success": true
      }
    ],
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

## Frontend Implementation Guide

### 1. Review Queue Display

When displaying items from the review queue (`GET /api/v1/review/queue`), you can now show review-specific information:

```typescript
interface ReviewItem {
  note_id: string;
  title: string;
  review_stage: "unreviewed" | "in_progress" | "complete";
  needs_review: boolean;
  review_fields?: string[];
  review_notes?: string;
  // ... other note fields
}
```

### 2. Review Stage Workflow

Implement a workflow that allows users to progress through review stages:

```typescript
// Start review
async function startReview(noteId: string) {
  await updateNote(noteId, {
    review_stage: "in_progress"
  });
}

// Complete review
async function completeReview(noteId: string, notes?: string) {
  await updateNote(noteId, {
    review_stage: "complete",
    needs_review: false,
    review_notes: notes
  });
}

// Mark as reviewed without changing stage
async function markAsReviewed(noteId: string) {
  await updateNote(noteId, {
    needs_review: false
  });
}
```

### 3. Field-Specific Review

Track which fields need review:

```typescript
// Flag specific fields for review
async function flagFieldsForReview(noteId: string, fields: string[]) {
  await updateNote(noteId, {
    review_fields: fields,
    needs_review: true,
    review_stage: "unreviewed"
  });
}

// Clear review flags after updating fields
async function updateFieldsAndClearReview(noteId: string, updates: any) {
  await updateNote(noteId, {
    ...updates,
    review_fields: [],
    review_stage: "complete",
    needs_review: false
  });
}
```

### 4. Review Comments

Add review-specific notes:

```typescript
// Add review comment
async function addReviewComment(noteId: string, comment: string) {
  await updateNote(noteId, {
    review_notes: comment
  });
}

// Update review comment
async function updateReviewComment(noteId: string, comment: string) {
  const note = await getNote(noteId);
  const existingNotes = note.review_notes || "";
  await updateNote(noteId, {
    review_notes: `${existingNotes}\n${new Date().toISOString()}: ${comment}`
  });
}
```

### 5. Batch Review Operations

Process multiple notes at once:

```typescript
// Mark multiple notes as reviewed
async function batchMarkAsReviewed(noteIds: string[]) {
  await batchUpdateNotes(
    noteIds.map(id => ({
      note_id: id,
      review_stage: "complete",
      needs_review: false
    }))
  );
}

// Start review for multiple notes
async function batchStartReview(noteIds: string[]) {
  await batchUpdateNotes(
    noteIds.map(id => ({
      note_id: id,
      review_stage: "in_progress"
    }))
  );
}
```

## UI/UX Recommendations

### Review Stage Indicators

- **Unreviewed**: Show with a warning/alert icon (yellow/orange)
- **In Progress**: Show with a clock/spinner icon (blue)
- **Complete**: Show with a checkmark icon (green)

### Review Fields Display

When `review_fields` is present, highlight those fields in the UI:
- Show a badge or indicator next to fields that need review
- Allow users to click on fields to update them
- Clear the field from `review_fields` when updated

### Review Notes

- Display `review_notes` in a dedicated section or tooltip
- Allow inline editing of review notes
- Show timestamp if notes are updated multiple times

### Workflow Actions

Provide clear actions for each review stage:
- **Unreviewed** → "Start Review" (sets `review_stage: "in_progress"`)
- **In Progress** → "Complete Review" (sets `review_stage: "complete"`, `needs_review: false`)
- **Complete** → "Re-open Review" (sets `review_stage: "unreviewed"`, `needs_review: true`)

## Validation Rules

### Review Stage Values
- Must be one of: `"unreviewed"`, `"in_progress"`, `"complete"`
- Returns `422 Validation Error` if invalid value provided

### Review Fields
- Must be an array of strings
- Field names should match actual note fields (e.g., `"venture"`, `"domain"`, `"tags"`, `"title"`)
- Empty array `[]` is valid (clears review fields)

### Review Notes
- Must be a string
- No length restrictions (but consider UI constraints)
- Can be empty string `""` (clears review notes)

## Error Handling

### Common Errors

**422 Validation Error** - Invalid `review_stage` value:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid review_stage value. Must be one of: unreviewed, in_progress, complete"
  }
}
```

**404 Not Found** - Note doesn't exist:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Note with ID 'invalid-id' not found"
  }
}
```

## Example Integration

### React Component Example

```typescript
import { useState } from 'react';

function ReviewWorkflow({ noteId, initialReview }) {
  const [reviewStage, setReviewStage] = useState(initialReview.review_stage);
  const [reviewNotes, setReviewNotes] = useState(initialReview.review_notes || '');
  const [reviewFields, setReviewFields] = useState(initialReview.review_fields || []);

  const handleStageChange = async (newStage) => {
    try {
      await updateNote(noteId, {
        review_stage: newStage,
        review_notes: reviewNotes
      });
      setReviewStage(newStage);
    } catch (error) {
      console.error('Failed to update review stage:', error);
    }
  };

  const handleCompleteReview = async () => {
    try {
      await updateNote(noteId, {
        review_stage: 'complete',
        needs_review: false,
        review_notes: reviewNotes
      });
      setReviewStage('complete');
    } catch (error) {
      console.error('Failed to complete review:', error);
    }
  };

  return (
    <div className="review-workflow">
      <div className="review-stage">
        <label>Review Stage:</label>
        <select 
          value={reviewStage} 
          onChange={(e) => handleStageChange(e.target.value)}
        >
          <option value="unreviewed">Unreviewed</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
      </div>
      
      {reviewFields.length > 0 && (
        <div className="review-fields">
          <label>Fields Requiring Review:</label>
          <ul>
            {reviewFields.map(field => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="review-notes">
        <label>Review Notes:</label>
        <textarea
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="Add review notes or comments..."
        />
      </div>
      
      <button onClick={handleCompleteReview}>
        Complete Review
      </button>
    </div>
  );
}
```

## Testing

### Test Cases

1. **Update review stage**: Verify `review_stage` updates correctly
2. **Toggle needs_review**: Verify `needs_review` flag toggles
3. **Set review fields**: Verify `review_fields` array updates
4. **Add review notes**: Verify `review_notes` string updates
5. **Invalid review_stage**: Verify validation error for invalid values
6. **Batch updates**: Verify multiple notes update correctly
7. **Partial updates**: Verify only provided fields are updated

### Example Test Requests

```bash
# Update review stage
curl -X PUT "http://localhost:8080/api/v1/notes/20250101-1200-test-note" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"review_stage": "in_progress"}'

# Complete review
curl -X PUT "http://localhost:8080/api/v1/notes/20250101-1200-test-note" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"review_stage": "complete", "needs_review": false, "review_notes": "Review completed"}'

# Flag fields for review
curl -X PUT "http://localhost:8080/api/v1/notes/20250101-1200-test-note" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"review_fields": ["venture", "tags"], "needs_review": true}'
```

## Migration Notes

### Existing Notes

- Existing notes without review fields will have `needs_review: false` by default
- When `needs_review` is set to `true`, `review_stage` defaults to `"unreviewed"`
- Review fields can be added incrementally - no migration required

### Backward Compatibility

- All review workflow fields are optional
- Existing API calls without review fields will continue to work
- Review fields are additive - they don't break existing functionality

## Support

For questions or issues with the review workflow API:
- Check the main [API Reference](./API_REFERENCE.md) for endpoint details
- Review error responses for validation issues
- Ensure API key has `write:notes` and `write:review` scopes

