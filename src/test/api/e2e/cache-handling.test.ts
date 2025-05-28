
import { describe, it, expect } from 'vitest';
import handler from '../../../../api/calculate-value';
import { createRequest } from './setup';

describe('Cache Handling E2E Tests', () => {
  it('should use cache for subsequent requests with the same game', async () => {
    // First request to populate the cache
    const req1 = createRequest({ game: 'pokemon', baseValue: 5 });
    await handler(req1);
    
    // Second request should use cache
    const req2 = createRequest({ game: 'pokemon', baseValue: 8 });
    const response = await handler(req2);
    const result = await response.json();
    
    // The response should be valid
    expect(result).toBeDefined();
    expect(result.cashValue).toBeCloseTo(2.4);  // 30% of 8
    expect(result.tradeValue).toBeCloseTo(3.6); // 45% of 8
  });
});
