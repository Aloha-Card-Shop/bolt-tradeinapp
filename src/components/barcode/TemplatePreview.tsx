
import React from 'react';
import { BarcodeTemplate } from '../../types/barcode';
import { TradeIn, TradeInItem } from '../../types/tradeIn';
import BarcodeGenerator from './BarcodeGenerator';
import CardBarcodeGenerator from './CardBarcodeGenerator';

interface TemplatePreviewProps {
  template?: BarcodeTemplate | null;
  sampleTradeIn?: TradeIn;
  templateType?: 'standard' | 'card';
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

// Create a sample trade-in item for preview
const createSampleItem = (): TradeInItem => {
  return {
    card_name: 'Charizard Holo',
    quantity: 1,
    price: 45.00,
    condition: 'near_mint',
    attributes: {
      isFirstEdition: true,
      isHolo: true,
      cardNumber: '4/102',
      setName: 'Base Set',
      paymentType: 'cash',
      cashValue: 22.50,
      tradeValue: 29.25
    }
  };
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, sampleTradeIn, templateType = 'standard' }) => {
  const tradeIn = sampleTradeIn || createSampleTradeIn();
  const sampleItem = createSampleItem();
  
  return (
    <div className="border rounded-md p-4">
      <h3 className="font-medium text-gray-800 mb-2">Template Preview</h3>
      <div className="bg-white border border-gray-200 p-3 rounded shadow-sm">
        <div className="w-full flex justify-center">
          {/* Add size guide */}
          <div className="border-2 border-dashed border-gray-400 p-1 relative" style={{ width: '384px' }}>
            <div className="absolute -top-6 left-0 right-0 text-xs text-gray-500 text-center">2" x 1" label</div>
            {templateType === 'card' ? (
              <CardBarcodeGenerator 
                tradeIn={tradeIn}
                item={sampleItem}
                width={2} 
                height={50} // Reduced from 60 to 50
                displayValue={true} 
                fontSize={12} 
              />
            ) : (
              <div style={{ aspectRatio: '2/1', width: '100%' }}>
                <BarcodeGenerator 
                  tradeIn={tradeIn} 
                  width={2} 
                  height={150} 
                  displayValue={true} 
                  fontSize={16} 
                />
              </div>
            )}
          </div>
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
