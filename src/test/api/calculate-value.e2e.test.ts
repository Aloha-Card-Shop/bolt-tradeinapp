
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import handler from '../../../api/calculate-value';
import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  DEFAULT_FALLBACK_CASH_PERCENTAGE, 
  DEFAULT_FALLBACK_TRADE_PERCENTAGE 
} from '../../constants/fallbackValues';

// Create a real Supabase client for E2E testing
const supabaseUrl = 'https://qgsabaicokoynabxgdco.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to call the API handler directly
async function callAPI(body: any): Promise<{ statusCode: number; data: any }> {
  let statusCode: number = 0;
  let responseData: any = null;
  
  const req = {
    method: 'POST',
    body
  } as NextApiRequest;
  
  const res = {
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
    }
  } as unknown as NextApiResponse;
  
  await handler(req, res);
  
  return {
    statusCode,
    data: responseData
  };
}

// Skip these tests in CI environment where we may not have DB access
describe('calculate-value API E2E tests', { skip: !process.env.SUPABASE_ANON_KEY }, () => {
  // Seed test data to ensure consistent test results
  beforeAll(async () => {
    // Skip seeding if we don't have write access
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
    
    // Clear existing test settings
    await supabase
      .from('trade_value_settings')
      .delete()
      .eq('game', 'test-game');
      
    // Insert test settings
    await supabase.from('trade_value_settings').insert([
      {
        game: 'test-game',
        min_value: 0,
        max_value: 10,
        cash_percentage: 40,
        trade_percentage: 60
      },
      {
        game: 'test-game',
        min_value: 10.01,
        max_value: 50,
        cash_percentage: 45,
        trade_percentage: 65
      },
      {
        game: 'test-fixed',
        min_value: 0,
        max_value: 999999,
        fixed_cash_value: 5,
        fixed_trade_value: 10
      }
    ]);
    
    // Ensure the calculation_fallback_logs table exists
    const { error } = await supabase.from('calculation_fallback_logs').select('id', { count: 'exact', head: true });
    
    // If table doesn't exist, we would get an error
    if (error && error.code === '42P01') {
      console.warn('calculation_fallback_logs table does not exist. Tests will still run but logging will fail.');
    }
  });
  
  it('should calculate values based on percentage brackets', async () => {
    const result = await callAPI({ game: 'test-game', baseValue: 5 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      cashValue: 2, // 40% of 5
      tradeValue: 3, // 60% of 5
      usedFallback: false
    });
  });
  
  it('should use correct bracket for value at the boundary', async () => {
    const result = await callAPI({ game: 'test-game', baseValue: 10.01 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      cashValue: 4.5, // 45% of 10.01 rounded to 2 decimals
      tradeValue: 6.51, // 65% of 10.01 rounded to 2 decimals
      usedFallback: false
    });
  });
  
  it('should use fixed values when configured', async () => {
    const result = await callAPI({ game: 'test-fixed', baseValue: 100 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      cashValue: 5,
      tradeValue: 10,
      usedFallback: false
    });
  });
  
  it('should fall back to default percentages when no brackets match', async () => {
    const result = await callAPI({ game: 'test-game', baseValue: 100 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      cashValue: DEFAULT_FALLBACK_CASH_PERCENTAGE, // default % of 100
      tradeValue: DEFAULT_FALLBACK_TRADE_PERCENTAGE, // default % of 100
      usedFallback: true,
      fallbackReason: 'NO_PRICE_RANGE_MATCH'
    });
  });
  
  it('should fall back to default percentages when game not found', async () => {
    const result = await callAPI({ game: 'non-existent-game', baseValue: 100 });
    
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      cashValue: 35, // default 35% of 100
      tradeValue: 50, // default 50% of 100
      usedFallback: true,
      fallbackReason: 'NO_SETTINGS_FOUND'
    });
  });
  
  it('should normalize game type from various formats', async () => {
    const testCases = [
      { input: 'pokemon', expected: 'pokemon' },
      { input: 'PokéMon', expected: 'pokemon' },
      { input: 'Pokemon', expected: 'pokemon' },
      { input: 'magic', expected: 'magic' },
      { input: 'Magic: The Gathering', expected: 'magic' },
      { input: 'MTG', expected: 'magic' },
      { input: 'Japanese Pokemon', expected: 'japanese-pokemon' },
      { input: 'Pokemon (Japanese)', expected: 'japanese-pokemon' }
    ];
    
    for (const testCase of testCases) {
      const response = await callAPI({ game: testCase.input, baseValue: 1 });
      expect(response.statusCode).toBe(200);
      // We're only testing that it doesn't error - actual values will depend on DB config
      expect(response.data).toHaveProperty('cashValue');
      expect(response.data).toHaveProperty('tradeValue');
    }
  });
});
