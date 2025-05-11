
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
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* Top 25%: Price and Condition */}
      <div className="mb-2 text-center font-bold border-b pb-2">
        <div className="text-lg">{cardPrice} | {cardCondition}</div>
      </div>
      
      {/* Middle 50%: Barcode */}
      <div className="py-2">
        <svg ref={barcodeRef} className="w-full"></svg>
      </div>
      
      {/* Bottom 25%: Card Name and Number */}
      <div className="mt-2 text-center border-t pt-2">
        <div className="font-medium truncate">{cardName}</div>
        <div className="text-xs text-gray-600">{cardNumber}</div>
      </div>
    </div>
  );
};

export default CardBarcodeGenerator;
