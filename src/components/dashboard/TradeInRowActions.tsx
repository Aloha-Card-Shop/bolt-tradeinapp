
import React, { useState } from 'react';
import { Check, X, Trash2, Printer, Edit, ShoppingBag } from 'lucide-react';
import PrinterSelectionModal from '../barcode/PrinterSelectionModal';
import { usePrinters } from '../../hooks/usePrinters';
import { printService } from '../../services/printService';
import { TradeIn } from '../../types/tradeIn';
import EditTradeInModal from './EditTradeInModal';
import { useShopify } from '../../hooks/useShopify';
import { toast } from 'react-hot-toast';

interface TradeInRowActionsProps {
  tradeInId: string;
  status: string;
  actionLoading: string | null;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
  onDelete: (id: string) => void;
  tradeIn?: TradeIn; // Add full TradeIn object for printing
}

const TradeInRowActions: React.FC<TradeInRowActionsProps> = ({
  tradeInId,
  status,
  actionLoading,
  onApprove,
  onDeny,
  onDelete,
  tradeIn
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { printers, isLoading: printersLoading } = usePrinters();
  const { sendToShopify, isLoading: shopifyLoading } = useShopify();

  const handlePrintBarcode = async (selectedTradeIn: TradeIn, printerId: string) => {
    await printService.printTradeInBarcode(selectedTradeIn, printerId);
  };

  const handleSendToShopify = async () => {
    if (!tradeIn) return;
    
    try {
      await sendToShopify(tradeIn.id);
      toast.success('Trade-in items sent to Shopify successfully');
    } catch (error) {
      console.error('Error sending to Shopify:', error);
      toast.error('Failed to send items to Shopify');
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
        {status === 'pending' && (
          <>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onApprove(tradeInId);
              }}
              disabled={actionLoading === tradeInId}
              className="p-1 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
              title="Approve Trade-In"
            >
              <Check className="h-4 w-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeny(tradeInId);
              }}
              disabled={actionLoading === tradeInId}
              className="p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
              title="Deny Trade-In"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
        
        {/* Add edit button and print button for accepted trade-ins */}
        {status === 'accepted' && tradeIn && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPrintModalOpen(true);
              }}
              disabled={actionLoading === tradeInId}
              className="p-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
              title="Print Barcode"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
              disabled={actionLoading === tradeInId}
              className="p-1 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200"
              title="Edit Trade-In"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSendToShopify();
              }}
              disabled={actionLoading === tradeInId || shopifyLoading || tradeIn.shopify_synced}
              className={`p-1 rounded-full 
                ${tradeIn.shopify_synced 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'}`}
              title={tradeIn.shopify_synced ? 'Already synced with Shopify' : 'Send to Shopify'}
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </>
        )}
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tradeInId);
          }}
          disabled={actionLoading === tradeInId}
          className="p-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
          title="Delete Trade-In"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Printer selection modal */}
      {isPrintModalOpen && tradeIn && (
        <PrinterSelectionModal
          tradeIn={tradeIn}
          printers={printers}
          isLoading={printersLoading}
          onClose={() => setIsPrintModalOpen(false)}
          onPrint={handlePrintBarcode}
        />
      )}

      {/* Edit trade-in modal */}
      {isEditModalOpen && tradeIn && (
        <EditTradeInModal
          tradeIn={tradeIn}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default TradeInRowActions;
