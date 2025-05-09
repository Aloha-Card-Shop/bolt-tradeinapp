
import React from 'react';
import { TradeInItem } from '../../../hooks/useTradeInList';
import CardImage from './CardImage';
import CardHeader from './CardHeader';
import ItemAttributesSection from './ItemAttributesSection';

interface ReviewItemCardProps {
  item: TradeInItem;
  index: number;
  onUpdateItem: (index: number, item: TradeInItem) => void;
  onRemoveItem: (index: number) => void;
  itemValue?: { tradeValue: number; cashValue: number; };
}

const ReviewItemCard: React.FC<ReviewItemCardProps> = ({
  item,
  index,
  onUpdateItem,
  onRemoveItem,
  itemValue
}) => {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start space-x-4">
        <CardImage 
          imageUrl={item.card.imageUrl} 
          name={item.card.name} 
        />

        <div className="flex-1">
          <CardHeader 
            name={item.card.name}
            number={item.card.number}
            set={item.card.set}
            onRemove={() => onRemoveItem(index)}
          />
          
          <ItemAttributesSection
            item={item}
            index={index}
            onUpdateItem={onUpdateItem}
            itemValue={itemValue}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewItemCard;
