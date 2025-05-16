
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';
import ErrorDisplay from '../dashboard/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

interface SyncLog {
  id: string;
  trade_in_id: string;
  item_id?: string;
  status: string;
  message: string;
  created_at: string;
  created_by: string;
  created_by_user?: {
    email: string;
  };
}

interface ShopifySyncLogsProps {
  tradeInId?: string;
  limit?: number;
  showTitle?: boolean;
}

const ShopifySyncLogs: React.FC<ShopifySyncLogsProps> = ({ 
  tradeInId,
  limit = 50,
  showTitle = true
}) => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('shopify_sync_logs')
          .select(`
            *,
            created_by_user:profiles!shopify_sync_logs_created_by_fkey(email)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        // If a trade-in ID is specified, filter by it
        if (tradeInId) {
          query = query.eq('trade_in_id', tradeInId);
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) {
          throw new Error(fetchError.message);
        }
        
        setLogs(data || []);
      } catch (err) {
        console.error('Error fetching sync logs:', err);
        setError(`Failed to load sync logs: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [tradeInId, limit]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      case 'attempt':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">No sync logs found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {showTitle && <h2 className="text-xl font-semibold mb-4 p-4 border-b">Shopify Sync Logs</h2>}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade-In ID</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(log.status)}
                    <span className="ml-2 text-sm capitalize">{log.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                  {log.trade_in_id.substring(0, 8)}...
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate">
                  {log.message}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {log.created_by_user?.email ? log.created_by_user.email.split('@')[0] : log.created_by.substring(0, 6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShopifySyncLogs;
