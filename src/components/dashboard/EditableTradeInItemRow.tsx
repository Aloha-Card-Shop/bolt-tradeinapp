import React, { useState } from 'react';
import { TradeInItem } from '../../types/tradeIn';
import { Tag, DollarSign, ExternalLink, Save, Edit, X } from 'lucide-react';
import ConditionSelect from '../trade-in/shared/ConditionSelect';
import QuantityInput from '../trade-in/shared/QuantityInput';
import PriceInput from '../trade-in/shared/PriceInput';
import PaymentTypeSelector from '../trade-in/shared/PaymentTypeSelector';
import { formatCurrency } from '../../utils/formatters';

interface EditableTradeInItemRowProps {
  item: TradeInItem;
  isUpdating: boolean;
  onUpdate: (updates: Partial<TradeInItem>) => Promise<TradeInItem | boolean | void>;
}

const EditableTradeInItemRow: React.FC<EditableTradeInItemRowProps> = ({ 
  item, 
  isUpdating,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<TradeInItem>({ ...item });
  
  const getConditionDisplay = (condition: string) => {
    const conditionMap: Record<string, string> = {
      'near_mint': 'Near Mint',
      'lightly_played': 'Lightly Played',
      'moderately_played': 'Moderately Played',
      'heavily_played': 'Heavily Played',
      'damaged': 'Damaged'
    };
    return conditionMap[condition] || condition;
  };

  const handleSaveChanges = async () => {
    // Calculate the payment type specific values
    const paymentType = editedItem.attributes?.paymentType || 'cash';
    
    // Prepare the updates with the attributes
    const updates: Partial<TradeInItem> = {
      condition: editedItem.condition,
      quantity: editedItem.quantity,
      price: editedItem.price, // Market price
      attributes: {
        ...editedItem.attributes,
        paymentType,
        cashValue: paymentType === 'cash' ? editedItem.attributes.cashValue : editedItem.attributes.cashValue,
        tradeValue: paymentType === 'trade' ? editedItem.attributes.tradeValue : editedItem.attributes.tradeValue
      }
    };
    
    try {
      // Pass the updates to the parent component for processing
      const result = await onUpdate(updates);
      
      // If we got updated data back (not just a boolean true), update our local state
      if (result && typeof result !== 'boolean') {
        // Update our local state with the response from the server
        setEditedItem(prev => ({
          ...prev,
          ...result,
          attributes: {
            ...(prev.attributes || {}),
            ...(result.attributes || {})
          }
        }));
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating item:", error);
      // Keep edit mode open on error
    }
  };

  const handleConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedItem({
      ...editedItem,
      condition: e.target.value
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    setEditedItem({
      ...editedItem,
      quantity: Math.max(1, quantity)
    });
  };

  const handleMarketPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0;
    setEditedItem({
      ...editedItem,
      price: Math.max(0, price)
    });
  };
  
  const handleValuePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    const paymentType = editedItem.attributes?.paymentType || 'cash';
    
    setEditedItem({
      ...editedItem,
      attributes: {
        ...editedItem.attributes,
        [paymentType === 'cash' ? 'cashValue' : 'tradeValue']: Math.max(0, value)
      }
    });
  };
  
  const handlePaymentTypeChange = (type: 'cash' | 'trade') => {
    setEditedItem({
      ...editedItem,
      attributes: {
        ...editedItem.attributes,
        paymentType: type
      }
    });
  };

  const handleIncrementQuantity = () => {
    setEditedItem({
      ...editedItem,
      quantity: editedItem.quantity + 1
    });
  };

  const handleDecrementQuantity = () => {
    if (editedItem.quantity > 1) {
      setEditedItem({
        ...editedItem,
        quantity: editedItem.quantity - 1
      });
    }
  };

  const getPaymentTypeValue = () => {
    const paymentType = editedItem.attributes?.paymentType || 'cash';
    return paymentType === 'cash' 
      ? (editedItem.attributes?.cashValue || editedItem.price || 0) 
      : (editedItem.attributes?.tradeValue || editedItem.price || 0);
  };

  const getTotalValue = () => {
    return getPaymentTypeValue() * editedItem.quantity;
  };

  if (isEditing) {
    return (
      <tr className="border-t border-gray-200 bg-blue-50">
        <td className="px-4 py-2 text-sm">
          <div className="flex flex-col">
            <div className="font-medium text-gray-900 flex items-center">
              {item.card_name}
              {item.tcgplayer_url && (
                <a 
                  href={item.tcgplayer_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.attributes?.isHolo && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Holo</span>
              )}
              {item.attributes?.isFirstEdition && (
                <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">1st Ed</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-2 text-sm">
          <ConditionSelect 
            condition={editedItem.condition}
            onChange={handleConditionChange}
            disabled={isUpdating}
          />
        </td>
        <td className="px-4 py-2 text-sm">
          <QuantityInput 
            quantity={editedItem.quantity}
            onChange={handleQuantityChange}
            onIncrement={handleIncrementQuantity}
            onDecrement={handleDecrementQuantity}
            disabled={isUpdating}
          />
        </td>
        <td className="px-4 py-2 text-sm">
          <PriceInput 
            price={editedItem.price || 0}
            onChange={handleMarketPriceChange}
            label="Market Value"
            readOnly={isUpdating}
          />
        </td>
        <td className="px-4 py-2 text-sm">
          <PriceInput 
            price={getPaymentTypeValue()}
            onChange={handleValuePriceChange}
            label={`${editedItem.attributes?.paymentType === 'trade' ? 'Trade' : 'Cash'} Value`}
            readOnly={isUpdating}
          />
        </td>
        <td className="px-4 py-2 text-sm">
          <PaymentTypeSelector
            paymentType={editedItem.attributes?.paymentType || 'cash'}
            onSelect={handlePaymentTypeChange}
            disabled={isUpdating}
          />
        </td>
        <td className="px-4 py-2 text-sm font-medium">
          <div className="flex items-center justify-between">
            <span className="text-gray-900">${formatCurrency(getTotalValue())}</span>
            <div className="flex space-x-1">
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className={`p-1 rounded ${isUpdating ? 'text-gray-400' : 'text-green-600 hover:bg-green-100'}`}
                title="Save changes"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
                className={`p-1 rounded ${isUpdating ? 'text-gray-400' : 'text-red-600 hover:bg-red-100'}`}
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // Get the item value based on payment type from attributes
  const getItemValue = () => {
    const paymentType = item.attributes?.paymentType || 'cash';
    
    if (paymentType === 'cash' && item.attributes?.cashValue !== undefined) {
      return item.attributes.cashValue;
    } else if (paymentType === 'trade' && item.attributes?.tradeValue !== undefined) {
      return item.attributes.tradeValue;
    }
    
    // Fallback to market price if specific values aren't available
    return item.price;
  };

  const itemValue = getItemValue();
  const paymentType = item.attributes?.paymentType || 'cash';

  return (
    <tr className="border-t border-gray-200">
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <div className="font-medium text-gray-900 flex items-center">
            {item.card_name}
            {item.tcgplayer_url && (
              <a 
                href={item.tcgplayer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.attributes?.isHolo && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">Holo</span>
            )}
            {item.attributes?.isFirstEdition && (
              <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">1st Ed</span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">
        {getConditionDisplay(item.condition)}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{item.quantity}</td>
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-700">${formatCurrency(item.price)}</span>
          <span className="text-xs text-gray-500">Market</span>
        </div>
      </td>
      <td className="px-4 py-2 text-sm">
        <div className="flex flex-col">
          <span className="text-gray-700">${formatCurrency(itemValue || 0)}</span>
          <span className="text-xs text-gray-500">Value</span>
        </div>
      </td>
      <td className="px-4 py-2 text-sm">
        {paymentType === 'trade' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            <Tag className="h-3 w-3 mr-1" />
            Trade
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <DollarSign className="h-3 w-3 mr-1" />
            Cash
          </span>
        )}
      </td>
      <td className="px-4 py-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">${formatCurrency((itemValue || 0) * item.quantity)}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 rounded text-blue-600 hover:bg-blue-100"
            title="Edit item"
          >
            <Edit size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EditableTradeInItemRow;
