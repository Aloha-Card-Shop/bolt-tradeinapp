
import React from 'react';

interface WarningMessagesProps {
  card: { name: string; game?: string };
  price: number;
}

const WarningMessages: React.FC<WarningMessagesProps> = ({ card, price }) => {
  return (
    <>
      {card && !card.game && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          Missing game type for {card.name}. Using default: pokemon. This is required for value calculation.
        </div>
      )}
      
      {price <= 0 && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
          Card price must be greater than 0 to calculate values.
        </div>
      )}
    </>
  );
};

export default WarningMessages;
