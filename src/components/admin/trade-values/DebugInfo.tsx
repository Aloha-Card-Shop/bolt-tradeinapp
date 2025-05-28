
import React from 'react';

interface DebugInfoProps {
  selectedGame: string;
  isLoading: boolean;
  settingsCount: number;
  error: string | null;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ 
  selectedGame, 
  isLoading, 
  settingsCount, 
  error 
}) => {
  return (
    <div className="mb-4 p-4 bg-gray-100 rounded">
      <h3 className="font-medium mb-2">Debug Information:</h3>
      <div className="text-sm space-y-1">
        <div>Selected Game: <code>{selectedGame}</code></div>
        <div>Loading: <code>{isLoading.toString()}</code></div>
        <div>Settings Count: <code>{settingsCount}</code></div>
        <div>Error: <code>{error || 'None'}</code></div>
        <div>Edge Function URL: <code>supabase.functions.invoke('trade-value-settings')</code></div>
      </div>
    </div>
  );
};

export default DebugInfo;
