
import { describe, beforeAll, vi } from 'vitest';
import { clearSettingsCache } from '../../../../api/utils/settingsCache';

// Mock data for supabase response
export const mockSettings = [
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
vi.mock('../../../../api/utils/settingsCache', async () => {
  const actualModule = await vi.importActual('../../../../api/utils/settingsCache');
  return {
    ...actualModule,
    clearSettingsCache: vi.fn(),
    // Mock the getGameSettings to return our mock data
    getGameSettings: vi.fn().mockImplementation((game: string) => {
      return mockSettings.filter(s => s.game === game);
    })
  };
});

vi.mock('../../../../api/utils/fallbackLogger', () => ({
  logFallbackEvent: vi.fn().mockResolvedValue(undefined)
}));

// Mock console to silence logs during tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// Helper function to create a request object
export const createRequest = (body: any) => {
  return new Request('http://localhost/api/calculate-value', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
};
