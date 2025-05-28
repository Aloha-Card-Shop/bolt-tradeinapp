
import React, { useState } from 'react';
import ApiTestPanel from '../../components/admin/ApiTestPanel';
import GameSelector from '../../components/admin/trade-values/GameSelector';
import DebugInfo from '../../components/admin/trade-values/DebugInfo';
import SettingsList from '../../components/admin/trade-values/SettingsList';
import { useTradeValueSettings } from '../../hooks/useTradeValueSettings';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Trade Value Settings</h1>
      
      <ApiTestPanel />
      
      <GameSelector 
        selectedGame={selectedGame}
        onGameChange={handleGameChange}
        isModified={isModified}
      />
      
      <DebugInfo
        selectedGame={selectedGame}
        isLoading={isLoading}
        settingsCount={currentSettings.length}
        error={error}
      />
      
      {isLoading && <div className="text-gray-500">Loading settings...</div>}
      {error && <div className="text-red-500 bg-red-50 p-3 rounded mb-4">Error: {error}</div>}
      
      {!isLoading && !error && (
        <div className="mb-4 text-sm text-gray-600">
          Found {currentSettings.length} settings for {selectedGame}
        </div>
      )}
      
      <SettingsList
        settings={currentSettings}
        onSettingChange={handleSettingChange}
        onDeleteSetting={handleDeleteSetting}
        onAddSetting={handleAddSetting}
        isModified={isModified}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default TradeValuesPage;
