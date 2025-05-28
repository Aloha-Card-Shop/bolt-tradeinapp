
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../integrations/supabase/client';

interface TradeValueSettings {
  game: string;
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

export const useTradeValueSettings = (selectedGame: string) => {
  const [currentSettings, setCurrentSettings] = useState<TradeValueSettings[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[FRONTEND] Fetching settings for game: ${selectedGame}`);
        
        const { data, error } = await supabase.functions.invoke('trade-value-settings', {
          body: { action: 'get', game: selectedGame }
        });
        
        if (error) {
          console.error(`[FRONTEND] Edge function error:`, error);
          throw error;
        }
        
        console.log(`[FRONTEND] Successfully received data:`, data);
        
        if (Array.isArray(data)) {
          setCurrentSettings(data);
          console.log(`[FRONTEND] Set ${data.length} settings`);
        } else {
          console.warn(`[FRONTEND] Expected array but got:`, typeof data, data);
          setCurrentSettings([]);
        }
      } catch (err: any) {
        console.error('[FRONTEND] Fetch error:', err);
        setError(err.message || 'Failed to fetch settings');
        toast.error(`Failed to load settings: ${err.message || 'Unknown error'}`);
        setCurrentSettings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
    setIsModified(false);
  }, [selectedGame]);

  const handleSettingChange = (index: number, field: string, value: string | number | null) => {
    const newSettings = [...currentSettings];
    
    // Type coercion based on field
    if (field === 'min_value' || field === 'max_value' || field === 'cash_percentage' || field === 'trade_percentage') {
      value = Number(value);
    } else if (field === 'fixed_cash_value' || field === 'fixed_trade_value') {
      value = value === '' ? null : Number(value);
    }
    
    newSettings[index] = {
      ...newSettings[index],
      [field]: value,
    };
    
    setCurrentSettings(newSettings);
    setIsModified(true);
  };

  const handleAddSetting = () => {
    const newSetting: TradeValueSettings = {
      game: selectedGame,
      min_value: 0,
      max_value: 100,
      cash_percentage: 0,
      trade_percentage: 0,
      fixed_cash_value: null,
      fixed_trade_value: null,
    };
    setCurrentSettings([...currentSettings, newSetting]);
    setIsModified(true);
  };

  const handleDeleteSetting = (index: number) => {
    const newSettings = [...currentSettings];
    newSettings.splice(index, 1);
    setCurrentSettings(newSettings);
    setIsModified(true);
  };

  const validateSettings = (settings: TradeValueSettings[]): string | null => {
    for (const setting of settings) {
      if (setting.min_value > setting.max_value) {
        return 'Min value cannot be greater than max value.';
      }

      if (setting.fixed_cash_value !== null && setting.fixed_trade_value === null) {
        return 'If fixed cash value is set, fixed trade value must also be set.';
      }

      if (setting.fixed_trade_value !== null && setting.fixed_cash_value === null) {
        return 'If fixed trade value is set, fixed cash value must also be set.';
      }

      if ((setting.cash_percentage < 0 || setting.cash_percentage > 100) || (setting.trade_percentage < 0 || setting.trade_percentage > 100)) {
        return 'Percentage values must be between 0 and 100.';
      }
    }
    return null;
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateSettings(currentSettings);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    try {
      console.log(`[FRONTEND] Saving ${currentSettings.length} settings for game: ${selectedGame}`, currentSettings);
      
      const { error } = await supabase.functions.invoke('trade-value-settings', {
        body: { settings: currentSettings, game: selectedGame }
      });
      
      if (error) {
        console.error(`[FRONTEND] Save error:`, error);
        toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`);
        return;
      }
      
      toast.success('Settings saved successfully');
      setIsModified(false);
      
      // Refresh the page to get updated data
      window.location.reload();
      
    } catch (error) {
      console.error('[FRONTEND] Error saving settings:', error);
      toast.error('An error occurred while saving settings');
    }
  };

  return {
    currentSettings,
    isModified,
    isLoading,
    error,
    handleSettingChange,
    handleAddSetting,
    handleDeleteSetting,
    handleSaveSettings,
    setIsModified
  };
};
