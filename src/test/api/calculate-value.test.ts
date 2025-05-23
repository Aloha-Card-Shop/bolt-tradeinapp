
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../api/calculate-value';
import { clearSettingsCache } from '../../../api/utils/settingsCache';
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

// Mock the utilities modules that are now separated
vi.mock('../../../api/utils/calculateValues', () => ({
  calculateValues: vi.fn().mockImplementation(({ baseValue }) => {
    if (baseValue === 0) {
      return { cashValue: 0, tradeValue: 0, usedFallback: false };
    }
    
    return { 
      cashValue: baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100), 
      tradeValue: baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100),
      usedFallback: false 
    };
  })
}));

vi.mock('../../../api/utils/errorResponse', () => ({
  createErrorResponse: vi.fn().mockImplementation(
    (baseValue, msg, reason) => ({
      cashValue: baseValue * (DEFAULT_FALLBACK_CASH_PERCENTAGE / 100),
      tradeValue: baseValue * (DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100),
      usedFallback: true,
      fallbackReason: reason,
      error: msg
    })
  )
}));

vi.mock('../../../api/utils/settingsCache', () => ({
  clearSettingsCache: vi.fn(),
  getGameSettings: vi.fn().mockResolvedValue([])
}));

vi.mock('../../../api/utils/fallbackLogger', () => ({
  logFallbackEvent: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../api/utils/gameUtils', () => ({
  normalizeGameType: vi.fn().mockImplementation(game => 
    game ? game.toLowerCase().trim() : 'pokemon'
  )
}));

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
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO] Base value is 0'));
  });
  
  it('should use fallback values when database error occurs and log it', async () => {
    // Set up mock to simulate db error through the calculateValues mock
    const calculateValues = require('../../../api/utils/calculateValues').calculateValues;
    calculateValues.mockImplementationOnce(() => {
      throw new Error('Database error');
    });
    
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 100 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual(expect.objectContaining({
      cashValue: expect.any(Number),
      tradeValue: expect.any(Number),
      usedFallback: true,
      error: expect.stringMatching(/database error/i)
    }));
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
  
  it('should handle catastrophic errors gracefully with fallback values and detailed error info', async () => {
    // Mock a catastrophic error by making the normalizeGameType throw
    const normalizeGameType = require('../../../api/utils/gameUtils').normalizeGameType;
    const originalImpl = normalizeGameType.mockImplementation;
    normalizeGameType.mockImplementationOnce(() => {
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
    
    // Restore original implementation
    normalizeGameType.mockImplementation = originalImpl;
  });
  
  it('should log calculation attempts with structured logging', async () => {
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 75, userId: 'test-user' })
    });
    
    await handler(req);
    
    // Check that logs were called 
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[REQUEST]'));
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Processing calculation')
    );
  });
});
