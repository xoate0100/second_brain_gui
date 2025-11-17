/**
 * API Types Tests
 * Tests for API request/response type definitions
 */

import { describe, it, expect } from 'vitest';
import type { ReviewQueueParams, ReviewItem, StatusUpdateRequest } from './types';

describe('API Types', () => {
  describe('ReviewQueueParams', () => {
    it('should allow optional parameters', () => {
      const params: ReviewQueueParams = {};
      expect(params).toBeDefined();
    });

    it('should accept all optional parameters', () => {
      const params: ReviewQueueParams = {
        stage: 'unreviewed',
        venture: 'SWS',
        domain: 'test',
        limit: 50,
        offset: 0,
        sort_by: 'momentum_score',
        order: 'desc',
      };
      expect(params.stage).toBe('unreviewed');
      expect(params.venture).toBe('SWS');
    });
  });

  describe('ReviewItem', () => {
    it('should have required fields', () => {
      const item: ReviewItem = {
        note_id: '123',
        title: 'Test Note',
        venture: 'SWS',
        domain: 'test',
        status: 'inbox',
        age_days: 5,
        momentum_score: 0.75,
      };
      expect(item.note_id).toBe('123');
      expect(item.momentum_score).toBe(0.75);
    });

    it('should support review workflow fields', () => {
      const item: ReviewItem = {
        note_id: '123',
        title: 'Test Note',
        venture: 'SWS',
        domain: 'test',
        status: 'inbox',
        age_days: 5,
        momentum_score: 0.75,
        review_stage: 'in_progress',
        needs_review: true,
        review_fields: ['venture', 'tags'],
        review_notes: 'Reviewing classification',
      };
      expect(item.review_stage).toBe('in_progress');
      expect(item.needs_review).toBe(true);
      expect(item.review_fields).toEqual(['venture', 'tags']);
      expect(item.review_notes).toBe('Reviewing classification');
    });
  });

  describe('StatusUpdateRequest', () => {
    it('should require status field', () => {
      const request: StatusUpdateRequest = {
        status: 'ready',
      };
      expect(request.status).toBe('ready');
    });

    it('should allow optional fields', () => {
      const request: StatusUpdateRequest = {
        status: 'done',
        review_notes: 'Completed',
        follow_up_date: '2025-02-01T00:00:00Z',
      };
      expect(request.review_notes).toBe('Completed');
    });

    it('should support review workflow fields', () => {
      const request: StatusUpdateRequest = {
        status: 'in-progress',
        review_stage: 'in_progress',
        needs_review: true,
        review_fields: ['venture'],
        review_notes: 'Starting review',
      };
      expect(request.review_stage).toBe('in_progress');
      expect(request.needs_review).toBe(true);
      expect(request.review_fields).toEqual(['venture']);
    });
  });

  describe('NoteUpdateRequest', () => {
    it('should support review workflow fields', () => {
      const request: NoteUpdateRequest = {
        venture: 'CRL',
        review_stage: 'complete',
        needs_review: false,
        review_fields: [],
        review_notes: 'Review completed',
      };
      expect(request.review_stage).toBe('complete');
      expect(request.needs_review).toBe(false);
      expect(request.review_fields).toEqual([]);
      expect(request.review_notes).toBe('Review completed');
    });

    it('should allow partial updates with review fields', () => {
      const request: NoteUpdateRequest = {
        review_stage: 'in_progress',
        review_fields: ['venture', 'tags'],
      };
      expect(request.review_stage).toBe('in_progress');
      expect(request.review_fields).toEqual(['venture', 'tags']);
    });
  });

  describe('NoteUpdateResponse', () => {
    it('should include review workflow fields in response', () => {
      const response: NoteUpdateResponse = {
        note_id: '123',
        updated_fields: ['review_stage', 'needs_review'],
        updated_at: '2025-01-31T12:00:00Z',
        review_stage: 'complete',
        needs_review: false,
        review_fields: [],
        review_notes: 'Review completed',
      };
      expect(response.review_stage).toBe('complete');
      expect(response.needs_review).toBe(false);
    });
  });

  describe('StatusUpdateResponse', () => {
    it('should include review workflow fields in response', () => {
      const response: StatusUpdateResponse = {
        note_id: '123',
        status: 'in-progress',
        previous_status: 'inbox',
        momentum_delta: 0.1,
        updated_at: '2025-01-31T12:00:00Z',
        review_stage: 'in_progress',
        review_notes: 'Status updated during review',
      };
      expect(response.review_stage).toBe('in_progress');
      expect(response.review_notes).toBe('Status updated during review');
    });
  });
});
