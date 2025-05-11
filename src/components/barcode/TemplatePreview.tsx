
import React from 'react';
import { BarcodeTemplate } from '../../types/barcode';
import { TradeIn } from '../../types/tradeIn';
import BarcodeGenerator from './BarcodeGenerator';

interface TemplatePreviewProps {
  template?: BarcodeTemplate | null;
  sampleTradeIn?: TradeIn;
}

// Create a sample trade-in for preview
const createSampleTradeIn = (): TradeIn => {
  const now = new Date().toISOString();
  return {
    id: 'SAMPLE-123-456-789',
    customer_id: 'sample-customer-id',
    customer_name: 'John Doe',
    customers: {
      first_name: 'John',
      last_name: 'Doe'
    },
    trade_in_date: now,
    total_value: 124.99,
    cash_value: 62.50,
    trade_value: 81.25,
    status: 'pending',
    payment_type: 'mixed',
    printed: false,
    print_count: 0
  };
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, sampleTradeIn }) => {
  const tradeIn = sampleTradeIn || createSampleTradeIn();
  
  return (
    <div className="border rounded-md p-4">
      <h3 className="font-medium text-gray-800 mb-2">Template Preview</h3>
      <div className="bg-white border border-gray-200 p-3 rounded shadow-sm">
        <div className="w-full">
          <BarcodeGenerator tradeIn={tradeIn} width={2.5} height={150} displayValue={true} fontSize={16} />
        </div>
        
        {template && (
          <div className="mt-4 p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-32">
            <p className="text-gray-500 mb-1">ZPL Template:</p>
            <pre className="whitespace-pre-wrap break-all">{template.zpl_template}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatePreview;
