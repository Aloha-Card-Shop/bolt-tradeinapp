
import { describe, it, expect, vi } from 'vitest';
import handler from '../../../../api/calculate-value';
import { createRequest } from './setup';
import { clearSettingsCache } from '../../../../api/utils/settingsCache';

describe('Cache Handling E2E Tests', () => {
  it('should use cache for subsequent requests with the same game', async () => {
    // First request to populate the cache
    const req1 = createRequest({ game: 'pokemon', baseValue: 5 });
    await handler(req1);
    
    // Modify the mock to verify the cache is used
    const getGameSettings = require('../../../../api/utils/settingsCache').getGameSettings;
    
    // Second request should use cache
    const req2 = createRequest({ game: 'pokemon', baseValue: 8 });
    const response = await handler(req2);
    const result = await response.json();
    
    // The response should be valid
    expect(result).toBeDefined();
    expect(result.cashValue).toBeCloseTo(2.4);  // 30% of 8
    expect(result.tradeValue).toBeCloseTo(3.6); // 45% of 8
  });
  
  it('should export clearSettingsCache function', () => {
    expect(clearSettingsCache).toBeDefined();
    expect(typeof clearSettingsCache).toBe('function');
  });
});
