
import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-yellow-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-yellow-800">Debug Information</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-yellow-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-yellow-600" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-yellow-200 bg-yellow-25">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-800">Selected Game:</span>
                <code className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-900">{selectedGame}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-800">Loading Status:</span>
                <code className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-900">{isLoading.toString()}</code>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-800">Settings Count:</span>
                <code className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-900">{settingsCount}</code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-yellow-800">Error Status:</span>
                <code className="px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-900">{error || 'None'}</code>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <span className="text-sm font-medium text-yellow-800">Edge Function:</span>
            <code className="ml-2 px-2 py-1 bg-yellow-100 rounded text-sm text-yellow-900">supabase.functions.invoke('trade-value-settings')</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;
