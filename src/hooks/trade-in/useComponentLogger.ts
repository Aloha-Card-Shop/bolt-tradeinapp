
import { useRef } from 'react';

export function useComponentLogger(componentName: string, item: any, index: number) {
  // Component instance ID for debugging
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;
  
  // Log component rendering with key details
  console.log(`${componentName} [${instanceId}]: Rendering for ${item.card.name}`, {
    index,
    price: item.price,
    cashValue: item.cashValue,
    tradeValue: item.tradeValue,
    paymentType: item.paymentType,
    game: item.card.game,
    productId: item.card.productId
  });
  
  return { instanceId };
}
