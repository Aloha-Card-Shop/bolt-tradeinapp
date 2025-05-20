
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../api/calculate-value';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockSupabaseFrom = vi.fn();
  const mockSupabaseSelect = vi.fn();
  const mockSupabaseEq = vi.fn();
  
  return {
    createClient: vi.fn(() => ({
      from: mockSupabaseFrom.mockImplementation(() => ({
        select: mockSupabaseSelect.mockImplementation(() => ({
          eq: mockSupabaseEq.mockReturnThis()
        }))
      }))
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
});
