
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../../api/calculate-value';

// Original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('API Input Validation', () => {
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
});
