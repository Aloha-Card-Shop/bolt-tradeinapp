
import { describe, it, expect } from 'vitest';
import handler from '../../../../api/calculate-value';
import { createRequest } from './setup';

describe('Game Type Handling E2E Tests', () => {
  it('should normalize game types (case insensitive, trimming)', async () => {
    const req = createRequest({ game: ' Pokemon ', baseValue: 5 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 1.5, // 30% of 5
      tradeValue: 2.25, // 45% of 5
      usedFallback: false
    }));
  });
});
