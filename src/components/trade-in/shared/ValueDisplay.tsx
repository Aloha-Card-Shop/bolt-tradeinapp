
import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { Pencil, Check, X } from 'lucide-react';
import FallbackWarning from '../FallbackWarning';

interface ValueDisplayProps {
  label: string;
  value: number;
  isLoading: boolean;
  error?: string;
  onValueChange?: (valueType: 'cash' | 'trade', value: number) => void;
  editable?: boolean;
  usedFallback?: boolean;
  fallbackReason?: string;
  valueType: 'cash' | 'trade';
}

const ValueDisplay: React.FC<ValueDisplayProps> = ({
  label,
  value,
  isLoading,
  error,
  onValueChange,
  editable = false,
  usedFallback = false,
  fallbackReason,
  valueType
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleStartEdit = () => {
    if (editable) {
      setEditValue(value.toFixed(2));
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    console.log('ValueDisplay SHARED: Save clicked with editValue:', editValue, 'onValueChange available:', !!onValueChange);
    try {
      const numValue = parseFloat(editValue);
      console.log('ValueDisplay SHARED: Parsed value:', numValue, 'is valid:', !isNaN(numValue) && numValue >= 0);
      
      if (!isNaN(numValue) && numValue >= 0 && onValueChange) {
        console.log('ValueDisplay SHARED: Calling onValueChange with valueType:', valueType, 'value:', numValue);
        onValueChange(valueType, numValue);
      } else if (isNaN(numValue) || numValue < 0) {
        console.warn('ValueDisplay SHARED: Invalid value entered:', editValue);
        // Reset to original value if invalid
        setEditValue(value.toFixed(2));
      }
    } catch (error) {
      console.error('ValueDisplay SHARED: Error saving value:', error);
      setEditValue(value.toFixed(2));
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    console.log('ValueDisplay SHARED: Cancel clicked');
    setIsEditing(false);
    setEditValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(value.toString());
      }
    } catch (error) {
      console.error('Error handling key down:', error);
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  return (
    <div className={`rounded-md border p-3 relative transition-colors ${
      editable ? 'border-primary/30 hover:border-primary/50 bg-card' : 'border-border bg-muted/30'
    }`}>
      <label className={`block text-sm font-medium mb-1 ${
        editable ? 'text-primary' : 'text-muted-foreground'
      }`}>
        {label} {editable && <span className="text-xs opacity-70">(Click to edit)</span>}
      </label>
      
      {isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center flex-1">
            <span className="text-gray-500 mr-1">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="9999"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
              placeholder="Enter price"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('ValueDisplay SHARED: Save button physically clicked!');
                handleSaveEdit();
              }}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              title="Save (Enter)"
              type="button"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('ValueDisplay SHARED: Cancel button physically clicked!');
                handleCancelEdit();
              }}
              className="p-2 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors shadow-sm"
              title="Cancel (Escape)"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`flex justify-between items-center ${
            editable ? 'cursor-pointer hover:bg-accent/50 rounded-md p-2 -m-2 transition-colors' : ''
          }`} 
          onClick={handleStartEdit}
        >
          <div className="text-lg font-semibold">
            {isLoading ? (
              <div className="animate-pulse bg-muted h-6 w-20 rounded"></div>
            ) : (
              <span className={error ? 'text-destructive' : 'text-foreground'}>
                ${formatCurrency(value)}
              </span>
            )}
          </div>
          
          {editable && !isLoading && (
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </div>
      )}
      
      {usedFallback && !error && !isLoading && (
        <FallbackWarning 
          showWarning={true}
          fallbackReason={fallbackReason}
          compact={true}
          className="absolute bottom-[-20px] left-0"
        />
      )}
    </div>
  );
};

export default ValueDisplay;
