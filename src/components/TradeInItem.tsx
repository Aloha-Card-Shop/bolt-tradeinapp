
import React from 'react';
import TradeInItem from './trade-in/item-card';
import { TradeInItem as TradeInItemType } from '../hooks/useTradeInList';

interface TradeInItemProps {
  item: TradeInItemType;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, item: TradeInItemType) => void;
  onConditionChange: (condition: string) => void;
  onValueChange: (values: { tradeValue: number; cashValue: number }) => void;
}

// This is now just a passthrough component that uses our refactored implementation
const TradeInItemWrapper: React.FC<TradeInItemProps> = (props) => {
  return <TradeInItem {...props} />;
};

export default TradeInItemWrapper;
