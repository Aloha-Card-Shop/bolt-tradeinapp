
import { vi } from 'vitest';
import { DEFAULT_FALLBACK_CASH_PERCENTAGE, DEFAULT_FALLBACK_TRADE_PERCENTAGE } from '../../../constants/fallbackValues';

// Mock Supabase client and other dependencies for the shared test environment
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

// Mock the utilities modules
vi.mock('../../../../api/utils/calculateValues', () => ({
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

vi.mock('../../../../api/utils/errorResponse', () => ({
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

vi.mock('../../../../api/utils/fallbackLogger', () => ({
  logFallbackEvent: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../../../api/utils/gameUtils', () => ({
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
