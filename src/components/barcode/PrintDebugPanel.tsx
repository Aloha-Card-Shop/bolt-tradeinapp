import React, { useState } from 'react';
import { Download, Eye, Code, Bug, Printer } from 'lucide-react';
import EnhancedZplViewer from './EnhancedZplViewer';

interface PrintDebugPanelProps {
  zplCode: string;
  printerInfo?: {
    id: string;
    name: string;
    printer_id: string;
    printer_type?: 'ZPL' | 'RAW';
  };
  tradeInData?: any;
  cardData?: any;
  onTestPrint?: () => void;
  isTestPrinting?: boolean;
}

const PrintDebugPanel: React.FC<PrintDebugPanelProps> = ({
  zplCode,
  printerInfo,
  tradeInData,
  cardData,
  onTestPrint,
  isTestPrinting = false
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'zpl' | 'debug'>('preview');

  const downloadZpl = () => {
    const blob = new Blob([zplCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-label-${Date.now()}.zpl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyZplToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(zplCode);
      alert('ZPL code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy ZPL to clipboard:', err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium">Print Debug Panel</h3>
          {printerInfo?.printer_type && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              printerInfo.printer_type === 'ZPL' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {printerInfo.printer_type}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={downloadZpl}
            className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            title="Download ZPL file"
          >
            <Download className="h-4 w-4 mr-1" />
            Download ZPL
          </button>
          {onTestPrint && (
            <button
              onClick={onTestPrint}
              disabled={isTestPrinting}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isTestPrinting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent mr-2"></span>
                  Testing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-1" />
                  Test Print
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visual Preview
          </button>
          <button
            onClick={() => setActiveTab('zpl')}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
              activeTab === 'zpl'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Code className="h-4 w-4 mr-2" />
            ZPL Code
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`py-4 px-1 inline-flex items-center border-b-2 text-sm font-medium ${
              activeTab === 'debug'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bug className="h-4 w-4 mr-2" />
            Debug Info
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              This shows how your label will look when printed:
            </div>
            <div className="flex justify-center">
              <EnhancedZplViewer 
                zplCode={zplCode} 
                printerType={printerInfo?.printer_type || 'ZPL'}
                width={384} 
                height={192} 
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {printerInfo?.printer_type === 'RAW' 
                ? 'RAW printers will receive this as an image. ZPL code is converted automatically.'
                : 'ZPL printers will receive this code directly for fast, precise printing.'
              }
            </div>
          </div>
        )}

        {activeTab === 'zpl' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Raw ZPL code that will be sent to the printer:
              </div>
              <button
                onClick={copyZplToClipboard}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md border">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                {zplCode}
              </pre>
            </div>
            <div className="text-xs text-gray-500">
              You can test this ZPL code with online ZPL viewers or send it directly to your printer using ZPL utilities.
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-6">
            {/* Printer Information */}
            {printerInfo && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Printer Information</h4>
                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                  <div><span className="font-medium">Name:</span> {printerInfo.name}</div>
                  <div><span className="font-medium">Type:</span> 
                    <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded ${
                      printerInfo.printer_type === 'ZPL' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {printerInfo.printer_type || 'ZPL'}
                    </span>
                  </div>
                  <div><span className="font-medium">ID:</span> {printerInfo.id}</div>
                  <div><span className="font-medium">PrintNode ID:</span> {printerInfo.printer_id}</div>
                  <div><span className="font-medium">Output Format:</span> {
                    (printerInfo.printer_type || 'ZPL') === 'ZPL' ? 'Raw ZPL Code' : 'PNG Image (converted from ZPL)'
                  }</div>
                </div>
              </div>
            )}

            {/* Trade-In Data */}
            {tradeInData && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Trade-In Data</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                    {JSON.stringify(tradeInData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Card Data */}
            {cardData && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Card Data</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                    {JSON.stringify(cardData, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Enhanced ZPL Analysis */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">ZPL Analysis & Conversion</h4>
              <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                <div><span className="font-medium">ZPL Length:</span> {zplCode.length} characters</div>
                <div><span className="font-medium">Commands:</span> {(zplCode.match(/\^[A-Z]+/g) || []).length}</div>
                <div><span className="font-medium">Text Fields:</span> {(zplCode.match(/\^FD/g) || []).length}</div>
                <div><span className="font-medium">Barcodes:</span> {(zplCode.match(/\^BC/g) || []).length}</div>
                <div><span className="font-medium">Format:</span> {
                  (printerInfo?.printer_type || 'ZPL') === 'ZPL' 
                    ? 'Direct ZPL transmission' 
                    : 'ZPL → Image conversion → PNG transmission'
                }</div>
              </div>
            </div>

            {/* Enhanced Troubleshooting Tips */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">Troubleshooting Tips</h4>
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Check if printer has labels loaded and is powered on</li>
                  <li>Verify printer darkness/heat settings</li>
                  {(printerInfo?.printer_type || 'ZPL') === 'ZPL' ? (
                    <>
                      <li>Try printing a test page from the printer's control panel</li>
                      <li>Check if the label size matches your printer configuration (2" x 1")</li>
                      <li>Test the ZPL code with a ZPL viewer online to verify formatting</li>
                    </>
                  ) : (
                    <>
                      <li>Ensure printer supports PNG/image printing</li>
                      <li>Check printer driver is installed correctly</li>
                      <li>Verify label size matches the generated image (2" x 1")</li>
                      <li>Try adjusting print quality settings in printer preferences</li>
                    </>
                  )}
                  <li>Try a different printer if available</li>
                  <li>Check PrintNode client is running and printer is online</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintDebugPanel;
