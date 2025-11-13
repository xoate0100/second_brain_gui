/**
 * API Types Tests
 * Tests for API request/response type definitions
 */

import { describe, it, expect } from 'vitest';
import type {
  ReviewQueueParams,
  ReviewQueueResponse,
  ReviewItem,
  Pagination,
  NoteDetailResponse,
  StatusUpdateRequest,
  StatusUpdateResponse,
  NoteUpdateRequest,
  NoteUpdateResponse,
  BatchUpdateRequest,
  BatchUpdateResponse,
  SuggestionResponse
} from './types';

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
        order: 'desc'
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
        momentum_score: 0.75
      };
      expect(item.note_id).toBe('123');
      expect(item.momentum_score).toBe(0.75);
    });
  });

  describe('StatusUpdateRequest', () => {
    it('should require status field', () => {
      const request: StatusUpdateRequest = {
        status: 'ready'
      };
      expect(request.status).toBe('ready');
    });

    it('should allow optional fields', () => {
      const request: StatusUpdateRequest = {
        status: 'done',
        review_notes: 'Completed',
        follow_up_date: '2025-02-01T00:00:00Z'
      };
      expect(request.review_notes).toBe('Completed');
    });
  });
});

