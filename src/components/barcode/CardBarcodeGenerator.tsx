import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { TradeIn } from '../../types/tradeIn';
import { TradeInItem } from '../../types/tradeIn';
import { formatCurrency } from '../../utils/formatters';
import { generateSku } from '../../utils/skuGenerator';

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
  height = 50,
  displayValue = true,
  fontSize = 12,
}) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (barcodeRef.current && tradeIn.id) {
      try {
        // If we have a card item with TCGplayer URL, use it to generate a SKU,
        // otherwise fall back to the trade-in ID
        let barcodeValue = tradeIn.id;
        
        if (item) {
          // Check if this is a graded card first
          const certificationData = {
            isCertified: !!item.attributes?.isCertified,
            certNumber: item.attributes?.certNumber,
            grade: item.attributes?.grade
          };
          
          // Extract TCGPlayer ID from URL if available
          const tcgplayerId = item.tcgplayer_url ? 
            item.tcgplayer_url.match(/\/(\d+)/)?.[1] : undefined;
          
          // Generate SKU with certification data
          const isFirstEdition = !!item.attributes?.isFirstEdition;
          const isHolo = !!item.attributes?.isHolo;
          const isReverseHolo = false; // Default to false if not present
          
          barcodeValue = generateSku(
            tcgplayerId,
            isFirstEdition,
            isHolo,
            item.condition,
            isReverseHolo,
            certificationData
          );
        }
        
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          marginTop: 2,
          marginBottom: 2,
          background: '#ffffff'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [tradeIn.id, item, width, height, displayValue, fontSize]);
  
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

  // Create SKU display if applicable
  let skuDisplay = '';
  if (item) {
    // Check if this is a graded card
    const certificationData = {
      isCertified: !!item.attributes?.isCertified,
      certNumber: item.attributes?.certNumber,
      grade: item.attributes?.grade
    };
    
    // Extract TCGPlayer ID from URL if available
    const tcgplayerId = item.tcgplayer_url ? 
      item.tcgplayer_url.match(/\/(\d+)/)?.[1] : undefined;
    
    const isFirstEdition = !!item.attributes?.isFirstEdition;
    const isHolo = !!item.attributes?.isHolo;
    const isReverseHolo = false; // Default to false since it's not in the attributes type
    
    skuDisplay = generateSku(
      tcgplayerId,
      isFirstEdition,
      isHolo,
      item.condition,
      isReverseHolo,
      certificationData
    );
  }
  
  return (
    <div className="bg-white p-1 rounded-lg shadow" style={{ aspectRatio: '2/1', width: '100%', maxWidth: '384px' }}>
      {/* Top section: Price and Condition - with larger text and more space */}
      <div className="mb-1 text-center border-b pb-1 w-full" style={{ flex: '0 0 40%' }}>
        <div className="text-3xl font-bold w-full px-1 flex justify-center items-center">
          <span className="truncate text-center w-full">{cardPrice} | {cardCondition}</span>
        </div>
        {skuDisplay && (
          <div className="text-xs text-gray-600 -mt-1 mb-1">
            SKU: {skuDisplay}
          </div>
        )}
      </div>
      
      {/* Middle section: Barcode - height reduced */}
      <div className="py-0.5">
        <svg ref={barcodeRef} className="w-full"></svg>
      </div>
      
      {/* Bottom section: Card Name, Set Name and Number - smaller to give more room to top section */}
      <div className="mt-0.5 text-center border-t pt-1">
        <div className="text-xs font-medium w-full px-1">
          <span className="truncate inline-block w-full">{bottomText}</span>
        </div>
      </div>
    </div>
  );
};

export default CardBarcodeGenerator;
