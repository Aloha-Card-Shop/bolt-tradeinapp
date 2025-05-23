
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../../api/calculate-value';
import { logFallbackEvent } from '../../../../api/utils/fallbackLogger';

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
  
  it('should handle exceptions gracefully and return fallback values', async () => {
    // Mock calculateValues to throw an error
    const calculateValues = require('../../../../api/utils/calculateValues').calculateValues;
    const originalCalculateValues = calculateValues;
    
    // Temporarily replace with an implementation that throws
    const mockCalculateValuesImpl = vi.fn().mockImplementation(() => {
      throw new Error("Test calculation error");
    });
    
    require('../../../../api/utils/calculateValues').calculateValues = mockCalculateValuesImpl;
    
    // Set up the mock for logFallbackEvent
    const logFallbackEventMock = vi.mocked(logFallbackEvent);
    
    // Make a test request
    const req = new Request('http://localhost/api/calculate-value', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: 'pokemon', baseValue: 100 })
    });
    
    const response = await handler(req);
    const result = await response.json();
    
    // Expect error handling and fallback values
    expect(response.status).toBe(200); // Still returns 200 with fallback
    expect(result).toEqual(expect.objectContaining({
      usedFallback: true,
      fallbackReason: 'UNKNOWN_ERROR',
      error: expect.stringContaining('Test calculation error')
    }));
    
    // Check that the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Unhandled exception'),
      expect.any(Error)
    );
    
    // Check that fallback event was logged
    expect(logFallbackEventMock).toHaveBeenCalled();
    
    // Restore original implementation
    require('../../../../api/utils/calculateValues').calculateValues = originalCalculateValues;
  });
});
