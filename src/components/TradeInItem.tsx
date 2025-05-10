
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
const TradeInItemWrapper: React.FC<TradeInItemProps> = ({ 
  item, 
  index, 
  onRemove, 
  onUpdate, 
  onConditionChange, 
  onValueChange 
}) => {
  return (
    <TradeInItem 
      item={item}
      index={index}
      onRemove={onRemove}
      onUpdate={onUpdate}
      onConditionChange={onConditionChange}
      onValueChange={onValueChange}
    />
  );
};

export default TradeInItemWrapper;
