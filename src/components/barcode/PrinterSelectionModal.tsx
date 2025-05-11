
import React, { useState } from 'react';
import { X, Printer } from 'lucide-react';
import { TradeIn } from '../../types/tradeIn';
import BarcodeGenerator from './BarcodeGenerator';
import { Printer as PrinterType } from '../../types/printer';

interface PrinterSelectionModalProps {
  tradeIn: TradeIn;
  printers: PrinterType[];
  isLoading: boolean;
  onClose: () => void;
  onPrint: (tradeIn: TradeIn, printerId: string) => Promise<void>;
}

const PrinterSelectionModal: React.FC<PrinterSelectionModalProps> = ({
  tradeIn,
  printers,
  isLoading,
  onClose,
  onPrint
}) => {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(
    printers.find(p => p.is_default)?.id || (printers[0]?.id || '')
  );
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!selectedPrinterId) return;
    
    setIsPrinting(true);
    try {
      await onPrint(tradeIn, selectedPrinterId);
      onClose();
    } catch (error) {
      console.error('Error printing barcode:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Print Barcode Label</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Preview:</h4>
          <div className="border border-gray-200 rounded p-2 flex justify-center">
            <div style={{ width: '2in', height: '1in' }} className="flex items-center justify-center">
              <BarcodeGenerator tradeIn={tradeIn} height={60} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="printer-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Printer:
          </label>
          {isLoading ? (
            <div className="text-center py-3">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading printers...</p>
            </div>
          ) : printers.length === 0 ? (
            <div className="text-center py-3 text-amber-600">
              No printers found. Please add printers in the admin settings.
            </div>
          ) : (
            <select
              id="printer-select"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedPrinterId}
              onChange={(e) => setSelectedPrinterId(e.target.value)}
            >
              {printers.map((printer) => (
                <option key={printer.id} value={printer.id}>
                  {printer.name} {printer.is_default && "(Default)"}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isPrinting}
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isPrinting || isLoading || printers.length === 0}
          >
            {isPrinting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent mr-2"></span>
                Printing...
              </>
            ) : (
              <>
                <Printer size={16} className="mr-2" />
                Print Barcode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrinterSelectionModal;
