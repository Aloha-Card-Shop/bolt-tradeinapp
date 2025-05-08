
import React from 'react';
import { X } from 'lucide-react';

interface ItemDetailsProps {
  name: string;
  set?: string;
  onRemove: () => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ name, set, onRemove }) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-medium text-gray-900">{name}</h3>
        {set && (
          <p className="text-sm text-gray-600 mt-0.5">{set}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
        title="Remove from list"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ItemDetails;
