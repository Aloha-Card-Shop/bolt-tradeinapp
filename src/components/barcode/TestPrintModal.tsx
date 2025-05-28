import React, { useState } from 'react';
import { X, Printer, TestTube } from 'lucide-react';
import { Printer as PrinterType } from '../../types/printer';
import BarcodeGenerator from './BarcodeGenerator';
import CardBarcodeGenerator from './CardBarcodeGenerator';
import { TradeIn } from '../../types/tradeIn';
import { barcodeService } from '../../services/barcodeService';

interface TestPrintModalProps {
  printers: PrinterType[];
  isLoading: boolean;
  onClose: () => void;
}

const TestPrintModal: React.FC<TestPrintModalProps> = ({
  printers,
  isLoading,
  onClose
}) => {
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(
    printers.find(p => p.is_default)?.id || (printers[0]?.id || '')
  );
  const [testType, setTestType] = useState<'standard' | 'card'>('standard');
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate a proper UUID for the mock trade-in
  const generateMockUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Mock trade-in data for testing with proper UUID
  const mockTradeIn: TradeIn = {
    id: generateMockUUID(),
    trade_in_date: new Date().toISOString(),
    total_value: 125.50,
    cash_value: 100.40,
    trade_value: 125.50,
    customer_name: 'Test Customer',
    customer_id: 'test-customer-id',
    status: 'accepted',
    printed: false,
    print_count: 0
  };

  // Mock card item for card test
  const mockCardItem = {
    id: 'test-card-id',
    card_id: 'test-card',
    card_name: 'Charizard',
    quantity: 1,
    price: 45.99,
    condition: 'near_mint' as const,
    attributes: {
      setName: 'Base Set',
      cardNumber: '4/102',
      isFirstEdition: false,
      isHolo: true
    },
    tcgplayer_url: 'https://www.tcgplayer.com/product/88/pokemon-base-set-charizard',
    image_url: '',
    trade_in_id: mockTradeIn.id
  };

  const handleTestPrint = async () => {
    if (!selectedPrinterId) return;
    
    setIsPrinting(true);
    try {
      // Use the new test print method
      await barcodeService.printTestBarcode(
        mockTradeIn, 
        selectedPrinterId, 
        testType === 'card' ? mockCardItem.id : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error sending test print:', error);
      // Error is already handled by barcodeService.printTestBarcode
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">Test Print</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Test Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type:
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setTestType('standard')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  testType === 'standard'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Standard Trade-In
              </button>
              <button
                onClick={() => setTestType('card')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  testType === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Individual Card
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="text-sm font-medium mb-2">Preview:</h4>
            <div className="border border-gray-200 rounded p-4 flex justify-center bg-gray-50">
              {testType === 'card' ? (
                <div style={{ width: '2in', height: '1in' }} className="flex items-center justify-center">
                  <CardBarcodeGenerator 
                    tradeIn={mockTradeIn} 
                    item={mockCardItem}
                    height={60}
                  />
                </div>
              ) : (
                <div style={{ width: '2in', height: '1in' }} className="flex items-center justify-center">
                  <BarcodeGenerator tradeIn={mockTradeIn} height={60} />
                </div>
              )}
            </div>
          </div>

          {/* Printer Selection */}
          <div>
            <label htmlFor="test-printer-select" className="block text-sm font-medium text-gray-700 mb-2">
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
                id="test-printer-select"
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

          {/* Test Information */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Test Information</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><span className="font-medium">Test ID:</span> {mockTradeIn.id}</p>
              <p><span className="font-medium">Customer:</span> {mockTradeIn.customer_name}</p>
              <p><span className="font-medium">Value:</span> ${mockTradeIn.total_value.toFixed(2)}</p>
              {testType === 'card' && (
                <>
                  <p><span className="font-medium">Card:</span> {mockCardItem.card_name}</p>
                  <p><span className="font-medium">Set:</span> {mockCardItem.attributes?.setName}</p>
                  <p><span className="font-medium">Price:</span> ${mockCardItem.price.toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isPrinting}
          >
            Cancel
          </button>
          <button
            onClick={handleTestPrint}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isPrinting || isLoading || printers.length === 0}
          >
            {isPrinting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent mr-2"></span>
                Sending Test...
              </>
            ) : (
              <>
                <Printer size={16} className="mr-2" />
                Send Test Print
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPrintModal;
