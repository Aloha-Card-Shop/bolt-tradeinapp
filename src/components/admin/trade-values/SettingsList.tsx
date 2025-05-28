
import React from 'react';
import SettingCard from './SettingCard';

interface TradeValueSettings {
  game: string;
  min_value: number;
  max_value: number;
  cash_percentage: number;
  trade_percentage: number;
  fixed_cash_value: number | null;
  fixed_trade_value: number | null;
}

interface SettingsListProps {
  settings: TradeValueSettings[];
  onSettingChange: (index: number, field: string, value: string | number | null) => void;
  onDeleteSetting: (index: number) => void;
  onAddSetting: () => void;
  isModified: boolean;
  onSave: (e: React.FormEvent) => void;
}

const SettingsList: React.FC<SettingsListProps> = ({
  settings,
  onSettingChange,
  onDeleteSetting,
  onAddSetting,
  isModified,
  onSave
}) => {
  return (
    <form onSubmit={onSave}>
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-2">Settings:</h2>
        {settings.map((setting, index) => (
          <SettingCard
            key={index}
            setting={setting}
            index={index}
            onSettingChange={onSettingChange}
            onDelete={onDeleteSetting}
          />
        ))}
        <button
          type="button"
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          onClick={onAddSetting}
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
  );
};

export default SettingsList;
