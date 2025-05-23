
import { describe, it, expect } from 'vitest';
import handler from '../../../../api/calculate-value';
import { createRequest } from './setup';

describe('Basic Calculation E2E Tests', () => {
  it('should calculate Pokemon values using correct bracket', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 5 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result).toEqual(expect.objectContaining({
      cashValue: 1.5, // 30% of 5
      tradeValue: 2.25, // 45% of 5
      usedFallback: false
    }));
  });
  
  it('should handle higher Pokemon bracket correctly', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 20 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 7, // 35% of 20
      tradeValue: 10, // 50% of 20
      usedFallback: false
    }));
  });
  
  it('should handle Magic game type correctly', async () => {
    const req = createRequest({ game: 'magic', baseValue: 100 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 40, // 40% of 100
      tradeValue: 60, // 60% of 100
      usedFallback: false
    }));
  });
  
  it('should use fixed values for Japanese Pokemon', async () => {
    const req = createRequest({ game: 'japanese-pokemon', baseValue: 50 });
    
    const response = await handler(req);
    const result = await response.json();
    
    expect(result).toEqual(expect.objectContaining({
      cashValue: 10, // Fixed value
      tradeValue: 15, // Fixed value
      usedFallback: false
    }));
  });
  
  it('should round values to exactly 2 decimal places', async () => {
    const req = createRequest({ game: 'pokemon', baseValue: 1.39 });
    
    const response = await handler(req);
    const result = await response.json();
    
    // 30% of 1.39 = 0.417, should round to 0.42
    // 45% of 1.39 = 0.6255, should round to 0.63
    expect(result).toEqual(expect.objectContaining({
      cashValue: 0.42,
      tradeValue: 0.63
    }));
  });
});
