import React, { useState } from 'react';
import { RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface RefreshStats {
  games: number;
  sets: number;
  products: number;
  duration: string;
}

export const TcgDatabaseRefresh: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastStats, setLastStats] = useState<RefreshStats | null>(null);
  const [mode, setMode] = useState<'sample' | 'full'>('sample');
  const [progress, setProgress] = useState<null | {
    setOffset: number;
    nextSetOffset: number;
    processedSets: number;
    totalSets: number;
    done: boolean;
  }>(null);
  const [cancelRequested, setCancelRequested] = useState(false);
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      toast.loading('Starting TCG database refresh...');

      const { data, error } = await supabase.functions.invoke('refresh-tcg-database');

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.message || 'Refresh failed');
      }

      setLastRefresh(new Date());
      setLastStats(data.stats);
      
      toast.dismiss();
      toast.success(
        `Database refreshed successfully! ${data.stats.games} games, ${data.stats.sets} sets, ${data.stats.products} products`,
        { duration: 5000 }
      );

    } catch (error) {
      console.error('Refresh failed:', error);
      toast.dismiss();
      
      // Show more specific error message if available
      let errorMessage = 'Failed to refresh database';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">TCG Database Management</h3>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Refresh the entire TCG database with the latest data from tcgcsv.com. 
          This will replace all games, sets, and products with fresh data.
        </p>

        {lastRefresh && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Last refreshed: {lastRefresh.toLocaleDateString()} at {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            {lastStats && (
              <div className="mt-2 text-sm text-green-700">
                <span>{lastStats.games} games, {lastStats.sets} sets, {lastStats.products} products</span>
                <span className="ml-2">({lastStats.duration})</span>
              </div>
            )}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important Notes:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>This process will clear all existing TCG data</li>
                <li>The refresh may take several minutes to complete</li>
                <li>Rate limiting is applied to respect API limits</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing Database...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh TCG Database
            </>
          )}
        </button>
      </div>
    </div>
  );
};