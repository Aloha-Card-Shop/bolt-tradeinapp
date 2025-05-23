
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../../api/calculate-value';
import { DEFAULT_FALLBACK_CASH_PERCENTAGE, DEFAULT_FALLBACK_TRADE_PERCENTAGE } from '../../../constants/fallbackValues';

// Original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('API Error Handling', () => {
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
  
  it('should use fallback values when database error occurs and log it', async () => {
    // Set up mock to simulate db error through the calculateValues mock
    const calculateValues = require('../../../../api/utils/calculateValues').calculateValues;
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
    const normalizeGameType = require('../../../../api/utils/gameUtils').normalizeGameType;
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
});
