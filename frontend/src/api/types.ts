/**
 * API Request/Response Types
 * Type definitions for all API endpoints
 *
 * Responsibilities:
 * - Define request/response types for all endpoints
 * - Ensure type safety across API calls
 *
 * SOLID Principles:
 * - SRP: Single responsibility - type definitions
 * - ISP: Focused interfaces for each endpoint
 */

// Review Queue Types
export interface ReviewQueueParams {
  stage?: 'unreviewed' | 'in_progress' | 'complete';
  venture?: 'SWS' | 'CRL' | 'ERA' | 'SAE' | 'Personal';
  domain?: string;
  limit?: number; // default: 50, max: 100
  offset?: number; // default: 0
  sort_by?: 'momentum_score' | 'created' | 'age_days';
  order?: 'asc' | 'desc'; // default: 'desc'
}

export interface ReviewItem {
  note_id: string;
  title: string;
  venture: string;
  domain: string;
  status: string;
  age_days: number;
  momentum_score: number;
  // Review workflow fields
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  needs_review?: boolean;
  review_fields?: string[];
  review_notes?: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ReviewQueueResponse {
  items: ReviewItem[];
  pagination: Pagination;
}

// Note Detail Types
export interface NoteFrontmatter {
  id: string;
  title: string;
  status: string;
  venture: string;
  domain: string;
  tags: string[];
  ai_summary: string;
  momentum_score: number;
  age_days: number;
  aging_stage: string;
  first_action?: string;
  effort_estimate_min?: number;
  resume_hint?: string;
  completion_date?: string;
  review_notes?: string;
  follow_up_date?: string;
  // Review workflow fields
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  needs_review?: boolean;
  review_fields?: string[];
  [key: string]: unknown; // Allow other frontmatter fields
}

export interface NoteDetailResponse {
  note_id: string;
  file_path: string;
  frontmatter: NoteFrontmatter;
  body: string;
  created_at: string;
  updated_at: string;
}

// Status Update Types
export type NoteStatus = 'inbox' | 'ready' | 'in-progress' | 'paused' | 'done';

export interface StatusUpdateRequest {
  status: NoteStatus;
  review_notes?: string;
  follow_up_date?: string; // ISO format
  // Review workflow fields
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  needs_review?: boolean;
  review_fields?: string[];
}

export interface StatusUpdateResponse {
  note_id: string;
  status: string;
  previous_status: string;
  momentum_delta: number;
  updated_at: string;
  // Review workflow fields (if updated)
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  review_notes?: string;
}

// Note Update Types
export interface NoteUpdateRequest {
  venture?: string;
  domain?: string;
  tags?: string[];
  first_action?: string;
  effort_estimate_min?: number;
  resume_hint?: string;
  review_notes?: string;
  follow_up_date?: string;
  body?: string;
  // Review workflow fields
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  needs_review?: boolean;
  review_fields?: string[];
  [key: string]: unknown; // Allow other updatable fields
}

export interface NoteUpdateResponse {
  note_id: string;
  updated_fields: string[];
  updated_at: string;
  // Review workflow fields (if updated)
  review_stage?: 'unreviewed' | 'in_progress' | 'complete';
  needs_review?: boolean;
  review_fields?: string[];
  review_notes?: string;
}

// Batch Update Types
export interface BatchUpdateRequest {
  note_ids: string[];
  updates: NoteUpdateRequest & {
    status?: NoteStatus;
  };
}

export interface BatchUpdateResult {
  note_id: string;
  success: boolean;
  error?: string;
}

export interface BatchUpdateResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchUpdateResult[];
}

// Smart Suggestions Types
export type SuggestedAction = 'archive' | 'mark_done' | 'fix_classification' | 'update_status';

export interface Suggestion {
  note_id: string;
  suggested_action: SuggestedAction;
  confidence: number; // 0-1
  reason: string;
  note_summary: string;
}

export interface SuggestionParams {
  limit?: number; // default: 10
  venture?: string;
  domain?: string;
}

export interface SuggestionResponse {
  suggestions: Suggestion[];
}
