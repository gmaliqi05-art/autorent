import { describe, it, expect } from 'vitest';
import { findBestMatch } from './chatMatcher';
import type { ChatResponse } from './types';

function makeResponse(overrides: Partial<ChatResponse>): ChatResponse {
  return {
    id: 'r1',
    category: 'general',
    keywords: [],
    question: '',
    answer: '',
    language: 'sq',
    priority: 0,
    is_active: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('findBestMatch', () => {
  it('returns null for empty query', () => {
    expect(findBestMatch('', [makeResponse({ keywords: ['cmim'] })])).toBeNull();
    expect(findBestMatch('   ', [])).toBeNull();
  });

  it('returns null when no responses given', () => {
    expect(findBestMatch('si te rezervoj?', [])).toBeNull();
  });

  it('matches by keyword substring', () => {
    const responses = [
      makeResponse({ id: 'pricing', keywords: ['cmim', 'cmime'], question: 'sa kushton?' }),
      makeResponse({ id: 'booking', keywords: ['rezervim'], question: 'si te rezervoj?' }),
    ];
    const result = findBestMatch('cili eshte cmimi?', responses);
    expect(result?.id).toBe('pricing');
  });

  it('handles Albanian diacritics (ë, ç)', () => {
    const responses = [
      makeResponse({ id: 'cars', keywords: ['vetura'], question: 'cilat vetura?' }),
    ];
    const result = findBestMatch('Ç\'lloj vetura keni?', responses);
    expect(result?.id).toBe('cars');
  });

  it('prefers responses with stronger keyword matches over weaker ones', () => {
    const responses = [
      makeResponse({ id: 'generic', keywords: ['punon'], question: 'si punon?' }),
      makeResponse({ id: 'specific', keywords: ['rezervim', 'rezervoj'], question: 'si te bej rezervim?' }),
    ];
    // 'rezervim' eshte keyword direkt, duhet te ngjizet me 'specific'
    const result = findBestMatch('Si te bej rezervim?', responses);
    expect(result?.id).toBe('specific');
  });
});
