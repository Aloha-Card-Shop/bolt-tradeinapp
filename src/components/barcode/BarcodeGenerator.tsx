
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { TradeIn } from '../../types/tradeIn';
import { formatCurrency } from '../../utils/formatters';

interface BarcodeGeneratorProps {
  tradeIn: TradeIn;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  tradeIn,
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

  // Format date for display
  const formattedDate = new Date(tradeIn.trade_in_date).toLocaleDateString();
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="mb-2 text-center text-sm">
        <div className="font-bold">{tradeIn.customer_name}</div>
        <div className="text-xs text-gray-600">{formattedDate}</div>
        <div className="text-xs">${formatCurrency(tradeIn.total_value)}</div>
      </div>
      <svg ref={barcodeRef} className="w-full"></svg>
    </div>
  );
};

export default BarcodeGenerator;
