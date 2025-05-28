
import React, { useState } from 'react';
import { FileImage, FileText } from 'lucide-react';
import CardBarcodeGenerator from './CardBarcodeGenerator';
import { TradeIn, TradeInItem } from '../../types/tradeIn';
import { downloadService, DownloadOptions } from '../../services/downloadService';

interface DownloadableCardBarcodeGeneratorProps {
  tradeIn: TradeIn;
  item: TradeInItem;
  showDownloadButtons?: boolean;
}

const DownloadableCardBarcodeGenerator: React.FC<DownloadableCardBarcodeGeneratorProps> = ({
  tradeIn,
  item,
  showDownloadButtons = true
}) => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'png' | 'pdf') => {
    setIsDownloading(format);
    try {
      const options: DownloadOptions = { format };
      await downloadService.downloadCardBarcode(tradeIn, item, options);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card Barcode Preview */}
      <CardBarcodeGenerator tradeIn={tradeIn} item={item} />
      
      {/* Download Buttons */}
      {showDownloadButtons && (
        <div className="flex gap-2 justify-center">
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
        </div>
      )}
    </div>
  );
};

export default DownloadableCardBarcodeGenerator;
