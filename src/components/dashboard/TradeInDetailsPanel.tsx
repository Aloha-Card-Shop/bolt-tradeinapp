
import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';
import TradeInItemRow from './TradeInItemRow';
import { TradeIn } from '../../types/tradeIn';

interface TradeInDetailsPanelProps {
  tradeIn: TradeIn;
  loadingItems: string | null;
}

const TradeInDetailsPanel: React.FC<TradeInDetailsPanelProps> = ({ tradeIn, loadingItems }) => {
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return "Your trade-in is currently being reviewed by our staff. We'll notify you once a decision has been made.";
      case 'accepted':
        return "Great news! Your trade-in has been accepted. You can visit our store to complete the transaction.";
      case 'rejected':
        return "Unfortunately, your trade-in request has been declined. Please check the staff notes for more information.";
      default:
        return "";
    }
  };

  const statusMessage = getStatusMessage(tradeIn.status);

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
              <p className="text-sm text-gray-700">
                <strong>Cash Value:</strong> ${formatCurrency(tradeIn.cash_value)}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Trade Value:</strong> ${formatCurrency(tradeIn.trade_value)}
              </p>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`mt-3 p-3 rounded-md ${
              tradeIn.status === 'accepted' ? 'bg-green-50 border border-green-100' : 
              tradeIn.status === 'rejected' ? 'bg-red-50 border border-red-100' : 
              'bg-amber-50 border border-amber-100'
            }`}>
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}
          
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Value</th>
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
