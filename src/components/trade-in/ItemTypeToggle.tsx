
import React from 'react';
import CardAttributes from './shared/CardAttributes';
import { VariantAvailability } from '../../services/variantAvailabilityService';

interface ItemTypeToggleProps {
  isFirstEdition: boolean;
  isHolo: boolean;
  isReverseHolo?: boolean;
  onToggleFirstEdition: () => void;
  onToggleHolo: () => void;
  onToggleReverseHolo?: () => void;
  isLoading?: boolean;
  availability?: VariantAvailability;
  isLoadingAvailability?: boolean;
}

const ItemTypeToggle: React.FC<ItemTypeToggleProps> = (props) => {
  // Use our shared component with the same props
  return (
    <div className="col-span-2">
      <CardAttributes 
        {...props} 
        isReverseHolo={props.isReverseHolo || false} 
        onToggleReverseHolo={props.onToggleReverseHolo || (() => {})} 
      />
    </div>
  );
};

export default ItemTypeToggle;
