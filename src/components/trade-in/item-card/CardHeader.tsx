
import React from 'react';
import { CardDetails } from '../../../types/card';
import CardImage from './CardImage';
import ItemDetails from '../ItemDetails';

interface CardHeaderProps {
  card: CardDetails;
  index: number;
  onRemove: (index: number) => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ card, index, onRemove }) => {
  return (
    <div className="flex items-start space-x-4">
      <CardImage imageUrl={card.imageUrl} name={card.name} />
      <ItemDetails 
        name={card.name}
        set={card.set}
        onRemove={() => onRemove(index)}
      />
    </div>
  );
};

export default CardHeader;
