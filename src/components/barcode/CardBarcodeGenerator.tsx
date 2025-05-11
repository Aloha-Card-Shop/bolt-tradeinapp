
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { TradeIn } from '../../types/tradeIn';
import { TradeInItem } from '../../types/tradeIn';
import { formatCurrency } from '../../utils/formatters';

interface CardBarcodeGeneratorProps {
  tradeIn: TradeIn;
  item?: TradeInItem;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

const CardBarcodeGenerator: React.FC<CardBarcodeGeneratorProps> = ({
  tradeIn,
  item,
  width = 2,
  height = 60, // Further reduced from 70 to 60
  displayValue = true,
  fontSize = 12,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (barcodeRef.current && tradeIn.id) {
      try {
        JsBarcode(barcodeRef.current, tradeIn.id, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          marginTop: 3, // Reduced from 5 to 3
          marginBottom: 3, // Reduced from 5 to 3
          background: '#ffffff'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [tradeIn.id, width, height, displayValue, fontSize]);
  
  // Get card details if an item is provided
  const cardName = item?.card_name || 'Card';
  const cardNumber = item?.attributes?.cardNumber || '';
  const cardPrice = item ? formatCurrency(item.price) : '';
  const cardCondition = item?.condition || 'N/A';
  
  // Get set name if available
  const setName = item?.attributes?.setName || '';
  
  // Format display text for bottom line
  const bottomText = [
    cardName,
    setName,
    cardNumber
  ].filter(Boolean).join(' • ');
  
  return (
    <div className="bg-white p-2 rounded-lg shadow" style={{ aspectRatio: '2/1', width: '100%', maxWidth: '384px' }}>
      {/* Top section: Price and Condition - with responsive text and smaller padding */}
      <div className="mb-2 text-center border-b pb-2 w-full">
        <div className="text-xl font-bold w-full px-1 flex justify-center items-center">
          <span className="truncate text-center w-full">{cardPrice} | {cardCondition}</span>
        </div>
      </div>
      
      {/* Middle section: Barcode - height reduced */}
      <div className="py-1">
        <svg ref={barcodeRef} className="w-full"></svg>
      </div>
      
      {/* Bottom section: Card Name, Set Name and Number - with responsive text and smaller padding */}
      <div className="mt-1 text-center border-t pt-2">
        <div className="text-sm font-medium w-full px-1">
          <span className="truncate inline-block w-full">{bottomText}</span>
        </div>
      </div>
    </div>
  );
};

export default CardBarcodeGenerator;
