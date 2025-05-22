
import { useState } from 'react';

export function useDebugInfo(item: any, cashValue: number, tradeValue: number, error?: string) {
  const isDebugMode = process.env.NODE_ENV !== 'production';

  return {
    isDebugMode,
    debugInfo: {
      price: item.price,
      cashValue,
      tradeValue,
      game: item.card.game || 'pokemon (default)',
      paymentType: item.paymentType || 'Not selected',
      initialCalculation: item.initialCalculation ? 'Yes' : 'No',
      error
    }
  };
}
