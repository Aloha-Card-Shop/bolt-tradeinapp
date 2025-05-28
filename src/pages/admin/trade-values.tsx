
import React, { useState } from 'react';
import ApiTestPanel from '../../components/admin/ApiTestPanel';
import GameSelector from '../../components/admin/trade-values/GameSelector';
import DebugInfo from '../../components/admin/trade-values/DebugInfo';
import SettingsList from '../../components/admin/trade-values/SettingsList';
import { useTradeValueSettings } from '../../hooks/useTradeValueSettings';
import { Settings, TrendingUp } from 'lucide-react';

const TradeValuesPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('pokemon');
  
  const {
    currentSettings,
    isModified,
    isLoading,
    error,
    handleSettingChange,
    handleAddSetting,
    handleDeleteSetting,
    handleSaveSettings,
    setIsModified
  } = useTradeValueSettings(selectedGame);

  const handleGameChange = (game: string) => {
    setSelectedGame(game);
    setIsModified(false);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Trade Value Settings</h1>
          </div>
          <p className="text-gray-600">Configure trade value percentages and fixed values for different price ranges across games.</p>
        </div>
        
        {/* API Test Panel */}
        <div className="mb-6">
          <ApiTestPanel />
        </div>
        
        {/* Game Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Game Configuration</h2>
          </div>
          <GameSelector 
            selectedGame={selectedGame}
            onGameChange={handleGameChange}
          />
        </div>
        
        {/* Debug Information */}
        <div className="mb-6">
          <DebugInfo
            selectedGame={selectedGame}
            isLoading={isLoading}
            settingsCount={currentSettings.length}
            error={error}
          />
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading settings...</span>
            </div>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Settings</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Count */}
        {!isLoading && !error && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-blue-600">📊</div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  Found {currentSettings.length} settings for {selectedGame} (ordered by value range)
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <SettingsList
            settings={currentSettings}
            onSettingChange={handleSettingChange}
            onDeleteSetting={handleDeleteSetting}
            onAddSetting={handleAddSetting}
            isModified={isModified}
            onSave={handleSaveSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default TradeValuesPage;
