
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
            eq: mockSupabaseEq.mockReturnThis()
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

describe('calculate-value API endpoint', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock = vi.fn();
  let statusMock = vi.fn();
  
  beforeEach(() => {
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
  });
  
  it('should return 405 for non-POST requests', async () => {
    mockReq.method = 'GET';
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });
  
  it('should return 400 for invalid baseValue', async () => {
    mockReq.body = { game: 'pokemon', baseValue: 'not-a-number' };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid baseValue'
    }));
  });
  
  it('should return 400 for negative baseValue', async () => {
    mockReq.body = { game: 'pokemon', baseValue: -10 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid baseValue'
    }));
  });
  
  it('should return 0 values when baseValue is 0', async () => {
    mockReq.body = { game: 'pokemon', baseValue: 0 };
    
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);
    
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ cashValue: 0, tradeValue: 0 });
  });
  
  it('should use fallback values when database error occurs', async () => {
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
      fallbackReason: 'DATABASE_ERROR'
    }));
  });
  
  it('should handle catastrophic errors gracefully with fallback values', async () => {
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
      fallbackReason: 'CALCULATION_ERROR'
    }));
  });
});
