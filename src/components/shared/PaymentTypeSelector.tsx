import React from 'react';
import { DollarSign, Tag, ChevronsDown, Loader2 } from 'lucide-react';

interface PaymentTypeSelectorProps {
  paymentType: 'cash' | 'trade' | null;
  onSelect: (type: 'cash' | 'trade') => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'global';
  disabled?: boolean;
  isLoading?: boolean;
  showIcons?: boolean;
  showPrompt?: boolean;
  totalItems?: number;
  isIndividual?: boolean;
  className?: string;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  paymentType,
  onSelect,
  size = 'md',
  variant = 'default',
  disabled = false,
  isLoading = false,
  showIcons = true,
  showPrompt = true,
  totalItems,
  isIndividual = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const buttonSize = sizeClasses[size];
  
  const labelText = isIndividual 
    ? 'Individual Payment Type' 
    : totalItems 
    ? `Payment Type for All Items`
    : 'Payment Type';

  const baseButtonClass = `
    ${buttonSize} font-medium rounded-lg transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-1 
    disabled:pointer-events-none disabled:opacity-50
    flex items-center justify-center gap-2
  `;

  const getButtonClass = (type: 'cash' | 'trade') => {
    const isSelected = paymentType === type;
    
    if (variant === 'global') {
      return `${baseButtonClass} ${
        isSelected
          ? type === 'cash'
            ? 'bg-success-light text-success border-2 border-success-border shadow-sm'
            : 'bg-warning-light text-warning border-2 border-warning-border shadow-sm'
          : 'bg-card text-foreground border border-border hover:bg-muted/50 hover:shadow-sm'
      }`;
    }
    
    return `${baseButtonClass} ${
      isSelected
        ? type === 'cash'
          ? 'bg-success-light text-success border border-success-border'
          : 'bg-warning-light text-warning border border-warning-border'
        : 'bg-card text-foreground border border-border hover:bg-muted/50'
    }`;
  };

  const IconComponent = ({ type }: { type: 'cash' | 'trade' }) => {
    if (!showIcons) return null;
    
    const iconClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    return type === 'cash' ? (
      <DollarSign className={iconClass} />
    ) : (
      <Tag className={iconClass} />
    );
  };

  const containerClass = variant === 'global' 
    ? 'card-base p-4 space-y-3'
    : 'space-y-2';

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Header */}
      <div className={variant === 'global' ? 'flex items-center justify-between' : ''}>
        <label className={`block font-medium text-foreground ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}>
          {labelText}
          {isLoading && <Loader2 className="inline ml-2 h-3 w-3 animate-spin text-primary" />}
        </label>
        {variant === 'global' && totalItems && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {totalItems} items
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className={`grid grid-cols-2 ${
        variant === 'compact' ? 'gap-1' : variant === 'global' ? 'gap-3' : 'gap-2'
      }`}>
        <button
          type="button"
          onClick={() => onSelect('cash')}
          disabled={disabled || isLoading}
          className={getButtonClass('cash')}
          aria-pressed={paymentType === 'cash'}
        >
          <IconComponent type="cash" />
          <span>{variant === 'global' ? 'Cash Payment' : 'Cash'}</span>
        </button>
        
        <button
          type="button"
          onClick={() => onSelect('trade')}
          disabled={disabled || isLoading}
          className={getButtonClass('trade')}
          aria-pressed={paymentType === 'trade'}
        >
          <IconComponent type="trade" />
          <span>{variant === 'global' ? 'Trade Credit' : 'Trade'}</span>
        </button>
      </div>

      {/* Prompt/Help Text */}
      {showPrompt && paymentType === null && !disabled && !isLoading && (
        <div className="flex items-center justify-center text-xs text-info animate-fade-in">
          <ChevronsDown className="h-3 w-3 mr-1 animate-bounce" />
          <span>
            {variant === 'compact' 
              ? 'Select payment type' 
              : 'Select payment type to calculate value'
            }
          </span>
        </div>
      )}

      {/* Individual override note */}
      {isIndividual && (
        <p className="text-xs text-muted-foreground text-center">
          Override global setting
        </p>
      )}

      {/* Global selector note */}
      {variant === 'global' && (
        <p className="text-xs text-muted-foreground text-center">
          This will apply to all items. You can still change individual items below.
        </p>
      )}
    </div>
  );
};

export default PaymentTypeSelector;