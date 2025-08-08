import React, { useRef, useState } from 'react';
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
  const cancelRef = useRef(false);
  const handleRefresh = async () => {
    setCancelRequested(false);
    cancelRef.current = false;
    setProgress(null);
    toast.dismiss();
    try {
      setIsRefreshing(true);
      if (mode === 'sample') {
        toast.loading('Running sample refresh...');
        const { data, error } = await supabase.functions.invoke('refresh-tcg-database', {
          body: { mode: 'sample' }
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.message || 'Refresh failed');
        setLastRefresh(new Date());
        setLastStats(data.stats);
        toast.dismiss();
        toast.success(
          `Sample refresh complete: ${data.stats.games} games, ${data.stats.sets} sets, ${data.stats.products} products`,
          { duration: 5000 }
        );
      } else {
        toast.loading('Starting full refresh...');
        let offset = 0;
        // Initial call with full wipe
        let run = await supabase.functions.invoke('refresh-tcg-database', {
          body: { mode: 'full', start: true, setOffset: 0 }
        });
        if (run.error) throw new Error(run.error.message);
        if (run.data?.error) throw new Error(run.data.message || 'Refresh failed');
        setLastRefresh(new Date());
        setLastStats(run.data.stats);
        if (run.data.progress) setProgress(run.data.progress);
        offset = run.data?.progress?.nextSetOffset ?? 0;

        // Continue in chunks until done or cancelled
        while (!cancelRef.current && run.data?.progress && !run.data.progress.done) {
          run = await supabase.functions.invoke('refresh-tcg-database', {
            body: { mode: 'full', start: false, setOffset: offset }
          });
          if (run.error) throw new Error(run.error.message);
          if (run.data?.error) throw new Error(run.data.message || 'Refresh failed');
          setLastStats(run.data.stats);
          if (run.data.progress) {
            setProgress(run.data.progress);
            offset = run.data.progress.nextSetOffset ?? offset;
          } else {
            break;
          }
        }
        toast.dismiss();
        if (cancelRequested) {
          toast('Full refresh cancelled', { icon: '🛑' });
        } else {
          toast.success('Full refresh completed', { duration: 4000 });
        }
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.dismiss();
      let errorMessage = 'Failed to refresh database';
      if (error instanceof Error) errorMessage = error.message;
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
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'sample' | 'full')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isRefreshing}
          >
            <option value="sample">Sample (quick)</option>
            <option value="full">Full (chunked)</option>
          </select>
        </div>

        {mode === 'full' && progress && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <div>Processed sets: {progress.nextSetOffset} / {progress.totalSets}</div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {mode === 'full' ? 'Run Full Refresh' : 'Run Sample Refresh'}
              </>
            )}
          </button>

          {mode === 'full' && isRefreshing && (
            <button
              type="button"
              onClick={() => { setCancelRequested(true); cancelRef.current = true; }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};