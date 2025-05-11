
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
  height = 70, // Reduced from 100 to 70
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
          marginTop: 5, // Reduced from 10 to 5
          marginBottom: 5, // Reduced from 10 to 5
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
      {/* Top section: Price and Condition - doubled padding, increased font size */}
      <div className="mb-4 text-center border-b pb-6 w-full">
        <div className="text-2xl font-bold">{cardPrice} | {cardCondition}</div>
      </div>
      
      {/* Middle section: Barcode - height reduced */}
      <div className="py-2">
        <svg ref={barcodeRef} className="w-full"></svg>
      </div>
      
      {/* Bottom section: Card Name, Set Name and Number - doubled padding, increased font size */}
      <div className="mt-4 text-center border-t pt-6">
        <div className="text-base font-medium truncate">{bottomText}</div>
      </div>
    </div>
  );
};

export default CardBarcodeGenerator;
