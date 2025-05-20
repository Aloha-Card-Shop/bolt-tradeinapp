
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
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
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock = vi.fn();
  let statusMock = vi.fn();
  
  // Set up console mocks
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  
  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockReq = {
      method: 'POST',
      body: {}
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  it('should return 405 with fallback info for non-POST requests', async () => {
    mockReq.method = 'GET';
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ 
      error: 'Method not allowed',
      usedFallback: true,
      fallbackReason: 'METHOD_NOT_ALLOWED'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 400 with fallback info for invalid baseValue', async () => {
    mockReq.body = { game: 'pokemon', baseValue: 'not-a-number' };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid baseValue',
      usedFallback: true,
      fallbackReason: 'INVALID_INPUT'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 400 with fallback info for negative baseValue', async () => {
    mockReq.body = { game: 'pokemon', baseValue: -10 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid baseValue',
      usedFallback: true,
      fallbackReason: 'INVALID_INPUT'
    }));
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
  
  it('should return 0 values without fallback when baseValue is 0', async () => {
    mockReq.body = { game: 'pokemon', baseValue: 0 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ cashValue: 0, tradeValue: 0 });
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
    
    mockReq.body = { game: 'pokemon', baseValue: 100 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: (100 * DEFAULT_FALLBACK_CASH_PERCENTAGE / 100),
      tradeValue: (100 * DEFAULT_FALLBACK_TRADE_PERCENTAGE / 100),
      usedFallback: true,
      fallbackReason: 'DATABASE_ERROR',
      error: expect.stringContaining('Database error')
    }));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Supabase query error:'));
  });
  
  it('should handle catastrophic errors gracefully with fallback values and detailed error info', async () => {
    // Mock a catastrophic error by making the handler throw
    const createClient = require('@supabase/supabase-js').createClient;
    createClient.mockImplementation(() => {
      throw new Error('Critical error');
    });
    
    mockReq.body = { game: 'pokemon', baseValue: 50 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      cashValue: expect.any(Number),
      tradeValue: expect.any(Number),
      usedFallback: true,
      fallbackReason: 'CALCULATION_ERROR',
      error: 'Critical error'
    }));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] Unhandled exception'));
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
    
    mockReq.body = { game: 'pokemon', baseValue: 75, userId: 'test-user' };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    // Check that logs were called with all the expected info
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REQUEST]'), 
      expect.stringContaining('POST'),
      expect.any(Object)
    );
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
