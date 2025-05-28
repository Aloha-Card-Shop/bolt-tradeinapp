
import React, { useState, useMemo } from 'react';
import { X, Download, FileImage, FileText, Image } from 'lucide-react';
import DownloadableBarcodeGenerator from './DownloadableBarcodeGenerator';
import DownloadableCardBarcodeGenerator from './DownloadableCardBarcodeGenerator';
import PrintDebugPanel from './PrintDebugPanel';
import { TradeIn } from '../../types/tradeIn';
import { downloadService } from '../../services/downloadService';

interface TestDownloadModalProps {
  onClose: () => void;
}

const TestDownloadModal: React.FC<TestDownloadModalProps> = ({ onClose }) => {
  const [testType, setTestType] = useState<'standard' | 'card'>('standard');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'pdf' | 'svg'>('png');

  // Generate a proper UUID for the mock trade-in
  const generateMockUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Mock trade-in data for testing
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

  const handleTestDownload = async () => {
    setIsDownloading(true);
    try {
      if (testType === 'card') {
        await downloadService.downloadCardBarcode(mockTradeIn, mockCardItem, { 
          format: downloadFormat === 'svg' ? 'png' : downloadFormat 
        });
      } else {
        await downloadService.downloadTradeInBarcode(mockTradeIn, { 
          format: downloadFormat 
        });
      }
    } catch (error) {
      console.error('Error downloading test barcode:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-medium">Test Download & Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Test Configuration */}
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

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Download Format:
              </label>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setDownloadFormat('png')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    downloadFormat === 'png'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileImage className="h-4 w-4 mr-1 inline" />
                  PNG
                </button>
                <button
                  onClick={() => setDownloadFormat('pdf')}
                  className={`px-4 py-2 text-sm font-medium ${
                    downloadFormat === 'pdf'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1 inline" />
                  PDF
                </button>
                <button
                  onClick={() => setDownloadFormat('svg')}
                  disabled={testType === 'card'}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    downloadFormat === 'svg' && testType !== 'card'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  <Image className="h-4 w-4 mr-1 inline" />
                  SVG
                </button>
              </div>
              {testType === 'card' && downloadFormat === 'svg' && (
                <p className="text-xs text-gray-500 mt-1">SVG format not available for card barcodes</p>
              )}
            </div>

            {/* Preview */}
            <div>
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <div className="border border-gray-200 rounded p-4 flex justify-center bg-gray-50">
                {testType === 'card' ? (
                  <div style={{ width: '2in', height: '1in' }} className="flex items-center justify-center">
                    <DownloadableCardBarcodeGenerator 
                      tradeIn={mockTradeIn} 
                      item={mockCardItem}
                      showDownloadButtons={false}
                    />
                  </div>
                ) : (
                  <div style={{ width: '2in', height: '1in' }} className="flex items-center justify-center">
                    <DownloadableBarcodeGenerator 
                      tradeIn={mockTradeIn} 
                      showDownloadButtons={false}
                    />
                  </div>
                )}
              </div>
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

            {/* Action Buttons */}
            <div className="flex justify-between space-x-2">
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {showDebugPanel ? 'Hide' : 'Show'} Debug Info
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isDownloading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTestDownload}
                  className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download size={16} className="mr-2" />
                      Test Download
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Debug Panel */}
          {showDebugPanel && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Debug Information</h4>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <span className="font-medium">Format:</span> {downloadFormat.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {testType === 'card' ? 'Card Barcode' : 'Trade-In Barcode'}
                  </div>
                  <div>
                    <span className="font-medium">Dimensions:</span> 2" x 1" (384x192px at 192 DPI)
                  </div>
                  {testType === 'card' && (
                    <div>
                      <span className="font-medium">SKU:</span> Generated from TCGPlayer ID
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">Download Benefits</h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• No internet required for printing</li>
                  <li>• Print on any printer</li>
                  <li>• Save labels for later use</li>
                  <li>• Batch print multiple labels</li>
                  <li>• Multiple format options</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestDownloadModal;
