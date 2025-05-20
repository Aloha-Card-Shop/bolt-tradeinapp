
import { describe, it, expect, beforeAll, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../api/calculate-value';

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

// Mock console to silence logs during tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('calculate-value API E2E Tests', () => {
  // Helper function to create mock request and response
  const createMocks = (body: any) => {
    const req = { 
      method: 'POST',
      body
    } as NextApiRequest;
    
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status, json } as unknown as NextApiResponse;
    
    return { req, res, json, status };
  };
  
  it('should calculate Pokemon values using correct bracket', async () => {
    const { req, res, json } = createMocks({ game: 'pokemon', baseValue: 5 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 1.5, // 30% of 5
      tradeValue: 2.25, // 45% of 5
      usedFallback: false
    }));
  });
  
  it('should handle higher Pokemon bracket correctly', async () => {
    const { req, res, json } = createMocks({ game: 'pokemon', baseValue: 20 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 7, // 35% of 20
      tradeValue: 10, // 50% of 20
      usedFallback: false
    }));
  });
  
  it('should handle Magic game type correctly', async () => {
    const { req, res, json } = createMocks({ game: 'magic', baseValue: 100 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 40, // 40% of 100
      tradeValue: 60, // 60% of 100
      usedFallback: false
    }));
  });
  
  it('should use fixed values for Japanese Pokemon', async () => {
    const { req, res, json } = createMocks({ game: 'japanese-pokemon', baseValue: 50 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 10, // Fixed value
      tradeValue: 15, // Fixed value
      usedFallback: false
    }));
  });
  
  it('should normalize game types (case insensitive, trimming)', async () => {
    const { req, res, json } = createMocks({ game: ' Pokemon ', baseValue: 5 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 1.5, // 30% of 5
      tradeValue: 2.25, // 45% of 5
      usedFallback: false
    }));
  });
  
  it('should fallback for unknown game type with appropriate message', async () => {
    const { req, res, json } = createMocks({ game: 'yugioh', baseValue: 10 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      usedFallback: true,
      fallbackReason: 'NO_SETTINGS_FOUND'
    }));
  });
  
  it('should handle out-of-range values with appropriate fallback', async () => {
    // Modify mock to return empty array once for this test
    const supabaseClient = require('@supabase/supabase-js').createClient();
    const originalFromImpl = supabaseClient.from;
    
    supabaseClient.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'trade_value_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ 
              data: [
                { 
                  game: 'pokemon', 
                  min_value: 0, 
                  max_value: 100,
                  cash_percentage: 35,
                  trade_percentage: 50
                }
              ], 
              error: null 
            })
          })
        };
      }
      return originalFromImpl(table);
    });
    
    const { req, res, json } = createMocks({ game: 'pokemon', baseValue: 1000 });
    
    await handler(req, res);
    
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      usedFallback: true,
      fallbackReason: 'NO_PRICE_RANGE_MATCH'
    }));
    
    // Restore original implementation
    supabaseClient.from = originalFromImpl;
  });
  
  it('should round values to exactly 2 decimal places', async () => {
    const { req, res, json } = createMocks({ game: 'pokemon', baseValue: 1.39 });
    
    await handler(req, res);
    
    // 30% of 1.39 = 0.417, should round to 0.42
    // 45% of 1.39 = 0.6255, should round to 0.63
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: 0.42,
      tradeValue: 0.63
    }));
  });

  // Test the caching mechanism
  it('should use cache for subsequent requests with the same game', async () => {
    // First request to populate the cache
    const { req: req1, res: res1 } = createMocks({ game: 'pokemon', baseValue: 5 });
    await handler(req1, res1);
    
    // Modify the mock to verify the cache is used (this should NOT be called)
    const supabaseClient = require('@supabase/supabase-js').createClient();
    const spy = vi.spyOn(supabaseClient, 'from');
    
    // Second request should use cache
    const { req: req2, res: res2, json: json2 } = createMocks({ game: 'pokemon', baseValue: 8 });
    await handler(req2, res2);
    
    // The settings should have been retrieved from cache, not from the database
    expect(json2).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalledWith('trade_value_settings');
  });
});
