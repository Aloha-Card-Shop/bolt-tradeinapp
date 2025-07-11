
import React from 'react';
import { CardDetails } from '../../../types/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CardImage from './CardImage';
import ItemDetails from '../ItemDetails';

interface CardHeaderProps {
  card: CardDetails;
  index: number;
  onRemove: (index: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({ 
  card, 
  index, 
  onRemove, 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const isCertified = card.isCertified;
  const certificationGrade = card.certification?.grade;
  const certificationNumber = card.certification?.certNumber;

  return (
    <div className="flex items-start space-x-4">
      <CardImage imageUrl={card.imageUrl} name={card.name} />
      <div className="flex-1">
        <ItemDetails 
          name={card.name}
          set={card.set}
          onRemove={() => onRemove(index)}
        />
        
        {/* Show certification badge for graded cards */}
        {isCertified && (
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-50 text-blue-700 rounded-md px-2 py-1 text-xs">
                <span className="font-medium">PSA {certificationGrade}</span>
                {certificationNumber && (
                  <span className="text-blue-600 ml-1">#{certificationNumber}</span>
                )}
              </div>
              <div className="bg-white px-2 py-1 rounded-full text-blue-600 text-xs font-bold border border-blue-200">
                Certified
              </div>
            </div>
            
            {/* Collapse toggle for certified cards */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="flex items-center text-gray-500 hover:text-gray-700 text-xs bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                title={isCollapsed ? "Expand details" : "Collapse details"}
              >
                {isCollapsed ? (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand
                  </>
                ) : (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Collapse
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CardHeader;
