
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface TradeValueSettings {
  game: string;
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

const TradeValuesPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('pokemon');
  const [currentSettings, setCurrentSettings] = useState<TradeValueSettings[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[Frontend] Fetching settings for game: ${selectedGame}`);
        
        // Add cache busting parameter to ensure fresh data
        const cacheBuster = Date.now();
        const response = await fetch(`/api/trade-value-settings?game=${selectedGame}&_=${cacheBuster}`);
        
        console.log(`[Frontend] Response status: ${response.status}`);
        console.log(`[Frontend] Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error(`[Frontend] Non-JSON response:`, responseText.substring(0, 200));
          throw new Error(`Expected JSON response but got ${contentType}. Response: ${responseText.substring(0, 100)}...`);
        }
        
        const data = await response.json();
        console.log(`[Frontend] Parsed data:`, data);
        
        if (Array.isArray(data)) {
          setCurrentSettings(data);
          console.log(`[Frontend] Successfully loaded ${data.length} settings`);
        } else {
          console.warn(`[Frontend] Expected array but got:`, typeof data, data);
          setCurrentSettings([]);
        }
      } catch (err: any) {
        console.error('[Frontend] Error fetching settings:', err);
        setError(err.message || 'Failed to fetch settings');
        toast.error(err.message || 'Failed to fetch settings');
        setCurrentSettings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
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
      console.log(`[Frontend] Saving ${currentSettings.length} settings for game: ${selectedGame}`, currentSettings);
      
      const response = await fetch('/api/trade-value-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: currentSettings, game: selectedGame })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[Frontend] Save error:`, errorData);
        toast.error(`Failed to save settings: ${errorData.error || response.statusText}`);
        return;
      }
      
      toast.success('Settings saved successfully');
      setIsModified(false);
      
      // Refresh the page to get updated data
      window.location.reload();
      
    } catch (error) {
      console.error('[Frontend] Error saving settings:', error);
      toast.error('An error occurred while saving settings');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Trade Value Settings</h1>
      
      <div className="mb-4">
        <label htmlFor="game" className="block text-sm font-medium text-gray-700">Select Game:</label>
        <select 
          id="game"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedGame}
          onChange={(e) => {
            console.log(`[Frontend] Changing game from ${selectedGame} to ${e.target.value}`);
            setSelectedGame(e.target.value);
            setIsModified(false);
          }}
        >
          <option value="pokemon">Pokemon</option>
          <option value="japanese-pokemon">Japanese Pokemon</option>
          <option value="magic">Magic: The Gathering</option>
        </select>
      </div>
      
      {isLoading && <div className="text-gray-500">Loading settings...</div>}
      {error && <div className="text-red-500 bg-red-50 p-3 rounded mb-4">Error: {error}</div>}
      
      {!isLoading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          Found {currentSettings.length} settings for {selectedGame}
        </div>
      )}
      
      <form onSubmit={handleSaveSettings}>
        <div className="mb-4">
          <h2 className="text-lg font-medium mb-2">Settings:</h2>
          {currentSettings.map((setting, index) => (
            <div key={index} className="border rounded p-4 mb-2">
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Value:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.min_value}
                    onChange={(e) => handleSettingChange(index, 'min_value', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Value:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.max_value}
                    onChange={(e) => handleSettingChange(index, 'max_value', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cash %:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.cash_percentage}
                    onChange={(e) => handleSettingChange(index, 'cash_percentage', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trade %:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.trade_percentage}
                    onChange={(e) => handleSettingChange(index, 'trade_percentage', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fixed Cash:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.fixed_cash_value === null ? '' : setting.fixed_cash_value}
                    onChange={(e) => handleSettingChange(index, 'fixed_cash_value', e.target.value)}
                    placeholder="Null"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fixed Trade:</label>
                  <input 
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={setting.fixed_trade_value === null ? '' : setting.fixed_trade_value}
                    onChange={(e) => handleSettingChange(index, 'fixed_trade_value', e.target.value)}
                    placeholder="Null"
                  />
                </div>
              </div>
              <button
                type="button"
                className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => handleDeleteSetting(index)}
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleAddSetting}
          >
            Add Setting
          </button>
        </div>
        
        <button 
          type="submit"
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${!isModified ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!isModified}
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

export default TradeValuesPage;
