import type { ChatResponse } from './types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ë]/g, 'e')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(t => t.length > 1);
}

const STOP_WORDS = new Set([
  'nje', 'te', 'ne', 'per', 'me', 'nga', 'si', 'do', 'ka', 'eshte',
  'jane', 'kjo', 'ajo', 'ky', 'ai', 'une', 'ti', 'ato', 'keto',
  'qe', 'se', 'po', 'jo', 'a', 'e', 'i', 'u', 'the', 'is', 'it',
  'dua', 'deshiroj', 'mund', 'duhet',
]);

export function findBestMatch(query: string, responses: ChatResponse[]): ChatResponse | null {
  if (!query.trim() || responses.length === 0) return null;

  const tokens = tokenize(query).filter(t => !STOP_WORDS.has(t));
  const normalizedQuery = normalize(query);

  const scored = responses.map(r => {
    let score = 0;
    const keywords = (r.keywords || []).map(k => normalize(k));

    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        score += 10;
      }
      for (const token of tokens) {
        if (keyword === token) {
          score += 8;
        } else if (keyword.includes(token) || token.includes(keyword)) {
          score += 4;
        }
      }
    }

    const qNorm = normalize(r.question);
    const qTokens = tokenize(r.question).filter(t => !STOP_WORDS.has(t));
    for (const token of tokens) {
      if (qNorm.includes(token)) score += 3;
      for (const qt of qTokens) {
        if (qt === token) score += 5;
        else if (qt.includes(token) || token.includes(qt)) score += 2;
      }
    }

    score += r.priority * 0.5;

    return { response: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score >= 5) {
    return scored[0].response;
  }

  return null;
}

export function getSuggestedQuestions(responses: ChatResponse[], limit = 5): ChatResponse[] {
  return responses
    .filter(r => r.priority >= 8)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
