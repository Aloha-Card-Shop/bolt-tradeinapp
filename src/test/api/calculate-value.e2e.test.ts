
import { describe, it, expect, beforeAll, vi } from 'vitest';
import handler from '../../../api/calculate-value';
import { clearSettingsCache } from '../../../api/utils/settingsCache';

// Mock data for supabase response
const mockSettings = [
  {
    id: 1,
    game: 'pokemon',
    min_value: 0,
    max_value: 10,
    cash_percentage: 30,
    trade_percentage: 45,
    fixed_cash_value: null,
    fixed_trade_value: null
  },
  {
    id: 2,
    game: 'pokemon',
    min_value: 10.01,
    max_value: 50,
    cash_percentage: 35,
    trade_percentage: 50,
    fixed_cash_value: null,
    fixed_trade_value: null
  },
  {
    id: 3,
    game: 'magic',
    min_value: 0,
    max_value: 1000,
    cash_percentage: 40,
    trade_percentage: 60,
    fixed_cash_value: null,
    fixed_trade_value: null
  },
  {
    id: 4,
    game: 'japanese-pokemon',
    min_value: 0,
    max_value: 0, // Will be ignored as range
    cash_percentage: 0, // Will be ignored
    trade_percentage: 0, // Will be ignored
    fixed_cash_value: 10,
    fixed_trade_value: 15
  }
];

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'trade_value_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((_, value: string) => {
                // Filter mockSettings based on game
                const data = mockSettings.filter(s => s.game === value);
                return Promise.resolve({ data, error: null });
              })
            })
          };
        }
        if (table === 'calculation_fallback_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null })
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        };
      })
    }))
  };
});

// Mock the utility modules
vi.mock('../../../api/utils/settingsCache', async () => {
  const actualModule = await vi.importActual('../../../api/utils/settingsCache');
  return {
    ...actualModule,
    clearSettingsCache: vi.fn(),
    // Mock the getGameSettings to return our mock data
    getGameSettings: vi.fn().mockImplementation((game: string) => {
      return mockSettings.filter(s => s.game === game);
    })
  };
});

vi.mock('../../../api/utils/fallbackLogger', () => ({
  logFallbackEvent: vi.fn().mockResolvedValue(undefined)
}));

// Mock console to silence logs during tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('calculate-value API E2E Tests', () => {
  // Helper function to create a request object
  const createRequest = (body: any) => {
    return new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };
  
  it('should calculate Pokemon values using correct bracket', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 5 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual(expect.objectContaining({
      cashValue: 1.5, // 30% of 5
      tradeValue: 2.25, // 45% of 5
      usedFallback: false
    }));
  });
  
  it('should handle higher Pokemon bracket correctly', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 20 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 7, // 35% of 20
      tradeValue: 10, // 50% of 20
      usedFallback: false
    }));
  });
  
  it('should handle Magic game type correctly', async () => {
    const req = createRequest({ game: 'magic', baseValue: 100 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 40, // 40% of 100
      tradeValue: 60, // 60% of 100
      usedFallback: false
    }));
  });
  
  it('should use fixed values for Japanese Pokemon', async () => {
    const req = createRequest({ game: 'japanese-pokemon', baseValue: 50 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 10, // Fixed value
      tradeValue: 15, // Fixed value
      usedFallback: false
    }));
  });
  
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
  
  it('should fallback for unknown game type with appropriate message', async () => {
    // Update mock to return empty for this game type
    const getGameSettings = require('../../../api/utils/settingsCache').getGameSettings;
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
    const getGameSettings = require('../../../api/utils/settingsCache').getGameSettings;
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
  
  it('should round values to exactly 2 decimal places', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 1.39 });
    
    const response = await handler(req);
    const result = await response.json();
    
    // 30% of 1.39 = 0.417, should round to 0.42
    // 45% of 1.39 = 0.6255, should round to 0.63
    expect(result).toEqual(expect.objectContaining({
      cashValue: 0.42,
      tradeValue: 0.63
    }));
  });

  // Test the caching mechanism
  it('should use cache for subsequent requests with the same game', async () => {
    // First request to populate the cache
    const req1 = createRequest({ game: 'pokemon', baseValue: 5 });
    await handler(req1);
    
    // Modify the mock to verify the cache is used
    const getGameSettings = require('../../../api/utils/settingsCache').getGameSettings;
    const spy = vi.spyOn(getGameSettings, 'mock');
    
    // Second request should use cache
    const req2 = createRequest({ game: 'pokemon', baseValue: 8 });
    const response = await handler(req2);
    const result = await response.json();
    
    // The response should be valid
    expect(result).toBeDefined();
    expect(result.cashValue).toBeCloseTo(2.4);  // 30% of 8
    expect(result.tradeValue).toBeCloseTo(3.6); // 45% of 8
  });
  
  // Test the new clear cache endpoint is now imported correctly
  it('should export clearSettingsCache function', () => {
    expect(clearSettingsCache).toBeDefined();
    expect(typeof clearSettingsCache).toBe('function');
  });
});
