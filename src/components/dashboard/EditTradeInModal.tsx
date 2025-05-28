
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TradeIn, TradeInItem } from '../../types/tradeIn';
import { useTradeInItemUpdate } from '../../hooks/useTradeInItemUpdate';
import EditableTradeInItemRow from './EditableTradeInItemRow';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useUserRole } from '../../hooks/useUserRole';

interface EditTradeInModalProps {
  tradeIn: TradeIn;
  onClose: () => void;
}

const EditTradeInModal: React.FC<EditTradeInModalProps> = ({ tradeIn, onClose }) => {
  const [staffNotes, setStaffNotes] = useState(tradeIn.staff_notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [items, setItems] = useState<TradeInItem[]>(tradeIn.items || []);
  const { updateTradeInItem, updateStaffNotes, updatingItemId } = useTradeInItemUpdate();
  const { canAdjustValues, role } = useUserRole();
  
  // Fetch items if they're not already loaded
  useEffect(() => {
    const fetchItems = async () => {
      if (!tradeIn.items && !loadingItems) {
        setLoadingItems(true);
        
        try {
          const { data, error } = await supabase
            .from('trade_in_items')
            .select(`
              id,
              trade_in_id,
              card_id,
              quantity,
              price,
              condition,
              attributes,
              cards:card_id(name, tcgplayer_url, image_url, rarity, set_name)
            `)
            .eq('trade_in_id', tradeIn.id);
            
          if (error) {
            console.error('Error fetching items:', error);
            toast.error('Failed to load trade-in items');
            return;
          }
          
          if (data) {
            const formattedItems = data.map(item => {
              // Fix: Check if cards is an array and get first element, or use directly if it's an object
              const cardData = item.cards ? 
                (Array.isArray(item.cards) ? item.cards[0] : 
                 typeof item.cards === 'object' ? item.cards : null) : null;
                
              return {
                id: item.id,
                trade_in_id: item.trade_in_id,
                card_id: item.card_id,
                quantity: item.quantity,
                price: item.price,
                condition: item.condition,
                attributes: item.attributes || {},
                card_name: cardData?.name || 'Unknown Card',
                set_name: cardData?.set_name || '',
                image_url: cardData?.image_url,
                rarity: cardData?.rarity,
                tcgplayer_url: cardData?.tcgplayer_url
              };
            });
            
            setItems(formattedItems);
            
            // Update tradeIn.items directly
            if (tradeIn.items) {
              tradeIn.items = formattedItems;
            }
          }
        } catch (err) {
          console.error('Error fetching items:', err);
        } finally {
          setLoadingItems(false);
        }
      } else if (tradeIn.items) {
        setItems(tradeIn.items);
      }
    };
    
    fetchItems();
  }, [tradeIn]);

  const handleItemUpdate = async (item: TradeInItem, updates: Partial<TradeInItem>): Promise<TradeInItem | boolean> => {
    try {
      setIsUpdating(true);
      if (!item.id) {
        toast.error("Cannot update item without ID");
        return false;
      }
      
      // Call the updateTradeInItem function and get the updated data
      const updatedData = await updateTradeInItem(item.id, updates);
      
      if (updatedData && typeof updatedData !== 'boolean') {
        // Directly update the local state with the returned data
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id ? { ...prevItem, ...updatedData } : prevItem
          )
        );
        
        // Also update the parent tradeIn object to ensure all views are updated
        if (tradeIn.items) {
          // Create a deep copy to ensure change detection
          const updatedItems = tradeIn.items.map(prevItem => 
            prevItem.id === item.id ? { ...prevItem, ...updatedData } : prevItem
          );
          
          // Update the parent tradeIn object's items
          tradeIn.items = updatedItems;
        }
        
        return updatedData as TradeInItem;
      } else if (updatedData) {
        // If we just got a boolean success response, update with the updates we sent
        const updatedItem = { ...item, ...updates };
        
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.id === item.id ? updatedItem : prevItem
          )
        );
        
        // Also update the parent tradeIn object
        if (tradeIn.items) {
          // Create a deep copy to ensure change detection
          const updatedItems = tradeIn.items.map(prevItem => 
            prevItem.id === item.id ? updatedItem : prevItem
          );
          
          // Update the parent tradeIn object's items
          tradeIn.items = updatedItems;
        }
        
        return updatedItem;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating item:', error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      setIsUpdating(true);
      const success = await updateStaffNotes(tradeIn.id, staffNotes);
      
      if (success) {
        toast.success('Notes updated successfully');
        
        // Also update the parent tradeIn object
        tradeIn.staff_notes = staffNotes;
      }
      setIsUpdating(false);
    } catch (error) {
      console.error('Error updating notes:', error);
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-xl font-semibold">Edit Trade-In</h2>
            {canAdjustValues && (
              <p className="text-sm text-blue-600 mt-1">
                You can adjust individual item values as a {role}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-medium mb-1">Trade-In Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-gray-500">Customer</span>
                  <span className="font-medium">{tradeIn.customer_name}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Date</span>
                  <span className="font-medium">{new Date(tradeIn.trade_in_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Total Value</span>
                  <span className="font-medium">${tradeIn.total_value.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items</h3>
              {loadingItems ? (
                <div className="text-center py-6">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin mx-auto" />
                  <p className="mt-2 text-gray-600 text-sm">Loading items...</p>
                </div>
              ) : items.length > 0 ? (
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Card</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Condition</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Qty</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Market</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                          Value {canAdjustValues && <span className="text-blue-600">(Adjustable)</span>}
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Type</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <EditableTradeInItemRow
                          key={item.id}
                          item={item}
                          isUpdating={updatingItemId === item.id || isUpdating}
                          onUpdate={(updates) => handleItemUpdate(item, updates)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items found for this trade-in.</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Staff Notes</h3>
              <textarea
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full h-24 p-3 border rounded-lg"
                placeholder="Add notes for staff reference..."
                disabled={isUpdating}
              ></textarea>
              <button
                onClick={handleNotesUpdate}
                disabled={isUpdating}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </span>
                ) : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTradeInModal;
