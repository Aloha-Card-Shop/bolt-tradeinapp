
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';
import TradeInItemRow from './TradeInItemRow';

interface TradeInDetailsPanelProps {
  tradeIn: {
    id: string;
    trade_in_date: string;
    total_value: number;
    status: string;
    notes?: string | null;
    staff_notes?: string | null;
    items?: Array<{
      card_name: string;
      quantity: number;
      price: number;
      condition: string;
      attributes?: {
        isFirstEdition?: boolean;
        isHolo?: boolean;
        paymentType?: 'cash' | 'trade';
      };
    }>;
  };
  loadingItems: string | null;
}

const TradeInDetailsPanel: React.FC<TradeInDetailsPanelProps> = ({ tradeIn, loadingItems }) => {
  return (
    <td colSpan={7} className="px-5 py-5 border-b border-gray-200 bg-gray-50">
      <div className="pl-6">
        {/* Trade-in details */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Trade-In Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700"><strong>ID:</strong> {tradeIn.id}</p>
              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {new Date(tradeIn.trade_in_date).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                <strong>Total Value:</strong> ${formatCurrency(tradeIn.total_value)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Status:</strong> {tradeIn.status}
              </p>
            </div>
          </div>
          {tradeIn.notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-700"><strong>Customer Notes:</strong></p>
              <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                {tradeIn.notes}
              </p>
            </div>
          )}
          {tradeIn.staff_notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-700"><strong>Staff Notes:</strong></p>
              <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                {tradeIn.staff_notes}
              </p>
            </div>
          )}
        </div>
        
        {/* Items */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Trade-In Items</h3>
          {loadingItems === tradeIn.id ? (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mx-auto" />
              <p className="mt-2 text-xs text-gray-600">Loading items...</p>
            </div>
          ) : tradeIn.items && tradeIn.items.length > 0 ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Card</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Condition</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeIn.items.map((item, index) => (
                    <TradeInItemRow key={index} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">No items found</p>
          )}
        </div>
      </div>
    </td>
  );
};

export default TradeInDetailsPanel;
