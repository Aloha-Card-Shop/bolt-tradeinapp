
export interface CalculationResult {
  cashValue: number;
  tradeValue: number;
  usedFallback?: boolean;
  fallbackReason?: string;
  error?: string;
}

export interface FallbackLog {
  id: string;
  game: string;
  base_value: number;
  reason: string;
  user_id?: string;
  created_at: string;
}
