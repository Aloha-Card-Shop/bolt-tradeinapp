
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../../../api/calculate-value';

// Original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('API Method Validation', () => {
  // Set up console mocks
  let consoleWarnSpy: any;
  
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
});
