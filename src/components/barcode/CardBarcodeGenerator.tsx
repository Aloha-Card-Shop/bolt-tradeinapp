
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
  height = 100,
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
          marginTop: 10,
          marginBottom: 10,
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
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Top section: Price and Condition - full width */}
      <div className="mb-3 text-center border-b pb-3 w-full">
        <div className="text-xl font-bold">{cardPrice} | {cardCondition}</div>
      </div>
      
      {/* Middle section: Barcode - slightly larger */}
      <div className="py-3">
        <svg ref={barcodeRef} className="w-full"></svg>
      </div>
      
      {/* Bottom section: Card Name, Set Name and Number on one line */}
      <div className="mt-3 text-center border-t pt-3">
        <div className="text-sm font-medium truncate">{bottomText}</div>
      </div>
    </div>
  );
};

export default CardBarcodeGenerator;
