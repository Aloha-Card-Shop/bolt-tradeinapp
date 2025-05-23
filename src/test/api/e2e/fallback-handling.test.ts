
import { describe, it, expect, vi } from 'vitest';
import handler from '../../../../api/calculate-value';
import { createRequest } from './setup';

describe('Fallback Handling E2E Tests', () => {
  it('should fallback for unknown game type with appropriate message', async () => {
    // Update mock to return empty for this game type
    const getGameSettings = require('../../../../api/utils/settingsCache').getGameSettings;
    const originalGetGameSettings = getGameSettings;
    getGameSettings.mockImplementationOnce(() => []);
    
    const req = createRequest({ game: 'yugioh', baseValue: 10 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      usedFallback: true,
      fallbackReason: 'NO_SETTINGS_FOUND'
    }));
    
    // Restore original implementation
    getGameSettings.mockImplementation(originalGetGameSettings);
  });
  
  it('should handle out-of-range values with appropriate fallback', async () => {
    // Set up mock to return settings that don't match the value
    const getGameSettings = require('../../../../api/utils/settingsCache').getGameSettings;
    const originalGetGameSettings = getGameSettings;
    getGameSettings.mockImplementationOnce(() => [
      { 
        game: 'pokemon', 
        min_value: 0, 
        max_value: 100,
        cash_percentage: 35,
        trade_percentage: 50
      }
    ]);
    
    const req = createRequest({ game: 'pokemon', baseValue: 1000 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      usedFallback: true,
      fallbackReason: 'NO_PRICE_RANGE_MATCH'
    }));
    
    // Restore original implementation
    getGameSettings.mockImplementation(originalGetGameSettings);
  });
});
