
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../api/calculate-value';
import { 
  DEFAULT_FALLBACK_CASH_PERCENTAGE, 
  DEFAULT_FALLBACK_TRADE_PERCENTAGE 
} from '../../constants/fallbackValues';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseSelect = vi.fn();
  const mockSupabaseEq = vi.fn();
  const mockSupabaseInsert = vi.fn();
  
  return {
    createClient: vi.fn(() => ({
      from: mockSupabaseFrom.mockImplementation((table) => {
        if (table === 'calculation_fallback_logs') {
          return {
            insert: mockSupabaseInsert.mockResolvedValue({ data: null, error: null })
          };
        }
        return {
          select: mockSupabaseSelect.mockImplementation(() => ({
            eq: mockSupabaseEq.mockResolvedValue({ 
              data: [], 
              error: null 
            })
          }))
        };
      })
    }))
  };
});

// Mock the environment variables
vi.mock('process', () => ({
  env: {
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    SUPABASE_ANON_KEY: 'mock-anon-key'
  }
}));

// Mock console methods to test logging
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('calculate-value API endpoint', () => {
  // Set up console mocks
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  
  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  it('should return 405 with fallback info for non-POST requests', async () => {
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'GET'
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(405);
    expect(result).toEqual(expect.objectContaining({ 
      error: 'Method not allowed',
      usedFallback: true,
      fallbackReason: 'METHOD_NOT_ALLOWED'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 400 with fallback info for invalid baseValue', async () => {
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 'not-a-number' })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(400);
    expect(result).toEqual(expect.objectContaining({
      error: 'Invalid baseValue',
      usedFallback: true,
      fallbackReason: 'INVALID_INPUT'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 400 with fallback info for negative baseValue', async () => {
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: -10 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(400);
    expect(result).toEqual(expect.objectContaining({
      error: 'Invalid baseValue',
      usedFallback: true,
      fallbackReason: 'INVALID_INPUT'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 0 values without fallback when baseValue is 0', async () => {
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 0 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual({ cashValue: 0, tradeValue: 0 });
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Base value is 0'));
  });
  
  it('should use fallback values when database error occurs and log it', async () => {
    // Mock database error
    const createClient = require('@supabase/supabase-js').createClient;
    createClient.mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }));
    
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 100 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual(expect.objectContaining({
      cashValue: (100 * DEFAULT_FALLBACK_CASH_PERCENTAGE / 100),
      tradeValue: (100 * DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100),
      usedFallback: true,
      fallbackReason: 'DATABASE_ERROR',
      error: expect.stringContaining('Database error')
    }));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
  
  it('should handle catastrophic errors gracefully with fallback values and detailed error info', async () => {
    // Mock a catastrophic error by making the handler throw
    const createClient = require('@supabase/supabase-js').createClient;
    createClient.mockImplementation(() => {
      throw new Error('Critical error');
    });
    
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 50 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual(expect.objectContaining({
      cashValue: expect.any(Number),
      tradeValue: expect.any(Number),
      usedFallback: true,
      fallbackReason: 'UNKNOWN_ERROR',
      error: 'Critical error'
    }));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
  
  it('should log calculation attempts with structured logging', async () => {
    // Set up mock to return empty settings (will use fallbacks)
    const createClient = require('@supabase/supabase-js').createClient;
    createClient.mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => {
        if (table === 'calculation_fallback_logs') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null })
          };
        }
        return {
          select: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      })
    }));
    
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 75, userId: 'test-user' })
    });
    
    await handler(req);
    
    // Check that logs were called with all the expected info
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[REQUEST]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Processing calculation'),
      expect.stringContaining('pokemon')
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] No settings found')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Calculation result')
    );
  });
});
