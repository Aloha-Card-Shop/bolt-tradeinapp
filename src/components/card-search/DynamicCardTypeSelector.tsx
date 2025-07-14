import React, { useState, useEffect } from 'react';
import { Package, Star, Sparkles } from 'lucide-react';
import { getCardVariantAvailability, VariantAvailability } from '../../services/variantAvailabilityService';

interface DynamicCardTypeSelectorProps {
  productId?: string | null;
  cardName: string;
  setName?: string;
  selectedType: string;
  onTypeChange: (type: string) => void;
  disabled?: boolean;
}

const DynamicCardTypeSelector: React.FC<DynamicCardTypeSelectorProps> = ({
  productId,
  cardName,
  setName,
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  const [availability, setAvailability] = useState<VariantAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!productId && !cardName) return;
      
      setIsLoading(true);
      try {
        const variantData = await getCardVariantAvailability(productId, cardName, setName);
        setAvailability(variantData);
        
        // Auto-set 'normal' type if no variants are available and no type is currently selected
        const hasAnyVariants = Object.values(variantData).some(value => value === true);
        if (!hasAnyVariants && !selectedType) {
          console.log('No variants available for card, setting default type to normal:', cardName);
          onTypeChange('normal');
        }
      } catch (error) {
        console.error('Error fetching variant availability:', error);
        // Fallback to normal type if there's an error
        if (!selectedType) {
          onTypeChange('normal');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [productId, cardName, setName, selectedType, onTypeChange]);

  // Define available card types based on database availability
  const getAvailableTypes = () => {
    if (!availability) return [];
    
    const types = [];
    
    if (availability.normal) {
      types.push({
        key: 'normal',
        label: 'Normal',
        icon: Package,
        description: 'Regular card'
      });
    }
    
    if (availability.firstEdition) {
      types.push({
        key: 'first_edition',
        label: '1st Edition',
        icon: Star,
        description: 'First edition'
      });
    }
    
    if (availability.holo) {
      types.push({
        key: 'holo',
        label: 'Holo',
        icon: Sparkles,
        description: 'Holographic'
      });
    }
    
    if (availability.reverseHolo) {
      types.push({
        key: 'reverse_holo',
        label: 'Reverse Holo',
        icon: Sparkles,
        description: 'Reverse holographic'
      });
    }
    
    if (availability.unlimited) {
      types.push({
        key: 'unlimited',
        label: 'Unlimited',
        icon: Package,
        description: 'Unlimited edition'
      });
    }
    
    if (availability.firstEditionHolo) {
      types.push({
        key: 'first_edition_holo',
        label: '1st Ed. Holo',
        icon: Sparkles,
        description: 'First edition holographic'
      });
    }
    
    if (availability.unlimitedHolo) {
      types.push({
        key: 'unlimited_holo',
        label: 'Unlimited Holo',
        icon: Sparkles,
        description: 'Unlimited holographic'
      });
    }
    
    return types;
  };

  const availableTypes = getAvailableTypes();

  // If no types are available or still loading, don't render anything
  if (isLoading || availableTypes.length === 0) {
    return null;
  }

  // If only one type is available, don't show selector but auto-select it
  if (availableTypes.length === 1 && selectedType !== availableTypes[0].key) {
    onTypeChange(availableTypes[0].key);
    return null;
  }

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Card Type
      </label>
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.key;
          
          return (
            <button
              key={type.key}
              onClick={() => !disabled && onTypeChange(type.key)}
              disabled={disabled}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={type.description}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{type.label}</span>
            </button>
          );
        })}
      </div>
      {selectedType && (
        <p className="text-xs text-gray-500 mt-1">
          Selected: {availableTypes.find(t => t.key === selectedType)?.label}
        </p>
      )}
    </div>
  );
};

export default DynamicCardTypeSelector;