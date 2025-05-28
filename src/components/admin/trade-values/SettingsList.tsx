
import React from 'react';
import SettingCard from './SettingCard';
import { Plus, Save, Settings } from 'lucide-react';

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
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Trade Value Settings</h2>
        {isModified && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Unsaved Changes
          </span>
        )}
      </div>
      
      <form onSubmit={onSave} className="space-y-6">
        {/* Settings Cards */}
        <div className="space-y-4">
          {settings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No settings configured</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first trade value setting.</p>
            </div>
          ) : (
            settings.map((setting, index) => (
              <SettingCard
                key={index}
                setting={setting}
                index={index}
                onSettingChange={onSettingChange}
                onDelete={onDeleteSetting}
              />
            ))
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            onClick={onAddSetting}
          >
            <Plus className="h-4 w-4" />
            Add Setting
          </button>
          
          <button 
            type="submit"
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              isModified 
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
            disabled={!isModified}
          >
            <Save className="h-4 w-4" />
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsList;
