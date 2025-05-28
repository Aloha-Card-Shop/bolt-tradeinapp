
import React, { useRef, useEffect, useState } from 'react';
import { Download, FileImage, FileText, Image } from 'lucide-react';
import BarcodeGenerator from './BarcodeGenerator';
import { TradeIn } from '../../types/tradeIn';
import { downloadService, DownloadOptions } from '../../services/downloadService';

interface DownloadableBarcodeGeneratorProps {
  tradeIn: TradeIn;
  showDownloadButtons?: boolean;
  defaultFormat?: 'png' | 'pdf' | 'svg';
  includeCustomerInfo?: boolean;
}

const DownloadableBarcodeGenerator: React.FC<DownloadableBarcodeGeneratorProps> = ({
  tradeIn,
  showDownloadButtons = true,
  defaultFormat = 'png',
  includeCustomerInfo = true
}) => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'png' | 'pdf' | 'svg') => {
    setIsDownloading(format);
    try {
      const options: DownloadOptions = {
        format,
        includeCustomerInfo
      };
      await downloadService.downloadTradeInBarcode(tradeIn, options);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barcode Preview */}
      <BarcodeGenerator tradeIn={tradeIn} />
      
      {/* Download Buttons */}
      {showDownloadButtons && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => handleDownload('png')}
            disabled={isDownloading === 'png'}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {isDownloading === 'png' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileImage className="h-4 w-4 mr-2" />
            )}
            PNG
          </button>
          
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading === 'pdf'}
            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            {isDownloading === 'pdf' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            PDF
          </button>
          
          <button
            onClick={() => handleDownload('svg')}
            disabled={isDownloading === 'svg'}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {isDownloading === 'svg' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Image className="h-4 w-4 mr-2" />
            )}
            SVG
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadableBarcodeGenerator;
